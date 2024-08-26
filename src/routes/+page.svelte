<script lang="ts">
	import { Heading, P, TabItem, Tabs } from 'flowbite-svelte';
	import Map from '$lib/components/map/map.svelte';
	import LocationCard from '$lib/components/locations/LocationCard.svelte';
	import LocationFilters from '$lib/components/locations/LocationFilters.svelte';
	import GeoFilters from '$lib/components/locations/GeoFilters.svelte';
	import SkeletonCard from '$lib/components/shared/SkeletonCard.svelte';
	import type { PageData } from './$types';
	import { currentLocation } from '$lib/stores/locationStore';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	export let data: PageData;

	const url = 'https://tinytribeadventures.com';
	let shownLocations = [];
	let availableTagsMap: Record<string, number> = {};
	let userLocation: { lat: number; lng: number } | null = null;
	let selectedState = { name: 'Maryland', abr: 'MD' };
	let selectedCity: string | null = null;
	let selectedTab = 'gallery';
	let innerWidth = 0;
	let isLoading = true;

	$: isDesktop = innerWidth >= 768;

	currentLocation.subscribe((value) => (userLocation = value));

	onMount(async () => {
		const baseTagMap = Object.fromEntries(data.tags.map((tag) => [tag.name, 1]));
		availableTagsMap = { ...baseTagMap };

		// Simulate loading delay
		await new Promise((resolve) => setTimeout(resolve, 1000));
		shownLocations = data.locations;
		isLoading = false;
	});

	function filterLocations(tags: string[]): void {
		isLoading = true;
		setTimeout(() => {
			if (tags.length === 0) {
				shownLocations = data.locations;
			} else {
				shownLocations = data.locations.filter((location) =>
					tags.every((tag) =>
						data.locationTags.some(
							(lt) => lt.locations.name === location.name && lt.tags.name === tag
						)
					)
				);
			}
			updateAvailableTags(tags);
			isLoading = false;
		}, 300);
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

<div>
	{#if isDesktop}
		<Heading tag="h1" class="mb-4 text-4xl font-extrabold md:text-5xl">
			Welcome to Tiny Tribe Adventures
		</Heading>
	{/if}

	<Heading tag="h5" class="mb-4"
		>Your one stop shop for planning family friendly activities!</Heading
	>

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
					{#each isLoading ? Array(6) : shownLocations as location (Math.random())}
						{#if isLoading}
							<SkeletonCard />
						{:else}
							<div in:fade={{ duration: 300 }}>
								<LocationCard
									name={location.name}
									coords={{ lat: location.lat, lng: location.lng }}
									address={`${location.address_line_1}${location.address_line_2 ? ` ${location.address_line_2}` : ''}, ${location.city}, ${location.state} ${location.zip_code}`}
									website={location.website}
									tags={data.locationTags.filter((tag) => tag.locations.name === location.name)}
									{location}
									user={data?.user}
									{innerWidth}
								/>
							</div>
						{/if}
					{/each}
				</div>
			</TabItem>
			<TabItem title="Map View" on:click={() => (selectedTab = 'map')}>
				<div class="h-[500px] min-h-[430px] w-full">
					{#if isLoading}
						<div class="h-full w-full animate-pulse bg-gray-200"></div>
					{:else}
						<div in:fade={{ duration: 300 }}>
							<Map
								locations={data.locations}
								{shownLocations}
								currentLocation={userLocation}
								{selectedState}
								{selectedCity}
							/>
						</div>
					{/if}
				</div>
			</TabItem>
		</Tabs>
	</div>
</div>
