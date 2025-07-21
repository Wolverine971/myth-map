<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { Heading, P, TabItem, Tabs } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { lazy } from '../utils/lazy';
	import { derived, writable } from 'svelte/store';

	import { LazyMap, preloadCriticalComponents } from '$lib/utils/lazyComponents';
	import { filterService } from '$lib/services/filterService';
	
	const { componentStore: mapComponentStore, load: loadMap } = LazyMap;
	import LocationCard from '$lib/components/locations/LocationCard.svelte';
	import LocationFilters from '$lib/components/locations/LocationFilters.svelte';
	import GeoFilters from '$lib/components/locations/GeoFilters.svelte';
	import SkeletonCard from '$lib/components/shared/SkeletonCard.svelte';
	import ErrorState from '$lib/components/shared/ErrorState.svelte';
	import SEOHead from '$lib/components/shared/SEOHead.svelte';
	import SearchBar from '$lib/components/shared/SearchBar.svelte';
	import Pagination from '$lib/components/shared/Pagination.svelte';
	import type { PageData } from './$types';
	import { currentLocation } from '$lib/stores/locationStore';
import { dataManager } from '$lib/stores/dataManager';
import { userPreferences } from '$lib/stores/userPreferencesStore';
import type { FilterState } from '$lib/types/filters';

	export let data: PageData;

	const url = 'https://tinytribeadventures.com';
	
	// Initialize user preferences
	const prefs = userPreferences.getPreferences();
	
	// UI state variables
	let showFilterRestoreNotice = false;
	
	// Check if we should restore previous filter state
	let initialFilterState = {
		selectedTags: prefs.preferredTags,
		selectedState: prefs.defaultState,
		selectedCity: prefs.defaultCity,
		searchQuery: ''
	};
	
	if (userPreferences.shouldRestoreFilters()) {
		const lastState = userPreferences.getLastFilterState();
		if (lastState) {
			initialFilterState = lastState;
			showFilterRestoreNotice = true;
		}
	}
	
	// Filter state management - initialize with saved or default state
	const selectedTags = writable<string[]>(initialFilterState.selectedTags);
	const selectedState = writable<{ name: string; abr: string } | null>(initialFilterState.selectedState);
	const selectedCity = writable<string | null>(initialFilterState.selectedCity);
	const searchQuery = writable<string>(initialFilterState.searchQuery);
	
	let userLocation: { lat: number; lng: number } | null = null;
	let selectedTab = 'gallery';
	let innerWidth = 0;
	let isLoading = true;
	let hasError = false;
	let errorMessage = '';
	let isFiltering = false;
	
	// Pagination state - initialize with user preferences
	let currentPage = 1;
	let itemsPerPage = prefs.itemsPerPage;

	$: isDesktop = innerWidth >= 768;

	currentLocation.subscribe((value) => (userLocation = value));

	// Derived store for filtered locations using memoized service
	const filteredLocations = derived(
		[selectedTags, selectedState, selectedCity, searchQuery],
		([$selectedTags, $selectedState, $selectedCity, $searchQuery]) => {
			return filterService.getFilteredLocations(
				data.locations,
				{
					selectedTags: $selectedTags,
					selectedState: $selectedState,
					selectedCity: $selectedCity,
					searchQuery: $searchQuery
				},
				data.locationTags
			);
		}
	);

	// Derived store for available tags based on current geographic filters
	const availableTags = derived(
		[selectedState, selectedCity],
		([$selectedState, $selectedCity]) => {
			return filterService.getAvailableTags(
				data.locations,
				data.locationTags,
				$selectedState,
				$selectedCity
			);
		}
	);

	// Reactive statement for paginated locations
	$: paginatedLocations = (() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return shownLocations.slice(startIndex, endIndex);
	})();

	// Reactive variables for template
	let shownLocations = [];
	let availableTagsMap = {};
	let totalPages = 1;
	let totalFilteredItems = 0;

	// Subscribe to derived stores with filtering indicator
	let filterTimeout: number;
	filteredLocations.subscribe(value => {
		// Show filtering state for better UX
		isFiltering = true;
		clearTimeout(filterTimeout);
		
		filterTimeout = setTimeout(() => {
			shownLocations = value;
			totalFilteredItems = value.length;
			totalPages = Math.max(1, Math.ceil(totalFilteredItems / itemsPerPage));
			
			// Reset to page 1 if current page is beyond available pages
			if (currentPage > totalPages) {
				currentPage = 1;
			}
			
			isFiltering = false;
		}, 150); // Small delay to show loading state
	});


	availableTags.subscribe(value => {
		availableTagsMap = value;
	});

	onMount(async () => {
		try {
			// Cache the server data for future use
			dataManager.cacheServerData({
				locations: data.locations,
				tags: data.tags,
				locationTags: data.locationTags
			});

			// Initialize available tags
			const baseTagMap = Object.fromEntries(data.tags.map((tag) => [tag.name, 1]));
			availableTagsMap = { ...baseTagMap };

			// Check if data loaded successfully
			if (!data.locations) {
				throw new Error('Failed to load location data');
			}

			shownLocations = data.locations;
			isLoading = false;

			// Set default tab from user preferences
			selectedTab = prefs.defaultView;

			// Update activity time
			userPreferences.updateActivityTime();
			
			// Setup filter state persistence
			setupFilterPersistence();

			// Preload critical components
			preloadCriticalComponents();
		} catch (error) {
			console.error('Error loading page data:', error);
			hasError = true;
			errorMessage = error instanceof Error ? error.message : 'Failed to load data';
			isLoading = false;
		}
	});

	function handleTagFilterChange(event: CustomEvent) {
		selectedTags.set(event.detail);
		currentPage = 1; // Reset to first page when filtering
		
		// Save preferred tags to user preferences
		userPreferences.updatePreference('preferredTags', event.detail);
	}

	function handleGeoFilterChange(event: CustomEvent) {
		const { state, city } = event.detail;
		selectedState.set(state);
		selectedCity.set(city);
		currentPage = 1; // Reset to first page when filtering
		
		// Save location preferences
		userPreferences.updatePreferences({
			defaultState: state,
			defaultCity: city
		});
		
		// Clear conflicting tags when geography changes
		// This ensures tags are still valid for the new geographic scope
		selectedTags.update(currentTags => {
			return currentTags.filter(tag => availableTagsMap[tag]);
		});
	}

	async function handleTabChange(tabName: string) {
		selectedTab = tabName;
		
		// Save view preference
		userPreferences.updatePreference('defaultView', tabName as 'gallery' | 'map');
		
		if (tabName === 'map') {
			await loadMap();
		}
	}

	// Helper to clear all filters
	function clearAllFilters() {
		selectedTags.set([]);
		selectedState.set(null);
		selectedCity.set(null);
		searchQuery.set('');
		currentPage = 1; // Reset to first page
		showFilterRestoreNotice = false; // Hide restore notice
		
		// Clear saved filter state
		userPreferences.clearFilterState();
	}

	// Search handler
	function handleSearch(event: CustomEvent) {
		const query = event.detail;
		searchQuery.set(query);
		currentPage = 1; // Reset to first page when searching
		
		// Add search term to history if it's not empty
		if (query.trim()) {
			userPreferences.addSearchTerm(query.trim());
		}
	}

	// Pagination handler
	function handlePageChange(event: CustomEvent) {
		currentPage = event.detail;
		// Scroll to top of results
		document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
	}

	// Retry function for error recovery
	function retryLoadData() {
		hasError = false;
		errorMessage = '';
		isLoading = true;
		window.location.reload();
	}
	
	// Setup filter state persistence
	function setupFilterPersistence() {
		// Save filter state whenever it changes
		const unsubscribers = [
			selectedTags.subscribe(() => saveCurrentFilterState()),
			selectedState.subscribe(() => saveCurrentFilterState()),
			selectedCity.subscribe(() => saveCurrentFilterState()),
			searchQuery.subscribe(() => saveCurrentFilterState())
		];
		
		// Cleanup on unmount
		return () => {
			unsubscribers.forEach(unsub => unsub());
		};
	}
	
	// Save current filter state
	function saveCurrentFilterState() {
		const currentState = {
			selectedTags: $selectedTags,
			selectedState: $selectedState,
			selectedCity: $selectedCity,
			searchQuery: $searchQuery
		};
		userPreferences.saveFilterState(currentState);
		userPreferences.updateActivityTime();
	}
</script>

<SEOHead
	title="Tiny Tribe Adventures - Family Activity Finder"
	description="Discover amazing family-friendly activities and adventures across Maryland, Virginia, Delaware, and Washington DC. Find playgrounds, museums, restaurants, and more!"
	canonical="/"
	keywords="family activities, kids activities, Maryland activities, Virginia family fun, Delaware attractions, DC family activities, playgrounds, museums, family restaurants"
	structuredData={{
		"@context": "https://schema.org",
		"@type": "WebSite",
		"name": "Tiny Tribe Adventures",
		"description": "A tool for chronically curious families looking for their next adventure!",
		"url": "https://tinytribeadventures.com",
		"potentialAction": {
			"@type": "SearchAction",
			"target": "https://tinytribeadventures.com/search?q={search_term_string}",
			"query-input": "required name=search_term_string"
		}
	}}
/>

<svelte:window bind:innerWidth />

<main id="main-content" class="min-h-screen bg-gray-50">
	<div class="container mx-auto px-4 py-6 sm:px-6 md:py-8 lg:px-8">
		<h1 class="mb-4 text-3xl font-extrabold text-primary-700 sm:text-4xl md:text-5xl">
			Family Friendly Activity Finder
		</h1>

		<h2 class="mb-6 text-lg font-semibold text-gray-600 sm:text-xl md:text-2xl">
			Your one stop shop for planning the next family adventure!
		</h2>

		<div class="flex w-full flex-col gap-6">
			<!-- Search Bar -->
			<div class="w-full">
				<SearchBar 
					placeholder="Search by location name, city, or activity type..."
					value={$searchQuery}
					on:search={handleSearch}
					size="md"
				/>
			</div>

			<!-- Filter restore notice -->
			{#if showFilterRestoreNotice}
				<div 
					class="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center justify-between"
					transition:fade={{ duration: 300 }}
				>
					<div class="flex items-center">
						<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
						</svg>
						<span class="text-sm">Your previous filters have been restored</span>
					</div>
					<button
						on:click={() => showFilterRestoreNotice = false}
						class="text-blue-700 hover:text-blue-800 text-sm font-medium"
					>
						Dismiss
					</button>
				</div>
			{/if}

			<!-- Clear filters button -->
			{#if $selectedTags.length > 0 || $selectedState || $selectedCity || $searchQuery}
				<div class="flex justify-between items-center" transition:fade={{ duration: 200 }}>
					<div class="text-sm text-gray-600">
						{#key totalFilteredItems}
							<span in:fade={{ duration: 300 }}>
								{totalFilteredItems} of {data.locations.length} locations found
							</span>
						{/key}
						{#if totalPages > 1}
							• Page {currentPage} of {totalPages}
						{/if}
					</div>
					<button 
						on:click={clearAllFilters}
						class="rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-300 sm:px-4"
					>
						Clear All Filters
					</button>
				</div>
			{/if}

			<LocationFilters
				allTags={data.tags}
				selectableTagsMap={availableTagsMap}
				selectedTags={$selectedTags}
				on:filterChange={handleTagFilterChange}
			/>

			{#if selectedTab === 'map'}
				<GeoFilters
					on:filterChange={handleGeoFilterChange}
					{shownLocations}
					selectedState={$selectedState}
					selectedCity={$selectedCity}
				/>
			{/if}

			<div class="tab-sections">
				<Tabs tabStyle="underline" contentClass="p-2 sm:p-4 bg-transparent">
					<TabItem open title="Gallery View" on:click={() => handleTabChange('gallery')}>
						{#if hasError}
							<ErrorState 
								error={errorMessage}
								title="Unable to load locations"
								onRetry={retryLoadData}
								variant="card"
							/>
						{:else}
							<div id="results-section" class="space-y-6">
								<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
									{#each isLoading || isFiltering ? Array(8) : paginatedLocations as content_location, index (content_location?.location?.id || Math.random())}
										{#if isLoading || isFiltering}
											<SkeletonCard variant="card" />
										{:else}
											<div 
												in:fade={{ duration: 300, delay: index * 50 }}
												class="animate-in"
											>
												<LocationCard
													name={content_location.location.name}
													coords={{
														lat: content_location.location.lat,
														lng: content_location.location.lng
													}}
													address={`${content_location.location.address_line_1}${content_location.location.address_line_2 ? ` ${content_location.location.address_line_2}` : ''}, ${content_location.location.city}, ${content_location.location.state} ${content_location.location.zip_code}`}
													website={content_location.website}
													tags={data.locationTags.filter(
														(tag) => tag.location.name === content_location.location.name
													)}
													contentLocation={content_location}
													user={data?.user}
													{innerWidth}
												/>
											</div>
										{/if}
									{/each}
								</div>
								
								{#if !isLoading && !isFiltering && totalFilteredItems === 0}
									<div class="py-12 text-center">
										<p class="mb-4 text-lg text-gray-600">No locations found matching your filters.</p>
										<button 
											on:click={clearAllFilters}
											class="rounded-lg bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700"
										>
											Clear Filters
										</button>
									</div>
								{:else if !isLoading && !isFiltering && totalPages > 1}
									<Pagination
										{currentPage}
										{totalPages}
										totalItems={totalFilteredItems}
										{itemsPerPage}
										on:pageChange={handlePageChange}
									/>
								{/if}
							</div>
						{/if}
					</TabItem>
					<TabItem title="Map View" on:click={() => handleTabChange('map')}>
						<div class="h-[400px] sm:h-[500px] md:h-[600px]">
							{#if $mapComponentStore}
								<svelte:component
									this={$mapComponentStore}
									locations={data.locations}
									{shownLocations}
									currentLocation={userLocation}
									selectedState={$selectedState}
									selectedCity={$selectedCity}
								/>
							{:else}
								<!-- Map loading skeleton -->
								<div class="flex h-full w-full items-center justify-center rounded-lg bg-gray-200 animate-pulse">
									<div class="text-center">
										<div class="mb-4 h-12 w-12 mx-auto rounded-lg bg-gray-300"></div>
										<div class="h-4 w-32 mx-auto rounded bg-gray-300"></div>
										<div class="mt-2 h-3 w-24 mx-auto rounded bg-gray-250"></div>
									</div>
								</div>
							{/if}
						</div>
					</TabItem>
				</Tabs>
			</div>
		</div>
	</div>
</main>

<style>
	.tab-sections {
		border-radius: 0.5rem;
	}
</style>