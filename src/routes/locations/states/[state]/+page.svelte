<script lang="ts">
	import { Heading, P, A } from 'flowbite-svelte';

	import CityMap from '$lib/components/map/map.svelte';
	import { ArrowRightAltSolid } from 'flowbite-svelte-icons';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	import LocationCardSmall from '$lib/components/locations/LocationCardSmall.svelte';
	import { browser } from '$app/environment';
	import { currentLocation } from '$lib/stores/locationStore';
	import { findState } from '../../../../utils/geoDataLoader';
	import { onMount } from 'svelte';

	$: state = $page.params.state;
	export let data: PageData;
	// Fetch cities and counties for the state
	const cityMap = new Map();
	let cities = data.locations?.sort(function (a, b) {
		if (a.city < b.city) {
			return -1;
		}
		if (a.city > b.city) {
			return 1;
		}
		return 0;
	});
	let stateName
	onMount(() => {
		stateName = findState(state || '')?.name;
	})
	cities.forEach((location) => (cityMap[location.city] = location.id));
	let userLocation: { lat: number; lng: number } | null;

	currentLocation.subscribe((value) => {
		userLocation = value;
	});
</script>

<Heading tag="h1" class="mb-4" customSize="text-4xl font-extrabold md:text-5xl"
	>{stateName?.toLocaleUpperCase()}</Heading
>

{#if browser}
	<div class="map-div">
		<CityMap
			locations={data.locations || []}
			shownLocations={data.locations || []}
			currentLocation={userLocation}
			selectedState={{ name: 'Maryland', abr: 'MD' }}
			selectedCity={null}
		/>
	</div>
{/if}
<div style="display: flex; flex-direction: column; width: 100%; gap: 0.2rem; margin-top: 1rem;">
	{#if cityMap}
		<ul>
			{#each Object.keys(cityMap) as city, index}
				<li>
					<details open={index === 0}>
						<summary class="accordion">
							<span class="inlineit">
								<h2>{city}</h2>
								<A href={`/locations/states/${state}/${city}`}>Go <ArrowRightAltSolid /></A>
							</span>
						</summary>
						<div class="panel">
							<ul class="ul-wrap">
								{#each data.locations.filter((l) => l.city === city) as location}
									<li>
										<LocationCardSmall
											name={location.name}
											coords={{ lat: location.lat, lng: location.lng }}
											address={`${`${location.address_line_1}${location.address_line_2 ? ` ${location.address_line_2}` : ''}`}, ${location.city}, ${location.state} ${location.zip_code}`}
											website={location.website}
											tags={[]}
											{location}
										/>
									</li>
								{/each}
							</ul>
						</div>
					</details>
				</li>
			{/each}
		</ul>
	{:else}
		<p>No cities found for {state.toLocaleUpperCase()}</p>
	{/if}
</div>

<!-- Display list of cities and counties, or allow user to choose -->

<style>
	/* details {
		margin: 1rem 0;
	} */
	.accordion {
		/* display: inline-flex;
		gap: 1rem; */
	}
	.inlineit {
		display: inline-flex;
		gap: 1rem;
	}
	.map-div {
		align-self: center;
		min-height: 430px;
		height: 500px;
		width: 100%;
	}
	.ul-wrap {
		display: flex;
		flex-wrap: wrap;
		width: 100%;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}
</style>
