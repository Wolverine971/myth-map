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
				shownLocations = data.locations.filter((contentLocation) =>
					tags.every((tag) =>
						data.locationTags.some(
							(lt) => lt.location.name === contentLocation.location.name && lt.tags.name === tag
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

		const locationMap = new Set(shownLocations.map((l) => l.location.name));
		const newAvailableTags = {};

		data.locationTags.forEach((locationTag) => {
			if (locationMap.has(locationTag.location.name)) {
				newAvailableTags[locationTag.tags.name] = 1;
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

			<div class="tab-sections">
				<Tabs tabStyle="underline" contentClass="py-4 bg-transparent">
					<TabItem open title="Gallery View" on:click={() => (selectedTab = 'gallery')}>
						<div class="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4" style="width: 100%;">
							{#each isLoading ? Array(6) : shownLocations as content_location (Math.random())}
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
					</TabItem>
					<TabItem title="Map View" on:click={() => (selectedTab = 'map')}>
						<div class="h-[500px] min-h-[430px]">
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
