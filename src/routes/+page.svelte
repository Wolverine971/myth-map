<script lang="ts">
	import { Heading, P } from 'flowbite-svelte';
	import LocationCard from '$lib/components/locations/LocationCard.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
	const url = 'https://myth-map.vercel.app/';
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
<div>
	<P class="my-5 mb-6 text-left text-lg dark:text-gray-400">Locations</P>

	<div class="location-grid">
		{#each data.locations as location}
			<LocationCard
				name={location.name}
				address={`${`${location.address_line_1}${location.address_line_2 ? ` ${location.address_line_2}` : ''}`}, ${location.city}, ${location.state} ${location.zip_code}`}
				website={location.website}
				tag={location?.tags?.name}
			/>
		{/each}
	</div>
</div>

<style>
	.location-grid {
		display: grid;
		flex-direction: column;
		justify-content: center;
		grid-template-columns: 1fr 1fr;
	}
</style>
