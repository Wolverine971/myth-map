<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { TabItem, Tabs } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
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
	import { InfoCircleSolid, MapPinAltSolid } from 'flowbite-svelte-icons';
	import type { PageData } from './$types';
	import { currentLocation } from '$lib/stores/locationStore';
	import { dataManager } from '$lib/stores/dataManager';
	import { userPreferences } from '$lib/stores/userPreferencesStore';

	export let data: PageData;

	const prefs = userPreferences.getPreferences();

	let showFilterRestoreNotice = false;

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

	const selectedTags = writable<string[]>(initialFilterState.selectedTags);
	const selectedState = writable<{ name: string; abr: string } | null>(
		initialFilterState.selectedState
	);
	const selectedCity = writable<string | null>(initialFilterState.selectedCity);
	const searchQuery = writable<string>(initialFilterState.searchQuery);

	let userLocation: { lat: number; lng: number } | null = null;
	let selectedTab = 'gallery';
	let innerWidth = 0;
	let isLoading = true;
	let hasError = false;
	let errorMessage = '';

	let currentPage = 1;
	let itemsPerPage = prefs.itemsPerPage;

	$: isDesktop = innerWidth >= 768;

	const unsubscribeLocation = currentLocation.subscribe((value) => (userLocation = value));

	const filteredLocations = derived(
		[selectedTags, selectedState, selectedCity, searchQuery],
		([$selectedTags, $selectedState, $selectedCity, $searchQuery]) =>
			filterService.getFilteredLocations(
				data.locations,
				{
					selectedTags: $selectedTags,
					selectedState: $selectedState,
					selectedCity: $selectedCity,
					searchQuery: $searchQuery
				},
				data.locationTags
			)
	);

	const availableTags = derived([selectedState, selectedCity], ([$selectedState, $selectedCity]) =>
		filterService.getAvailableTags(data.locations, data.locationTags, $selectedState, $selectedCity)
	);

	$: shownLocations = $filteredLocations.filter(
		(l) => l?.location?.lat != null && l?.location?.lng != null
	);
	$: availableTagsMap = $availableTags;
	$: totalFilteredItems = shownLocations.length;
	$: totalPages = Math.max(1, Math.ceil(totalFilteredItems / itemsPerPage));
	$: if (currentPage > totalPages) currentPage = 1;
	$: paginatedLocations = shownLocations.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	let filterPersistenceCleanup: (() => void) | null = null;

	onMount(() => {
		try {
			dataManager.cacheServerData({
				locations: data.locations,
				tags: data.tags,
				locationTags: data.locationTags
			});

			if (!data.locations) {
				throw new Error('Failed to load location data');
			}

			isLoading = false;

			selectedTab = prefs.defaultView;
			if (selectedTab === 'map') loadMap();

			userPreferences.updateActivityTime();
			filterPersistenceCleanup = setupFilterPersistence();
			preloadCriticalComponents();
		} catch (error) {
			console.error('Error loading page data:', error);
			hasError = true;
			errorMessage = error instanceof Error ? error.message : 'Failed to load data';
			isLoading = false;
		}

		return () => {
			filterPersistenceCleanup?.();
			unsubscribeLocation();
		};
	});

	function handleTagFilterChange(event: CustomEvent) {
		selectedTags.set(event.detail);
		currentPage = 1;
		userPreferences.updatePreference('preferredTags', event.detail);
	}

	function handleGeoFilterChange(event: CustomEvent) {
		const { state, city } = event.detail;
		selectedState.set(state);
		selectedCity.set(city);
		currentPage = 1;
		userPreferences.updatePreferences({ defaultState: state, defaultCity: city });
		selectedTags.update((currentTags) => currentTags.filter((tag) => availableTagsMap[tag]));
	}

	async function handleTabChange(tabName: string) {
		selectedTab = tabName;
		userPreferences.updatePreference('defaultView', tabName as 'gallery' | 'map');
		if (tabName === 'map') {
			await loadMap();
		}
	}

	function clearAllFilters() {
		selectedTags.set([]);
		selectedState.set(null);
		selectedCity.set(null);
		searchQuery.set('');
		currentPage = 1;
		showFilterRestoreNotice = false;
		userPreferences.clearFilterState();
	}

	function handleSearch(event: CustomEvent) {
		const query = event.detail;
		searchQuery.set(query);
		currentPage = 1;
		if (query.trim()) {
			userPreferences.addSearchTerm(query.trim());
		}
	}

	function handlePageChange(event: CustomEvent) {
		currentPage = event.detail;
		document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
	}

	function retryLoadData() {
		hasError = false;
		errorMessage = '';
		isLoading = true;
		window.location.reload();
	}

	function setupFilterPersistence() {
		const unsubscribers = [
			selectedTags.subscribe(() => saveCurrentFilterState()),
			selectedState.subscribe(() => saveCurrentFilterState()),
			selectedCity.subscribe(() => saveCurrentFilterState()),
			searchQuery.subscribe(() => saveCurrentFilterState())
		];
		return () => unsubscribers.forEach((unsub) => unsub());
	}

	function saveCurrentFilterState() {
		userPreferences.saveFilterState({
			selectedTags: $selectedTags,
			selectedState: $selectedState,
			selectedCity: $selectedCity,
			searchQuery: $searchQuery
		});
		userPreferences.updateActivityTime();
	}
</script>

<SEOHead
	title="Tiny Tribe Adventures — Family-tested places for when you need ideas"
	description="A curated guide to family-friendly adventures in Maryland, Virginia, Delaware, and DC. Built parent-to-parent."
	canonical="/"
	keywords="family activities, kids activities, Maryland activities, Virginia family fun, Delaware attractions, DC family activities, playgrounds, museums"
	structuredData={{
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'Tiny Tribe Adventures',
		description: 'Family-tested places for when you need ideas.',
		url: 'https://tinytribeadventures.com'
	}}
/>

<svelte:window bind:innerWidth />

<main id="main-content" class="min-h-screen">
	<div class="container mx-auto px-4 py-6 sm:px-6 md:py-8 lg:px-8">
		<!-- Field-manual style header block -->
		<div class="mb-6 flex flex-col gap-2 border-b border-subtle pb-6">
			<div class="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted">
				<MapPinAltSolid class="h-3.5 w-3.5 text-tertiary-500" />
				<span>Field guide · DC · MD · VA · DE</span>
			</div>
			<h1 class="font-display text-3xl text-primary-700 dark:text-primary-300 sm:text-4xl">
				Family Activity Finder
			</h1>
			<p class="text-base text-muted sm:text-lg">Family-tested places for when you need ideas.</p>
		</div>

		<div class="flex w-full flex-col gap-6">
			<div class="w-full">
				<SearchBar
					placeholder="Search by name, city, or activity type…"
					value={$searchQuery}
					on:search={handleSearch}
					size="md"
				/>
			</div>

			{#if showFilterRestoreNotice}
				<div
					class="flex items-center justify-between rounded-sm border border-accent-200 bg-accent-50 px-4 py-3 text-accent-800 dark:border-accent-800 dark:bg-accent-900/20 dark:text-accent-300"
					transition:fade={{ duration: 150 }}
				>
					<div class="flex items-center gap-2">
						<InfoCircleSolid class="h-4 w-4" />
						<span class="text-sm">Your previous filters have been restored</span>
					</div>
					<button
						on:click={() => (showFilterRestoreNotice = false)}
						class="text-sm font-medium underline-offset-2 hover:underline"
					>
						Dismiss
					</button>
				</div>
			{/if}

			{#if $selectedTags.length > 0 || $selectedState || $selectedCity || $searchQuery}
				<div class="flex items-center justify-between" transition:fade={{ duration: 100 }}>
					<div class="font-mono text-xs uppercase tracking-wide text-muted">
						{#key totalFilteredItems}
							<span>{totalFilteredItems} / {data.locations.length} locations</span>
						{/key}
						{#if totalPages > 1}
							<span class="ml-2">· Page {currentPage} of {totalPages}</span>
						{/if}
					</div>
					<button
						on:click={clearAllFilters}
						class="rounded-sm border border-subtle bg-surface px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-default transition-colors duration-fast hover:border-strong hover:text-tertiary-700 dark:hover:text-tertiary-300"
					>
						Clear filters
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
								<div
									class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
								>
									{#if isLoading}
										{#each Array(8) as _, i (i)}
											<SkeletonCard variant="card" />
										{/each}
									{:else}
										{#each paginatedLocations as content_location (content_location.location.id ?? content_location.location.name)}
											<LocationCard
												name={content_location.location.name}
												coords={{
													lat: Number(content_location.location.lat),
													lng: Number(content_location.location.lng)
												}}
												address={`${content_location.location.address_line_1 ?? ''}${content_location.location.address_line_2 ? ` ${content_location.location.address_line_2}` : ''}, ${content_location.location.city}, ${content_location.location.state} ${content_location.location.zip_code ?? ''}`}
												website={content_location.website ?? ''}
												tags={data.locationTags.filter(
													(tag) => tag.location.name === content_location.location.name
												)}
												contentLocation={content_location}
												{innerWidth}
											/>
										{/each}
									{/if}
								</div>

								{#if !isLoading && totalFilteredItems === 0}
									<!-- Empty state — coordinate-style label -->
									<div class="border border-dashed border-strong bg-sunken px-6 py-12 text-center">
										<div class="mb-2 font-mono text-xs uppercase tracking-wide text-muted">
											No locations in this grid square
										</div>
										<p class="mb-4 text-base text-default">
											Adjust your filters to find more places.
										</p>
										<button
											on:click={clearAllFilters}
											class="rounded-sm bg-primary-700 px-4 py-2 font-mono text-xs uppercase tracking-wide text-white transition-colors duration-fast hover:bg-primary-600 dark:bg-primary-500 dark:text-primary-50 dark:hover:bg-primary-400"
										>
											Clear filters
										</button>
									</div>
								{:else if !isLoading && totalPages > 1}
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
								<div
									class="flex h-full w-full animate-pulse items-center justify-center rounded-sm border border-subtle bg-sunken"
								>
									<div class="text-center">
										<div class="mx-auto mb-3 h-10 w-10 rounded-sm bg-secondary-200"></div>
										<div class="mx-auto h-3 w-24 rounded-sm bg-secondary-200"></div>
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
		border-radius: 2px;
	}
</style>
