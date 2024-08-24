<script lang="ts">
	import { Heading, P, A } from 'flowbite-svelte';
	import type { PageData } from './$types';
	import Map from '$lib/components/map/map.svelte';
	import AddressGeoCode from '$lib/components/map/addressGeoCode.svelte';
	import { allPlaceIcons } from '../../utils/locationPhotos';
	export let data: PageData;
	const url = 'https://tinytribeadventures.com/testbed';
	let shownLocations = data.locations;
	let currentLocation = null;

	const locationPhotos = Object.keys(allPlaceIcons).map((key) => {
		return { name: key, img: allPlaceIcons[key] };
	});
</script>

<svelte:head>
	<title>Tiny Tribe Adventures</title>
	<meta
		name="description"
		content="A tool for chronically curious families looking for their next adventure!"
	/>
	<link rel="canonical" href={url} />

	<meta property="og:site_name" content="Tiny Tribe Adventures" />
	<meta property="og:title" content="Tiny Tribe Adventures Test Bed" />
	<meta
		property="og:description"
		content="A tool for chronically curious families looking for their next adventure!"
	/>
	<meta property="og:url" content={url} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content={`${url}/myth-map.png`} />
	<meta property="og:image:type" content="image/png" />
</svelte:head>

<Heading tag="h1" class="mb-4" customSize="text-4xl font-extrabold md:text-5xl">Test Bed</Heading>

<div>
	<P class="my-5 mb-6 text-left text-lg dark:text-gray-400">Photos</P>

	<div style="display: flex; flex-wrap: wrap;">
		{#each locationPhotos as icon}
			<div class="sm-box">
				<img src="/map/{icon.img || 'myth-map'}.png" alt={icon.name} width="50" />
				<P>{icon.name}</P>
				<div style="margin-top: auto;">
					<A href="/blog/locations/{icon.name.split(' ').join('-')}">link</A>
				</div>
			</div>
		{/each}
	</div>
</div>
<div>
	<P class="my-5 mb-6 text-left text-lg dark:text-gray-400">Locations</P>

	<div class="location-grid">
		{#each data?.locations as location}
			<AddressGeoCode {location} {innerWidth} user={data.user} />
		{/each}
	</div>

	<!-- <FilterMap /> -->

	<div class="map-div">
		<Map locations={data.locations} {shownLocations} {currentLocation} />
	</div>
</div>

<style>
	.sm-box {
		width: 19%;
		padding: 0.2rem;
		margin: 0.2rem;
		height: 130px;
		display: flex;
		flex-direction: column;
		border: 1px solid #e2e8f0;
		border-radius: 5px;
	}
</style>
