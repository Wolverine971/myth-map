<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { Heading, P, TabItem, Tabs } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { lazy } from '../utils/lazy';
	import { derived, writable } from 'svelte/store';

	const { componentStore: mapComponentStore, load: loadMap } = lazy(
		() => import('$lib/components/map/map.svelte')
	);
	import LocationCard from '$lib/components/locations/LocationCard.svelte';
	import LocationFilters from '$lib/components/locations/LocationFilters.svelte';
	import GeoFilters from '$lib/components/locations/GeoFilters.svelte';
	import SkeletonCard from '$lib/components/shared/SkeletonCard.svelte';
	import type { PageData } from './$types';
	import { currentLocation } from '$lib/stores/locationStore';

	export let data: PageData;

	const url = 'https://tinytribeadventures.com';
	
	// Filter state management
	const selectedTags = writable<string[]>([]);
	const selectedState = writable<{ name: string; abr: string } | null>({ name: 'Maryland', abr: 'MD' });
	const selectedCity = writable<string | null>(null);
	
	let userLocation: { lat: number; lng: number } | null = null;
	let selectedTab = 'gallery';
	let innerWidth = 0;
	let isLoading = true;

	$: isDesktop = innerWidth >= 768;

	currentLocation.subscribe((value) => (userLocation = value));

	// Derived store for filtered locations
	const filteredLocations = derived(
		[selectedTags, selectedState, selectedCity],
		([$selectedTags, $selectedState, $selectedCity]) => {
			let filtered = [...data.locations];

			// Apply geographic filters first
			if ($selectedState) {
				filtered = filtered.filter(loc => 
					loc.location.state === $selectedState.abr
				);
			}

			if ($selectedCity) {
				filtered = filtered.filter(loc => 
					loc.location.city.toLowerCase() === $selectedCity.toLowerCase()
				);
			}

			// Apply tag filters
			if ($selectedTags.length > 0) {
				filtered = filtered.filter((contentLocation) =>
					$selectedTags.every((tag) =>
						data.locationTags.some(
							(lt) => 
								lt.location.name === contentLocation.location.name && 
								lt.tags.name === tag
						)
					)
				);
			}

			return filtered;
		}
	);

	// Derived store for available tags based on current geographic filters
	const availableTags = derived(
		[selectedState, selectedCity],
		([$selectedState, $selectedCity]) => {
			let locationsInScope = [...data.locations];

			// Filter by geographic selections first
			if ($selectedState) {
				locationsInScope = locationsInScope.filter(loc => 
					loc.location.state === $selectedState.abr
				);
			}

			if ($selectedCity) {
				locationsInScope = locationsInScope.filter(loc => 
					loc.location.city.toLowerCase() === $selectedCity.toLowerCase()
				);
			}

			// Get location names in scope
			const locationNamesInScope = new Set(
				locationsInScope.map(l => l.location.name)
			);

			// Find tags available for these locations
			const availableTagsMap = {};
			data.locationTags.forEach((locationTag) => {
				if (locationNamesInScope.has(locationTag.location.name)) {
					availableTagsMap[locationTag.tags.name] = 1;
				}
			});

			return availableTagsMap;
		}
	);

	// Reactive variables for template
	let shownLocations = [];
	let availableTagsMap = {};

	// Subscribe to derived stores
	filteredLocations.subscribe(value => {
		shownLocations = value;
	});

	availableTags.subscribe(value => {
		availableTagsMap = value;
	});

	onMount(async () => {
		// Initialize available tags
		const baseTagMap = Object.fromEntries(data.tags.map((tag) => [tag.name, 1]));
		availableTagsMap = { ...baseTagMap };

		// Remove artificial delay - it's unnecessary
		shownLocations = data.locations;
		isLoading = false;
	});

	function handleTagFilterChange(event: CustomEvent) {
		selectedTags.set(event.detail);
	}

	function handleGeoFilterChange(event: CustomEvent) {
		const { state, city } = event.detail;
		selectedState.set(state);
		selectedCity.set(city);
		
		// Clear conflicting tags when geography changes
		// This ensures tags are still valid for the new geographic scope
		selectedTags.update(currentTags => {
			return currentTags.filter(tag => availableTagsMap[tag]);
		});
	}

	async function handleTabChange(tabName: string) {
		selectedTab = tabName;
		if (tabName === 'map') {
			await loadMap();
		}
	}

	// Helper to clear all filters
	function clearAllFilters() {
		selectedTags.set([]);
		selectedState.set(null);
		selectedCity.set(null);
	}
</script>

<svelte:head>
	<title>Tiny Tribe Adventures</title>
	<meta
		name="description"
		content="A tool for chronically curious families looking for their next adventure!"
	/>
	<link rel="canonical" href={url} />
	<meta property="og:site_name" content="Tiny Tribe Adventures" />
	<meta property="og:title" content="Tiny Tribe Adventures home page" />
	<meta
		property="og:description"
		content="A tool for chronically curious families looking for their next adventure!"
	/>
	<meta property="og:url" content={url} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content={`${url}/myth-map.png`} />
	<meta property="og:image:type" content="image/png" />
</svelte:head>

<svelte:window bind:innerWidth />

<div class="min-h-screen bg-secondary-100" style="width: 100%;">
	<div class="container mx-auto px-2 py-8 md:px-4">
		{#if isDesktop}
			<h1 class="mb-4 text-4xl font-extrabold text-primary-500 md:text-5xl">
				Family Friendly Activity Finder
			</h1>
		{/if}

		<h2 class="mb-6 p-1 text-2xl font-bold text-neutral-700">
			Your one stop shop for planning the next family adventure!
		</h2>

		<div class="flex w-full flex-col gap-6">
			<!-- Clear filters button -->
			{#if $selectedTags.length > 0 || $selectedState || $selectedCity}
				<div class="flex justify-end">
					<button 
						on:click={clearAllFilters}
						class="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
					>
						Clear All Filters ({shownLocations.length} of {data.locations.length} shown)
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
				<Tabs tabStyle="underline" contentClass="py-4 bg-transparent">
					<TabItem open title="Gallery View" on:click={() => handleTabChange('gallery')}>
						<div class="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4" style="width: 100%;">
							{#each isLoading ? Array(6) : shownLocations as content_location (content_location?.location?.id || Math.random())}
								{#if isLoading}
									<SkeletonCard />
								{:else}
									<div in:fade={{ duration: 300 }}>
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
						
						{#if !isLoading && shownLocations.length === 0}
							<div class="text-center py-12">
								<p class="text-lg text-gray-600 mb-4">No locations found matching your filters.</p>
								<button 
									on:click={clearAllFilters}
									class="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
								>
									Clear Filters
								</button>
							</div>
						{/if}
					</TabItem>
					<TabItem title="Map View" on:click={() => handleTabChange('map')}>
						<div class="h-[500px] min-h-[430px]">
							{#if $mapComponentStore}
								<svelte:component
									this={$mapComponentStore}
									locations={data.locations}
									{shownLocations}
									currentLocation={userLocation}
									selectedState={$selectedState}
									selectedCity={$selectedCity}
								/>
							{/if}
						</div>
					</TabItem>
				</Tabs>
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.tab-sections,
	div {
		border-radius: 5px;
	}
	@media screen and (max-width: 500px) {
		.tab-sections,
		div {
			background-color: transparent !important;
			padding: 0;
			border-radius: 5px;
		}
	}
</style>