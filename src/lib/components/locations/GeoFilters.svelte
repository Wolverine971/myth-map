<!-- src/lib/components/locations/GeoFilters.svelte -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { states } from '../../../utils/geoDataLoader';
	import { Dropdown, DropdownItem, Button } from 'flowbite-svelte';
	import { ChevronDownOutline, CloseCircleSolid } from 'flowbite-svelte-icons';
	import { fade } from 'svelte/transition';

	const dispatch = createEventDispatcher();

	export let selectedState: { name: string; abr: string } | null = null;
	export let selectedCity: string | null = null;
	export let shownLocations: any[] = [];

	let stateOpen = false;
	let cityOpen = false;
	let allCities: string[] = [];
	let availableCities: string[] = [];

	async function loadCitiesForState(stateAbbr: string) {
		try {
			const indexModule = await import(
				`../../../geographies/cities/${stateAbbr.toLowerCase()}/index.json`
			);
			return indexModule.default.map((city: string) =>
				city.charAt(0).toUpperCase() + 
				city.slice(1).replace('-', ' ')
			);
		} catch (error) {
			console.error(`Failed to load cities for state ${stateAbbr}:`, error);
			return [];
		}
	}

	// Update available cities based on current locations
	$: if (shownLocations && allCities.length > 0) {
		const citiesWithLocations = new Set(
			shownLocations.map(loc => loc.location.city)
		);
		availableCities = allCities.filter(city => 
			citiesWithLocations.has(city)
		);
	}

	onMount(async () => {
		if (selectedState) {
			await loadCitiesForSelectedState();
		}
	});

	async function loadCitiesForSelectedState() {
		if (!selectedState) {
			allCities = [];
			availableCities = [];
			return;
		}

		const cities = await loadCitiesForState(selectedState.abr);
		
		// Normalize city names to match your data format
		allCities = cities.map((city: string) => {
			return city
				.split(' ')
				.map(word => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ')
				.split('-')
				.map(word => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ');
		});
	}

	async function handleStateChange(state: { name: string; abr: string }) {
		selectedState = state;
		selectedCity = null; // Clear city when state changes
		
		await loadCitiesForSelectedState();
		
		dispatch('filterChange', { 
			state: selectedState, 
			city: null 
		});
		stateOpen = false;
	}

	function handleCityChange(city: string) {
		selectedCity = city;
		dispatch('filterChange', { 
			state: selectedState, 
			city: selectedCity 
		});
		cityOpen = false;
	}

	function clearState() {
		selectedState = null;
		selectedCity = null;
		allCities = [];
		availableCities = [];
		dispatch('filterChange', { 
			state: null, 
			city: null 
		});
		stateOpen = false;
	}

	function clearCity() {
		selectedCity = null;
		dispatch('filterChange', { 
			state: selectedState, 
			city: null 
		});
		cityOpen = false;
	}

	// Count locations by state/city for better UX
	$: locationCounts = {
		byState: selectedState ? shownLocations.filter(loc => 
			loc.location.state === selectedState.abr
		).length : 0,
		byCity: selectedCity ? shownLocations.filter(loc => 
			loc.location.city === selectedCity
		).length : 0
	};
</script>

<div class="mb-4">
	<div class="flex flex-wrap gap-2 items-center">
		<!-- State Filter -->
		<div class="flex items-center" transition:fade={{ duration: 800 }}>
			<Button 
				color="alternative" 
				outline
				class={selectedState ? 'ring-2 ring-primary-500' : ''}
			>
				State: {selectedState ? selectedState.name : 'Any'}
				<ChevronDownOutline class="ms-2 h-4 w-4" />
			</Button>
			<Dropdown bind:open={stateOpen} class="z-50 max-h-60 overflow-y-auto">
				<DropdownItem on:click={clearState} class="font-medium text-gray-600">
					Clear State Filter
				</DropdownItem>
				<div class="border-t border-gray-200 my-1"></div>
				{#each states as state}
					{@const stateLocationCount = shownLocations.filter(loc => 
						loc.location.state === state.abr
					).length}
					<DropdownItem 
						on:click={() => handleStateChange(state)}
						class={selectedState?.abr === state.abr ? 'bg-blue-50 font-semibold' : ''}
						disabled={stateLocationCount === 0}
					>
						<div class="flex justify-between items-center w-full">
							<span>{state.name}</span>
							<span class="text-xs text-gray-500 ml-2">
								{stateLocationCount > 0 ? `(${stateLocationCount})` : '(0)'}
							</span>
						</div>
					</DropdownItem>
				{/each}
			</Dropdown>
		</div>

		<!-- City Filter -->
		<div class="flex items-center" transition:fade={{ duration: 800 }}>
			<Button 
				color="alternative" 
				disabled={!selectedState} 
				outline
				class={selectedCity ? 'ring-2 ring-primary-500' : ''}
			>
				City: {selectedCity || 'Any'}
				<ChevronDownOutline class="ms-2 h-4 w-4" />
			</Button>
			<Dropdown bind:open={cityOpen} class="z-50 max-h-60 overflow-y-auto">
				<DropdownItem on:click={clearCity} class="font-medium text-gray-600">
					Clear City Filter
				</DropdownItem>
				<div class="border-t border-gray-200 my-1"></div>
				{#each availableCities as city}
					{@const cityLocationCount = shownLocations.filter(loc => 
						loc.location.city === city
					).length}
					<DropdownItem 
						on:click={() => handleCityChange(city)}
						class={selectedCity === city ? 'bg-blue-50 font-semibold' : ''}
						disabled={cityLocationCount === 0}
					>
						<div class="flex justify-between items-center w-full">
							<span>{city}</span>
							<span class="text-xs text-gray-500 ml-2">
								({cityLocationCount})
							</span>
						</div>
					</DropdownItem>
				{/each}
				{#if availableCities.length === 0 && selectedState}
					<DropdownItem disabled>
						No cities available with current filters
					</DropdownItem>
				{/if}
			</Dropdown>
		</div>

		<!-- Active Filters Display -->
		{#if selectedState || selectedCity}
			<div class="flex items-center gap-2 ml-4">
				{#if selectedState}
					<div class="geo-chip" transition:fade={{ duration: 200 }}>
						<span class="text-sm">📍 {selectedState.name}</span>
						<CloseCircleSolid
							withEvents
							on:click={clearState}
							class="ml-2 h-4 w-4 cursor-pointer hover:text-red-500 transition-colors"
						/>
					</div>
				{/if}
				
				{#if selectedCity}
					<div class="geo-chip" transition:fade={{ duration: 200 }}>
						<span class="text-sm">🏙️ {selectedCity}</span>
						<CloseCircleSolid
							withEvents
							on:click={clearCity}
							class="ml-2 h-4 w-4 cursor-pointer hover:text-red-500 transition-colors"
						/>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Location count display -->
		{#if selectedState || selectedCity}
			<div class="text-sm text-gray-600 ml-auto">
				{shownLocations.length} location{shownLocations.length !== 1 ? 's' : ''} found
			</div>
		{/if}
	</div>
</div>

<style>
	.geo-chip {
		background-color: #dbeafe;
		border: 1px solid #93c5fd;
		border-radius: 12px;
		padding: 0.25rem 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		transition: all 0.2s ease;
	}
	
	.geo-chip:hover {
		background-color: #bfdbfe;
		border-color: #60a5fa;
	}
</style>