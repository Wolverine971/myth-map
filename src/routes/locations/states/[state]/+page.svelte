<!-- src/routes/locations/states/[state]/+page.svelte -->
<script lang="ts">
	import { Heading, A } from 'flowbite-svelte';
	import CityMap from '$lib/components/map/map.svelte';
	import { ArrowRightAltSolid } from 'flowbite-svelte-icons';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import LocationCardSmall from '$lib/components/locations/LocationCardSmall.svelte';
	import { browser } from '$app/environment';
	import { currentLocation } from '$lib/stores/locationStore';
	import { findState } from '../../../../utils/geoDataLoader';
	import { onMount } from 'svelte';

	export let data: PageData;

	$: state = $page.params.state;
	$: cities = data.contentLocations?.sort((a, b) =>
		a.location?.city.localeCompare(b.location?.city)
	);
	$: cityMap = new Map(cities?.map((l) => [l.location?.city, l.location?.id]));

	let stateName: string;
	let userLocation: { lat: number; lng: number } | null;
	let innerWidth = 0;

	onMount(() => {
		stateName = findState(state || '')?.name || '';
	});

	currentLocation.subscribe((value) => {
		userLocation = value;
	});
</script>

<svelte:window bind:innerWidth />

<div class="container mx-auto px-2 py-8 md:px-4">
	<Heading tag="h1" customSize="text-4xl md:text-5xl font-extrabold mb-8"
		>{stateName?.toLocaleUpperCase()}</Heading
	>

	{#if browser}
		<div class="map-container mb-8">
			<CityMap
				locations={data.contentLocations || []}
				shownLocations={data.contentLocations || []}
				currentLocation={userLocation}
				selectedState={{ name: stateName, abr: state }}
				selectedCity={null}
			/>
		</div>
	{/if}

	<div class="cities-list">
		{#if cityMap.size > 0}
			{#each [...cityMap.keys()] as city, index}
				<details class="city-details" open={index === 0}>
					<summary class="city-summary">
						<h2 class="text-2xl font-bold">{city}</h2>
						<A
							href={`/locations/states/${state}/${city}`.replace(/\s/g, '-')}
							class="flex items-center"
						>
							Go <ArrowRightAltSolid class="ml-1" />
						</A>
					</summary>
					<div class="location-grid">
						{#each data.contentLocations.filter((l) => l?.location && l?.location?.city === city) as contentLocation}
							<LocationCardSmall
								name={contentLocation.location.name}
								coords={{ lat: contentLocation.location.lat, lng: contentLocation.location.lng }}
								address={`${contentLocation.location.address_line_1}${contentLocation.location.address_line_2 ? ` ${contentLocation.location.address_line_2}` : ''}, ${contentLocation.location.city}, ${contentLocation.location.state} ${contentLocation.location.zip_code}`}
								website={contentLocation.website}
								tags={[]}
								{contentLocation}
								user={data.user}
								{innerWidth}
							/>
						{/each}
					</div>
				</details>
			{/each}
		{:else}
			<p class="text-center text-gray-600">No cities found for {state.toLocaleUpperCase()}</p>
		{/if}
	</div>
</div>

<style lang="scss">
	.container {
		max-width: 1200px;
	}

	.map-container {
		height: 500px;
		min-height: 430px;
		width: 100%;
	}

	.cities-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.city-details {
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		overflow: hidden;

		&[open] {
			.city-summary {
				background-color: #f8fafc;
			}
		}
	}

	.city-summary {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		cursor: pointer;
		background-color: #ffffff;
		transition: background-color 0.3s ease;

		&:hover {
			background-color: #f1f5f9;
		}

		&::marker {
			display: none;
		}
	}

	.location-grid {
		display: grid;
		gap: 1rem;
		padding: 1rem;

		@media (min-width: 640px) {
			grid-template-columns: repeat(2, 1fr);
		}

		@media (min-width: 1024px) {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
