<script lang="ts">
	import { Heading, P } from 'flowbite-svelte';
	import type { PageData } from './$types';
	import Map from '$lib/components/map/map.svelte';
	import AddressGeoCode from '$lib/components/map/addressGeoCode.svelte';
	export let data: PageData;
	const url = 'https://myth-map.vercel.app/testbed';
</script>

<svelte:head>
	<title>Myth-Map</title>
	<meta
		name="description"
		content="A tool for chronically curious families looking for their next adventure!"
	/>
	<link rel="canonical" href={url} />

	<meta property="og:site_name" content="Myth-Map" />
	<meta property="og:title" content="Myth-Map Test Bed" />
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
	<P class="my-5 mb-6 text-left text-lg dark:text-gray-400">Locations</P>

	<div class="location-grid">
		{#each data.locationTags as locationTags}
			<AddressGeoCode location={locationTags} />
		{/each}
	</div>

	<!-- <FilterMap /> -->

	<div class="map-div">
		<Map locations={data.locationTags} />
	</div>
</div>

<style>
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
