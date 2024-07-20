<script lang="ts">
	import { Heading, P, TabItem, Tabs } from 'flowbite-svelte';

	import Map from '$lib/components/map/map.svelte';
	import LocationCard from '$lib/components/locations/LocationCard.svelte';
	import LocationFilters from '$lib/components/locations/LocationFilters.svelte';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	export let data: PageData;
	const url = 'https://myth-map.vercel.app/';

	let shownLocations = data.locations;
	let currentLocation: { lat: number; lng: number } | null = null;
	let availableTagsMap = {};
	const baseTagMap: any = {};
	let locationNamesMap = {};

	onMount(() => {
		navigator.geolocation.getCurrentPosition(currentLocationSuccess, currentLocationError, options);
		data.tags.forEach((tag) => {
			baseTagMap[tag.name] = true;
			availableTagsMap[tag.name] = 1;
		});

		data.locations.forEach((location) => {
			locationNamesMap[location.name] = true;
		});
	});

	const options = {
		enableHighAccuracy: true,
		timeout: 5000,
		maximumAge: 0
	};

	const currentLocationSuccess = (pos) => {
		const crd = pos.coords;
		currentLocation = { lat: crd.latitude, lng: crd.longitude };
	};

	const currentLocationError = (err) => {
		console.warn(`ERROR(${err.code}): ${err.message}`);
	};

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
		console.log('tags updated');
	};

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
<div style="display: flex; flex-direction: column;  gap: 1rem; width: 100%;">
	<LocationFilters
		allTags={data.tags}
		selectableTagsMap={availableTagsMap}
		on:baseSelection={({ detail }) => filterBaseLocations(detail)}
		on:indoorOutdoorSelection={({ detail }) => filterSubSelection(detail)}
		on:selected={({ detail }) => filterSubSelection(detail)}
	/>
	<Tabs>
		<TabItem open title="Gallery View">
			<div class="location-grid">
				{#each shownLocations as location}
					<LocationCard
						name={location.name}
						address={`${`${location.address_line_1}${location.address_line_2 ? ` ${location.address_line_2}` : ''}`}, ${location.city}, ${location.state} ${location.zip_code}`}
						website={location.website}
						tags={data.locationTags.filter((tag) => tag.locations.name === location.name)}
					/>
				{/each}
			</div>
		</TabItem><TabItem title="Map View"
			><div class="map-div">
				<Map locations={data.locations} {shownLocations} {currentLocation} />
			</div></TabItem
		>
	</Tabs>
</div>

<style>
	.mapboxgl-popup {
		/* visibility: visible !important; */
		background-color: #000;
		color: #fff;
		border-radius: 5px;
	}
	.mapboxgl-popup-content {
		background-color: #000;
		color: #fff;
		padding: 5px;
		border-radius: 5px;
	}

	.popup h1 {
		font-size: 2rem;
		color: aqua;
	}
	.location-grid {
		display: grid;
		flex-direction: column;
		justify-content: center;
		align-self: center;
		grid-template-columns: 1fr 1fr;
	}
	.map-div {
		/* margin-top: 2rem; */
		align-self: center;
		min-height: 430px;
		height: 500px;
		width: 100%;
	}
</style>
