<!-- src/lib/components/locations/GeoFilters.svelte -->
<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	import { states } from '../../../utils/geoDataLoader';
	import { Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ChevronDownOutline, CloseCircleSolid } from 'flowbite-svelte-icons';

	const dispatch = createEventDispatcher();

	export let selectedState: { name: string; abr: string } | null = null;
	export let selectedCity: string | null = null;
	export let shownLocations: any[] = [];

	let stateOpen = false;
	let cityOpen = false;
	let availableCities: string[] = [];
	let stateTrigger: HTMLButtonElement;
	let cityTrigger: HTMLButtonElement;

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
		closeStateMenu();
	}

	function handleCityChange(city: string) {
		selectedCity = city;
		dispatch('filterChange', {
			state: selectedState,
			city: selectedCity
		});
		closeCityMenu();
	}

	function clearState() {
		selectedState = null;
		selectedCity = null;
		availableCities = [];
		dispatch('filterChange', {
			state: null,
			city: null
		});
		closeStateMenu();
	}

	function clearCity() {
		selectedCity = null;
		dispatch('filterChange', {
			state: selectedState,
			city: null
		});
		closeCityMenu();
	}

	function closeStateMenu() {
		stateOpen = false;
		void tick().then(() => stateTrigger?.focus());
	}

	function closeCityMenu() {
		cityOpen = false;
		void tick().then(() => cityTrigger?.focus());
	}

	function handleEscape(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		if (cityOpen) {
			closeCityMenu();
		} else if (stateOpen) {
			closeStateMenu();
		}
	}
</script>

<svelte:window on:keydown={handleEscape} />

<div class="flex flex-wrap items-center gap-2">
	<!-- State Filter -->
	<div class="relative">
		<button
			bind:this={stateTrigger}
			type="button"
			class="filter-trigger"
			class:filter-trigger--active={!!selectedState}
			aria-haspopup="dialog"
			aria-expanded={stateOpen}
			aria-controls="state-filter-menu"
		>
			<span>{selectedState ? selectedState.name : 'Any state'}</span>
			<ChevronDownOutline class="h-3.5 w-3.5" />
		</button>
		<Dropdown
			id="state-filter-menu"
			bind:open={stateOpen}
			class="z-50 max-h-60 overflow-y-auto"
			role="dialog"
			aria-label="State filter options"
		>
			<DropdownItem on:click={clearState} class="font-medium text-neutral-600">
				All states
			</DropdownItem>
			<div class="my-1 border-t border-subtle"></div>
			{#each states as state}
				{@const stateLocationCount = shownLocations.filter(
					(loc) => loc.location.state === state.abr
				).length}
				<DropdownItem
					on:click={() => stateLocationCount > 0 && handleStateChange(state)}
					aria-disabled={stateLocationCount === 0}
					class="{selectedState?.abr === state.abr
						? 'bg-primary-50 font-semibold text-primary-700'
						: ''} {stateLocationCount === 0 ? 'cursor-not-allowed opacity-50' : ''}"
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
			bind:this={cityTrigger}
			type="button"
			class="filter-trigger"
			class:filter-trigger--active={!!selectedCity}
			disabled={!selectedState}
			aria-haspopup="dialog"
			aria-expanded={cityOpen}
			aria-controls="city-filter-menu"
		>
			<span>{selectedCity ?? 'Any city'}</span>
			<ChevronDownOutline class="h-3.5 w-3.5" />
		</button>
		<Dropdown
			id="city-filter-menu"
			bind:open={cityOpen}
			class="z-50 max-h-60 overflow-y-auto"
			role="dialog"
			aria-label="City filter options"
		>
			<DropdownItem on:click={clearCity} class="font-medium text-neutral-600">
				All cities
			</DropdownItem>
			<div class="my-1 border-t border-subtle"></div>
			{#each availableCities as city}
				{@const cityLocationCount = shownLocations.filter(
					(loc) => loc.location.city === city
				).length}
				<DropdownItem
					on:click={() => cityLocationCount > 0 && handleCityChange(city)}
					aria-disabled={cityLocationCount === 0}
					class="{selectedCity === city
						? 'bg-primary-50 font-semibold text-primary-700'
						: ''} {cityLocationCount === 0 ? 'cursor-not-allowed opacity-50' : ''}"
				>
					<div class="flex w-full items-center justify-between">
						<span>{city}</span>
						<span class="ml-2 text-xs text-neutral-500">{cityLocationCount}</span>
					</div>
				</DropdownItem>
			{/each}
			{#if availableCities.length === 0 && selectedState}
				<div class="px-4 py-2 text-sm text-muted">No cities match the current filters</div>
			{/if}
		</Dropdown>
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
	.filter-trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		min-height: 2.75rem;
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

	:global(.dark) .active-chip button {
		color: theme('colors.primary.300');
	}
</style>
