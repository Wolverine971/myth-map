<script lang="ts">
	import { Heading, P, TabItem, Tabs } from 'flowbite-svelte';

	import Map from '$lib/components/map/map.svelte';
	import LocationCard from '$lib/components/locations/LocationCard.svelte';
	import LocationFilters from '$lib/components/locations/LocationFilters.svelte';
	import type { PageData } from './$types';
	import { currentLocation } from '$lib/stores/locationStore';
	import { onMount } from 'svelte';
	import GeoFilters from '$lib/components/locations/GeoFilters.svelte';
	export let data: PageData;
	const url = 'https://myth-map.vercel.app/';

	let shownLocations = data.locations;
	let availableTagsMap = {};
	const baseTagMap: any = {};
	let locationNamesMap = {};
	let userLocation: { lat: number; lng: number } | null;

	let selectedState: { name: string; abr: string } | null = null;
	let selectedCity: string | null = null;
	let selectedTab = 'gallery';

	currentLocation.subscribe((value) => {
		userLocation = value;
	});

	onMount(() => {
		data.tags.forEach((tag) => {
			baseTagMap[tag.name] = true;
			availableTagsMap[tag.name] = 1;
		});

		data.locations.forEach((location) => {
			locationNamesMap[location.name] = true;
		});
	});

	const filterBaseLocations = (tags: string[]) => {
		if (tags.length === 0) {
			shownLocations = data.locations;
			return;
		}

		const tagMap = {};
		tags.forEach((tag) => {
			tagMap[tag] = true;
		});

		let filteredLocationNames: string[] = [];

		tags.forEach((tag) => {
			const availableTagLocations = {};
			data.locationTags.forEach((location) => {
				if (location.tags.name === tag) {
					availableTagLocations[location.locations.name] = 1;
				}
			});

			if (filteredLocationNames.length === 0) {
				// generate filtered location names
				Object.keys(availableTagLocations).forEach((locationName) => {
					filteredLocationNames.push(locationName);
				});
			} else {
				// filter out filtered location names
				const namesToRemove = {};
				filteredLocationNames.forEach((fLocation) => {
					if (!availableTagLocations[fLocation]) {
						namesToRemove[fLocation] = 1;
					}
				});
				filteredLocationNames = filteredLocationNames.filter(
					(fLocation) => !namesToRemove[fLocation]
				);
			}
		});

		// cleanup
		let filteredLocationsMap = {};
		filteredLocationNames.forEach((name) => {
			filteredLocationsMap[name] = true;
		});

		const filteredLocations = data.locations.filter((location) => {
			if (filteredLocationsMap[location.name]) {
				return true;
			}
		});
		shownLocations = filteredLocations.flat().length ? filteredLocations.flat() : data.locations;
	};

	const filterSubSelection = (tags: string[]) => {
		filterBaseLocations(tags);
		updateTags(tags);
	};

	// // todo
	const updateTags = (tags) => {
		if (tags.length === 0) {
			availableTagsMap = Object.assign({}, baseTagMap);
			return;
		}
		const locationMap = {};
		// const tagMap = {};

		shownLocations.forEach((l) => {
			locationMap[l?.name] = true;
		});

		const newAvailableTags = {};

		data.locationTags.forEach((location) => {
			if (locationMap[location.locations.name]) {
				newAvailableTags[location.tags.name] = 1;
			}
		});

		// steps
		// find locations with tags
		// put locations in a map
		// find tags for locations
		// those tags are the available tags
		availableTagsMap = Object.assign({}, newAvailableTags);
	};

	function handleFilterChange(event: CustomEvent) {
		selectedState = event.detail.state;
		selectedCity = event.detail.city;
	}
	let innerWidth = 0;
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

{#if innerWidth > 500}
	<Heading tag="h1" class="mb-4" customSize="text-4xl font-extrabold md:text-5xl">
		Welcome to Tiny Tribe Adventures
	</Heading>
	<Heading tag="h5">Your one stop shop for planning family friendly activities</Heading>
	<br />
{/if}

<div class="flex w-full flex-col gap-4">
	<LocationFilters
		allTags={data.tags}
		selectableTagsMap={availableTagsMap}
		on:baseSelection={({ detail }) => filterBaseLocations(detail)}
		on:indoorOutdoorSelection={({ detail }) => filterSubSelection(detail)}
		on:selected={({ detail }) => filterSubSelection(detail)}
	/>

	{#if selectedTab === 'map'}
		<GeoFilters
			on:filterChange={handleFilterChange}
			{shownLocations}
			{selectedState}
			{selectedCity}
		/>
	{/if}

	<Tabs>
		<TabItem open title="Gallery View" on:click={() => (selectedTab = 'gallery')}>
			<div class="location-grid">
				{#each shownLocations as location}
					<LocationCard
						name={location.name}
						coords={{ lat: location.lat, lng: location.lng }}
						address={`${location.address_line_1}${location.address_line_2 ? ` ${location.address_line_2}` : ''}, ${location.city}, ${location.state} ${location.zip_code}`}
						website={location.website}
						tags={data.locationTags.filter((tag) => tag.locations.name === location.name)}
					/>
				{/each}
			</div>
		</TabItem>
		<TabItem title="Map View" on:click={() => (selectedTab = 'map')}>
			<div class="map-div">
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

<style>
	.location-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		justify-content: center;
		align-self: center;
	}
	.map-div {
		align-self: center;
		min-height: 430px;
		height: 500px;
		width: 100%;
	}
</style>
