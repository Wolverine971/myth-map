<script lang="ts">
	import { Heading, P, TabItem, Tabs } from 'flowbite-svelte';
	import Map from '$lib/components/map/map.svelte';
	import LocationCard from '$lib/components/locations/LocationCard.svelte';
	import LocationFilters from '$lib/components/locations/LocationFilters.svelte';
	import GeoFilters from '$lib/components/locations/GeoFilters.svelte';
	import type { PageData } from './$types';
	import { currentLocation } from '$lib/stores/locationStore';
	import { onMount } from 'svelte';

	export let data: PageData;

	const url = 'https://tinytribeadventures.com';
	let shownLocations = data.locations;
	let availableTagsMap: Record<string, number> = {};
	let userLocation: { lat: number; lng: number } | null = null;
	let selectedState = { name: 'Maryland', abr: 'MD' };
	let selectedCity: string | null = null;
	let selectedTab = 'gallery';
	let innerWidth = 0;

	$: isDesktop = innerWidth >= 768; // Changed to 768px for a more standard breakpoint

	currentLocation.subscribe((value) => (userLocation = value));

	onMount(() => {
		const baseTagMap = Object.fromEntries(data.tags.map((tag) => [tag.name, 1]));
		availableTagsMap = { ...baseTagMap };
	});

	function filterLocations(tags: string[]): void {
		if (tags.length === 0) {
			shownLocations = data.locations;
			return;
		}

		const filteredLocations = data.locations.filter((location) =>
			tags.every((tag) =>
				data.locationTags.some((lt) => lt.locations.name === location.name && lt.tags.name === tag)
			)
		);

		shownLocations = filteredLocations.length ? filteredLocations : data.locations;
		updateAvailableTags(tags);
	}

	function updateAvailableTags(selectedTags: string[]): void {
		if (selectedTags.length === 0) {
			availableTagsMap = Object.fromEntries(data.tags.map((tag) => [tag.name, 1]));
			return;
		}

		const locationMap = new Set(shownLocations.map((l) => l.name));
		const newAvailableTags = {};

		data.locationTags.forEach((location) => {
			if (locationMap.has(location.locations.name)) {
				newAvailableTags[location.tags.name] = 1;
			}
		});

		availableTagsMap = newAvailableTags;
	}

	function handleFilterChange(event: CustomEvent): void {
		selectedState = event.detail.state;
		selectedCity = event.detail.city;
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

{#if isDesktop}
	<Heading tag="h1" class="mb-4 text-4xl font-extrabold md:text-5xl">
		Welcome to Tiny Tribe Adventures
	</Heading>
{/if}

<Heading tag="h5" class="mb-4">Your one stop shop for planning family friendly activities!</Heading>

<div class="flex w-full flex-col gap-4">
	<LocationFilters
		allTags={data.tags}
		selectableTagsMap={availableTagsMap}
		on:baseSelection={({ detail }) => filterLocations(detail)}
		on:indoorOutdoorSelection={({ detail }) => filterLocations(detail)}
		on:selected={({ detail }) => filterLocations(detail)}
	/>

	{#if selectedTab === 'map'}
		<GeoFilters
			on:filterChange={handleFilterChange}
			{shownLocations}
			{selectedState}
			{selectedCity}
		/>
	{/if}

	<Tabs contentClass="">
		<TabItem open title="Gallery View" on:click={() => (selectedTab = 'gallery')}>
			<div class="grid grid-cols-2 justify-center gap-2 sm:gap-4">
				{#each shownLocations as location}
					<LocationCard
						name={location.name}
						coords={{ lat: location.lat, lng: location.lng }}
						address={`${location.address_line_1}${location.address_line_2 ? ` ${location.address_line_2}` : ''}, ${location.city}, ${location.state} ${location.zip_code}`}
						website={location.website}
						tags={data.locationTags.filter((tag) => tag.locations.name === location.name)}
						{location}
						user={data?.user}
					/>
				{/each}
			</div>
		</TabItem>
		<TabItem title="Map View" on:click={() => (selectedTab = 'map')}>
			<div class="h-[500px] min-h-[430px] w-full">
				<Map
					locations={data.locations}
					{shownLocations}
					currentLocation={userLocation}
					{selectedState}
					{selectedCity}
				/>
			</div>
		</TabItem>
	</Tabs>
</div>
