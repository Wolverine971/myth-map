<!-- src/lib/components/locations/GeoFilters.svelte -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { states } from '../../../utils/geoDataLoader';
	import { Dropdown, DropdownItem, Button } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';
	import { fade } from 'svelte/transition';

	export async function loadCitiesForState(stateAbbr: string) {
		try {
			const indexModule = await import(
				`../../../geographies/cities/${stateAbbr.toLowerCase()}/index.json`
			);
			const cityList = await indexModule.default.map((city) =>
				`${city.charAt(0).toUpperCase() + city.slice(1)}`.replace('-', ' ')
			);

			return cityList; // cityData;
		} catch (error) {
			console.error(`Failed to load cities for state ${stateAbbr}:`, error);
			return [];
		}
	}

	export let selectedState: { name: string; abr: string } | null = { name: 'Maryland', abr: 'MD' };
	export let selectedCity: string | null = null;
	let stateOpen = false;
	let cityOpen = false;

	let flatCityMap = {};
	let filteredCities: string[] = [];
	export let allCities: string[] = [];
	export let shownLocations: any[] = [];

	$: shownLocations, allCities, filterCities();

	onMount(async () => {
		if (selectedState) {
			handleStateChange(selectedState);
		}
	});

	const filterCities = () => {
		shownLocations.forEach(
			(contentLocation) => (flatCityMap[contentLocation.location.city.toLowerCase()] = 1)
		);
		filteredCities = allCities.filter((city) => flatCityMap[city.toLowerCase()]);
	};

	const dispatch = createEventDispatcher();

	async function handleStateChange(state?: { name: string; abr: string }) {
		if (state) {
			selectedState = state;
		}

		if (selectedState) {
			const tempCities = await loadCitiesForState(selectedState.abr);

			const updatedCityData = tempCities
				.map((city) => {
					const splitCity = city
						.split(' ')
						.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
						.join(' ');
					return splitCity;
				})
				.map((city) => {
					const splitCity = city
						.split('-')
						.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
						.join(' ');
					return splitCity;
				});

			allCities = updatedCityData;
			selectedCity = null;
		} else {
			allCities = [];
		}
		dispatch('filterChange', { state: selectedState, city: null });
		stateOpen = false;
	}

	function handleCityChange(city: string) {
		selectedCity = city;
		dispatch('filterChange', { state: selectedState, city: city });
		cityOpen = false;
	}

	function unselectCity() {
		selectedCity = null;
		dispatch('filterChange', { state: selectedState, city: null });
	}
</script>

<div class="mb-4">
	<div class="flex flex-wrap gap-2">
		<div class="flex items-center" transition:fade={{ duration: 800 }}>
			<Button color="alternative" outline>
				State: {selectedState ? `${selectedState.name}` : 'Any'}
				<ChevronDownOutline class="ms-2 h-4 w-4" />
			</Button>
			<Dropdown bind:open={stateOpen} class="z-50">
				{#each states as state}
					<DropdownItem on:click={() => handleStateChange(state)}>
						{state.name}
					</DropdownItem>
				{/each}
			</Dropdown>
		</div>

		<div class="flex items-center" transition:fade={{ duration: 800 }}>
			<Button color="alternative" disabled={!selectedState} outline>
				City: {selectedCity ? `${selectedCity}` : 'Any'}
				<ChevronDownOutline class="ms-2 h-4 w-4" />
			</Button>
			<Dropdown bind:open={cityOpen} class="z-50">
				<DropdownItem on:click={unselectCity}>Unselect</DropdownItem>
				{#each filteredCities as city}
					<DropdownItem on:click={() => handleCityChange(city)}>
						{city}
					</DropdownItem>
				{/each}
			</Dropdown>
		</div>
	</div>
</div>
