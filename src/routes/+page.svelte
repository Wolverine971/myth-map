<script lang="ts">
	import { Heading, P } from 'flowbite-svelte';

	import Map from '$lib/components/map/map.svelte';
	import LocationCard from '$lib/components/locations/LocationCard.svelte';
	import LocationFilters from '$lib/components/locations/LocationFilters.svelte';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	export let data: PageData;
	const url = 'https://myth-map.vercel.app/';

	let shownLocations = data.locations;
	let currentLocation: { lat: number; lng: number } = null;

	const options = {
		enableHighAccuracy: true,
		timeout: 5000,
		maximumAge: 0
	};

	function success(pos) {
		currentLocation = { lat: pos.latitude, lng: pos.longitude };
	}
	function error(err) {
		console.warn(`ERROR(${err.code}): ${err.message}`);
	}

	onMount(() => {
		navigator.geolocation.getCurrentPosition(success, error, options);
	});

	let availableTags = data.tags;
	const filterBase = (tags: string[]) => {
		const tagMap = {};
		tags.forEach((tag) => {
			tagMap[tag] = true;
		});
		const locationMap = {};
		const filteredLocations = data.locationTags
			.filter((location) => {
				if (tagMap[location.tags.name] && !locationMap[location.locations.name]) {
					locationMap[location.locations.name] = 1;
					return true;
				}
				return false;
			})
			.map((location) => location.locations);
		shownLocations = filteredLocations.flat().length ? filteredLocations.flat() : data.locations;
	};

	// // todo
	// const updateTags = () => {
	// 	const locationMap = {};
	// 	const tagMap = {};

	// 	shownLocations.forEach((location) => {
	// 		if (!locationMap[location.name]) {
	// 			locationMap[location.name] = 1;
	// 		}
	// 	});

	// 	data.locationTags.forEach((location) => {
	// 		if (locationMap[location.locations.name]) {
	// 			tagMap[location.tags.name] = 1;
	// 		}
	// 	});

	// 	const tags = Object.keys(tagMap);

	// 	availableTags = tags;
	// };
</script>

<svelte:head>
	<title>Myth-Map</title>
	<meta
		name="description"
		content="A tool for chronically curious families looking for their next adventure!"
	/>
	<link rel="canonical" href={url} />

	<meta property="og:site_name" content="Myth-Map" />
	<meta property="og:title" content="Myth-Map home page" />
	<meta
		property="og:description"
		content="A tool for chronically curious families looking for their next adventure!"
	/>
	<meta property="og:url" content={url} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content={`${url}/myth-map.png`} />
	<meta property="og:image:type" content="image/png" />
</svelte:head>

<Heading tag="h1" class="mb-4" customSize="text-4xl font-extrabold md:text-5xl">
	Welcome to Myth-map
</Heading>
<div style="display: flex; flex-direction: column; gap: 1rem;">
	<div class="map-div">
		<LocationFilters
			tags={availableTags}
			on:baseSelection={({ detail }) => filterBase(detail)}
			on:selected={({ detail }) => filterBase(detail)}
		/>
		<Map locations={data.locations} {shownLocations} {currentLocation} />
	</div>
	<hr />
	<br />
	<div>
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
	</div>
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
		grid-template-columns: 1fr 1fr;
	}
	.map-div {
		margin-top: 2rem;
		min-height: 430px;
		height: 500px;
		width: 1000px;
	}
</style>
