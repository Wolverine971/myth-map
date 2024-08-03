<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { states } from '../../../utils/geoDataLoader';
	import { Dropdown, DropdownItem, GradientButton } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';
	import { fade } from 'svelte/transition';

	export async function loadCitiesForState(stateAbbr: string) {
		try {
			const indexModule = await import(
				`../../../geographies/cities/${stateAbbr.toLowerCase()}/index.json`
			);
			const cityList = indexModule.default.map((city) =>
				`${city.charAt(0).toUpperCase() + city.slice(1)}`.replace('-', ' ')
			);

			return cityList; // cityData;
		} catch (error) {
			console.error(`Failed to load cities for state ${stateAbbr}:`, error);
			return [];
		}
	}

	export let selectedState: { name: string; abr: string } | null = null;
	export let selectedCity: string | null = null;
	let stateOpen = false;
	let cityOpen = false;

	let flatCityMap = {};
	let filteredCities: string[] = [];
	export let allCities: string[] = [];
	export let shownLocations: string[] = [];

	$: shownLocations, allCities, filterCities();

	const filterCities = () => {
		shownLocations.forEach((location) => (flatCityMap[location.city.toLowerCase()] = 1));
		filteredCities = allCities.filter((city) => flatCityMap[city.toLowerCase()]);
	};

	const dispatch = createEventDispatcher();

	async function handleStateChange(state: { name: string; abr: string }) {
		selectedState = state;
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
			console.log('updatedCityData:', updatedCityData);
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

<div class="flex gap-1">
	<div class="flex items-center" transition:fade={{ duration: 800 }}>
		<GradientButton outline color="pinkToOrange">
			State: {selectedState ? `${selectedState.name}` : 'Any'}
			<ChevronDownOutline class="ms-2 h-6 w-6 " />
		</GradientButton>
		<Dropdown style="z-index: 1232134234" placement={'bottom'} bind:open={stateOpen}>
			{#each states as state}
				<!-- <option value={state}>{state.name}</option> -->
				<DropdownItem
					class="hover:bg-gray-100 "
					activeClass={'active'}
					value={state}
					on:click={async () => handleStateChange(state)}>{state.name}</DropdownItem
				>
			{/each}
		</Dropdown>
	</div>

	<div class="flex items-center" transition:fade={{ duration: 800 }}>
		<GradientButton outline color="pinkToOrange" disabled={!selectedState}>
			City: {selectedCity ? `${selectedCity}` : 'Any'}
			<ChevronDownOutline class="ms-2 h-6 w-6 " />
		</GradientButton>
		<Dropdown style="z-index: 1232134234" placement={'bottom'} bind:open={cityOpen}>
			<DropdownItem
				class="hover:bg-gray-100 "
				activeClass={'active'}
				value=""
				on:click={async () => unselectCity()}>Unselect</DropdownItem
			>
			{#each filteredCities as city}
				<!-- <option value={state}>{state.name}</option> -->
				<DropdownItem
					class="hover:bg-gray-100 "
					activeClass={'active'}
					value={city}
					on:click={async () => handleCityChange(city)}>{city}</DropdownItem
				>
			{/each}
		</Dropdown>
	</div>
</div>
