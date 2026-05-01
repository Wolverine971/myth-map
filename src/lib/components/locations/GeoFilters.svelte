<!-- src/lib/components/locations/GeoFilters.svelte -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { states } from '../../../utils/geoDataLoader';
	import { Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ChevronDownOutline, CloseCircleSolid, GlobeOutline } from 'flowbite-svelte-icons';
	import { fade } from 'svelte/transition';
	import { cityDataCache } from '$lib/stores/dataManager';

	const dispatch = createEventDispatcher();

	export let selectedState: { name: string; abr: string } | null = null;
	export let selectedCity: string | null = null;
	export let shownLocations: any[] = [];

	let stateOpen = false;
	let cityOpen = false;
	let allCities: string[] = [];
	let availableCities: string[] = [];
	let citiesLoading = false;

	// Update available cities based on current locations
	$: if (shownLocations && allCities.length > 0) {
		const citiesWithLocations = new Set(shownLocations.map((loc) => loc.location.city));
		availableCities = allCities.filter((city) => citiesWithLocations.has(city));
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

		citiesLoading = true;
		try {
			// Use cached city data
			allCities = await cityDataCache.getCityData(selectedState.abr);
		} catch (error) {
			console.error('Failed to load cities:', error);
			allCities = [];
		} finally {
			citiesLoading = false;
		}
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
		byState: selectedState
			? shownLocations.filter((loc) => loc.location.state === selectedState.abr).length
			: 0,
		byCity: selectedCity
			? shownLocations.filter((loc) => loc.location.city === selectedCity).length
			: 0
	};
</script>

<div class="flex flex-wrap items-center gap-2">
	<!-- State Filter -->
	<div class="relative">
		<button type="button" class="filter-trigger" class:filter-trigger--active={!!selectedState}>
			<span>{selectedState ? selectedState.name : 'Any state'}</span>
			<ChevronDownOutline class="h-3.5 w-3.5" />
		</button>
		<Dropdown bind:open={stateOpen} class="z-50 max-h-60 overflow-y-auto">
			<DropdownItem on:click={clearState} class="font-medium text-neutral-600">
				All states
			</DropdownItem>
			<div class="my-1 border-t border-subtle"></div>
			{#each states as state}
				{@const stateLocationCount = shownLocations.filter(
					(loc) => loc.location.state === state.abr
				).length}
				<DropdownItem
					on:click={() => handleStateChange(state)}
					class={selectedState?.abr === state.abr
						? 'bg-primary-50 font-semibold text-primary-700'
						: ''}
					disabled={stateLocationCount === 0}
				>
					<div class="flex w-full items-center justify-between">
						<span>{state.name}</span>
						<span class="ml-2 text-xs text-neutral-500">{stateLocationCount}</span>
					</div>
				</DropdownItem>
			{/each}
		</Dropdown>
	</div>

	<!-- City Filter -->
	<div class="relative">
		<button
			type="button"
			class="filter-trigger"
			class:filter-trigger--active={!!selectedCity}
			disabled={!selectedState || citiesLoading}
		>
			{#if citiesLoading}
				<GlobeOutline class="h-3.5 w-3.5 animate-spin" />
				<span>Loading…</span>
			{:else}
				<span>{selectedCity ?? 'Any city'}</span>
				<ChevronDownOutline class="h-3.5 w-3.5" />
			{/if}
		</button>
		<Dropdown bind:open={cityOpen} class="z-50 max-h-60 overflow-y-auto">
			{#if citiesLoading}
				<DropdownItem disabled>
					<GlobeOutline class="me-2 inline h-4 w-4 animate-spin" />
					Loading cities…
				</DropdownItem>
			{:else}
				<DropdownItem on:click={clearCity} class="font-medium text-neutral-600">
					All cities
				</DropdownItem>
				<div class="my-1 border-t border-subtle"></div>
				{#each availableCities as city}
					{@const cityLocationCount = shownLocations.filter(
						(loc) => loc.location.city === city
					).length}
					<DropdownItem
						on:click={() => handleCityChange(city)}
						class={selectedCity === city ? 'bg-primary-50 font-semibold text-primary-700' : ''}
						disabled={cityLocationCount === 0}
					>
						<div class="flex w-full items-center justify-between">
							<span>{city}</span>
							<span class="ml-2 text-xs text-neutral-500">{cityLocationCount}</span>
						</div>
					</DropdownItem>
				{/each}
				{#if availableCities.length === 0 && selectedState}
					<DropdownItem disabled>No cities match the current filters</DropdownItem>
				{/if}
			{/if}
		</Dropdown>
	</div>

	{#if selectedState || selectedCity}
		<div class="flex flex-wrap items-center gap-1.5">
			{#if selectedState}
				<div class="active-chip" transition:fade={{ duration: 150 }}>
					<span>{selectedState.name}</span>
					<button type="button" aria-label="Clear state filter" on:click={clearState}>
						<CloseCircleSolid class="h-3.5 w-3.5" />
					</button>
				</div>
			{/if}
			{#if selectedCity}
				<div class="active-chip" transition:fade={{ duration: 150 }}>
					<span>{selectedCity}</span>
					<button type="button" aria-label="Clear city filter" on:click={clearCity}>
						<CloseCircleSolid class="h-3.5 w-3.5" />
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.filter-trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.4375rem 0.75rem;
		font-family: theme('fontFamily.mono');
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-default);
		background: var(--surface-surface);
		border: 1px solid var(--border-subtle);
		border-radius: 2px;
		cursor: pointer;
		transition:
			background-color 100ms cubic-bezier(0.22, 1, 0.36, 1),
			border-color 100ms cubic-bezier(0.22, 1, 0.36, 1),
			color 100ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.filter-trigger:hover:not(:disabled) {
		border-color: var(--border-strong);
		color: theme('colors.primary.700');
	}

	.filter-trigger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.filter-trigger--active {
		background: theme('colors.primary.50');
		border-color: theme('colors.primary.500');
		color: theme('colors.primary.700');
	}

	:global(.dark) .filter-trigger--active {
		background: theme('colors.primary.900');
		border-color: theme('colors.primary.400');
		color: theme('colors.primary.200');
	}

	.active-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem 0.25rem 0.625rem;
		font-family: theme('fontFamily.mono');
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: theme('colors.primary.700');
		background: theme('colors.primary.50');
		border: 1px solid theme('colors.primary.200');
		border-radius: 2px;
	}

	:global(.dark) .active-chip {
		color: theme('colors.primary.200');
		background: theme('colors.primary.900');
		border-color: theme('colors.primary.700');
	}

	.active-chip button {
		display: inline-flex;
		color: theme('colors.primary.500');
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: color 100ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.active-chip button:hover {
		color: theme('colors.tertiary.600');
	}

	:global(.dark) .active-chip button {
		color: theme('colors.primary.300');
	}
</style>
