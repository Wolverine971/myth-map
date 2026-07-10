<!-- src/lib/components/locations/GeoFilters.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { states } from '../../../utils/geoDataLoader';
	import { ChevronDownOutline, CloseCircleSolid } from 'flowbite-svelte-icons';

	const dispatch = createEventDispatcher();

	export let selectedState: { name: string; abr: string } | null = null;
	export let selectedCity: string | null = null;
	export let shownLocations: any[] = [];

	let availableCities: string[] = [];

	// The location dataset is the source of truth for selectable cities. This
	// avoids bundling hundreds of unrelated boundary filenames just to populate
	// a filter that can only return cities with locations.
	$: availableCities = selectedState
		? [
				...new Set(
					shownLocations
						.filter((item) => item.location.state === selectedState?.abr)
						.map((item) => item.location.city)
						.filter(Boolean)
				)
			].sort()
		: [];

	function handleStateChange(state: { name: string; abr: string }) {
		selectedState = state;
		selectedCity = null; // Clear city when state changes

		dispatch('filterChange', {
			state: selectedState,
			city: null
		});
	}

	function handleCityChange(city: string) {
		selectedCity = city;
		dispatch('filterChange', {
			state: selectedState,
			city: selectedCity
		});
	}

	function handleStateSelect(event: Event) {
		const abbreviation = (event.currentTarget as HTMLSelectElement).value;
		if (!abbreviation) {
			clearState();
			return;
		}

		const state = states.find((candidate) => candidate.abr === abbreviation);
		if (state) handleStateChange(state);
	}

	function handleCitySelect(event: Event) {
		const city = (event.currentTarget as HTMLSelectElement).value;
		if (city) {
			handleCityChange(city);
		} else {
			clearCity();
		}
	}

	function clearState() {
		selectedState = null;
		selectedCity = null;
		availableCities = [];
		dispatch('filterChange', {
			state: null,
			city: null
		});
	}

	function clearCity() {
		selectedCity = null;
		dispatch('filterChange', {
			state: selectedState,
			city: null
		});
	}
</script>

<div class="flex flex-wrap items-center gap-2">
	<!-- State Filter -->
	<div class="filter-control">
		<label class="sr-only" for="state-filter">State filter</label>
		<select
			id="state-filter"
			class="filter-select"
			class:filter-select--active={!!selectedState}
			value={selectedState?.abr ?? ''}
			on:change={handleStateSelect}
		>
			<option value="">Any state</option>
			{#each states as state}
				{@const stateLocationCount = shownLocations.filter(
					(loc) => loc.location.state === state.abr
				).length}
				<option value={state.abr} disabled={stateLocationCount === 0}>
					{state.name} ({stateLocationCount})
				</option>
			{/each}
		</select>
		<ChevronDownOutline class="select-chevron h-3.5 w-3.5" aria-hidden="true" />
	</div>

	<!-- City Filter -->
	<div class="filter-control">
		<label class="sr-only" for="city-filter">City filter</label>
		<select
			id="city-filter"
			class="filter-select"
			class:filter-select--active={!!selectedCity}
			value={selectedCity ?? ''}
			disabled={!selectedState}
			on:change={handleCitySelect}
		>
			<option value="">Any city</option>
			{#each availableCities as city}
				{@const cityLocationCount = shownLocations.filter(
					(loc) => loc.location.state === selectedState?.abr && loc.location.city === city
				).length}
				<option value={city} disabled={cityLocationCount === 0}>
					{city} ({cityLocationCount})
				</option>
			{/each}
		</select>
		<ChevronDownOutline class="select-chevron h-3.5 w-3.5" aria-hidden="true" />
	</div>

	{#if selectedState || selectedCity}
		<div class="flex flex-wrap items-center gap-1.5">
			{#if selectedState}
				<div class="active-chip">
					<span>{selectedState.name}</span>
					<button type="button" aria-label="Clear state filter" on:click={clearState}>
						<CloseCircleSolid class="h-3.5 w-3.5" />
					</button>
				</div>
			{/if}
			{#if selectedCity}
				<div class="active-chip">
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
	.filter-control {
		position: relative;
		display: inline-flex;
		align-items: center;
	}

	.filter-select {
		appearance: none;
		min-height: 2.75rem;
		padding: 0.4375rem 2rem 0.4375rem 0.75rem;
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

	.filter-select:hover:not(:disabled) {
		border-color: var(--border-strong);
		color: theme('colors.primary.700');
	}

	.filter-select:focus-visible {
		outline: 2px solid theme('colors.primary.500');
		outline-offset: 2px;
	}

	.filter-select:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.filter-select--active {
		background: theme('colors.primary.50');
		border-color: theme('colors.primary.500');
		color: theme('colors.primary.700');
	}

	:global(.dark) .filter-select--active {
		background: theme('colors.primary.900');
		border-color: theme('colors.primary.400');
		color: theme('colors.primary.200');
	}

	:global(.select-chevron) {
		position: absolute;
		right: 0.625rem;
		pointer-events: none;
		color: var(--text-muted);
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
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
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

	.active-chip button:focus-visible {
		outline: 2px solid theme('colors.primary.500');
		outline-offset: 1px;
	}

	:global(.dark) .active-chip button {
		color: theme('colors.primary.300');
	}
</style>
