<!-- src/lib/components/locations/LocationFilters.svelte -->
<script lang="ts">
	import { createEventDispatcher, tick } from 'svelte';
	import { Checkbox } from 'flowbite-svelte';
	import { ChevronDownOutline, CloseCircleSolid } from 'flowbite-svelte-icons';

	const dispatch = createEventDispatcher();

	export let allTags: { name: string }[] = [];
	export let selectableTagsMap: Record<string, number> = {};
	export let selectedTags: string[] = [];

	let tagsOpen = false;
	let tagsSummary: HTMLElement;

	type TagState = { name: string; checked: boolean; disabled: boolean };

	const BASE_OPTIONS: string[] = ['Activity', 'Eats'];
	const INDOOR_OUTDOOR_OPTIONS: string[] = ['Indoor', 'Outdoor'];
	const VIRTUAL_TAGS = new Set<string>([...BASE_OPTIONS, ...INDOOR_OUTDOOR_OPTIONS]);
	const TAGS_TO_REMOVE = new Set(['both']);

	let displayTags: TagState[] = [];
	let baseSelect: string | null = null;
	let indoorOutdoorSelect: string | null = null;

	// `displayTags` only tracks concrete tags (not virtual base categories).
	// Virtual selections are tracked separately in `baseSelect` and `indoorOutdoorSelect`.
	$: displayTags = allTags
		.filter((t) => !TAGS_TO_REMOVE.has(t.name) && !VIRTUAL_TAGS.has(t.name))
		.map((tag) => ({
			name: tag.name,
			checked: selectedTags.includes(tag.name),
			disabled: !selectableTagsMap[tag.name]
		}));

	$: baseSelect = selectedTags.includes('Activity')
		? 'Activity'
		: selectedTags.includes('Eats')
			? 'Eats'
			: null;

	$: indoorOutdoorSelect = selectedTags.includes('Indoor')
		? 'Indoor'
		: selectedTags.includes('Outdoor')
			? 'Outdoor'
			: null;

	function emit(next: string[]) {
		dispatch('filterChange', next);
	}

	function toggleConcrete(name: string, checked: boolean) {
		const next = checked ? [...selectedTags, name] : selectedTags.filter((t) => t !== name);
		emit(next);
	}

	function onTagCheckboxChange(tag: TagState, event: Event) {
		if (tag.disabled) return;
		const target = event.target as HTMLInputElement;
		toggleConcrete(tag.name, target.checked);
	}

	function pickOneOf(group: string[], picked: string) {
		const without = selectedTags.filter((t) => !group.includes(t));
		emit([...without, picked]);
	}

	function clearGroup(group: string[]) {
		emit(selectedTags.filter((t) => !group.includes(t)));
	}

	function pickBase(name: string) {
		pickOneOf(BASE_OPTIONS, name);
	}

	function pickIndoorOutdoor(name: string) {
		pickOneOf(INDOOR_OUTDOOR_OPTIONS, name);
	}

	function handleBaseSelect(event: Event) {
		const value = (event.currentTarget as HTMLSelectElement).value;
		if (value) {
			pickBase(value);
		} else {
			clearGroup(BASE_OPTIONS);
		}
	}

	function handleSettingSelect(event: Event) {
		const value = (event.currentTarget as HTMLSelectElement).value;
		if (value) {
			pickIndoorOutdoor(value);
		} else {
			clearGroup(INDOOR_OUTDOOR_OPTIONS);
		}
	}

	function removeTag(tagName: string) {
		emit(selectedTags.filter((t) => t !== tagName));
	}

	$: checkedItems = selectedTags.filter((t) => !VIRTUAL_TAGS.has(t));

	function handleEscape(event: KeyboardEvent) {
		if (event.key === 'Escape' && tagsOpen) {
			event.preventDefault();
			tagsOpen = false;
			void tick().then(() => tagsSummary?.focus());
		}
	}
</script>

<svelte:window on:keydown={handleEscape} />

<div class="flex flex-wrap items-center gap-2">
	<!-- Base Activity/Eats Filter -->
	<div class="filter-control">
		<label class="sr-only" for="base-filter">Adventure type filter</label>
		<select
			id="base-filter"
			class="filter-select"
			class:filter-select--active={!!baseSelect}
			value={baseSelect ?? ''}
			on:change={handleBaseSelect}
		>
			<option value="">Activity / Eats</option>
			{#each BASE_OPTIONS as option}
				<option value={option} disabled={!selectableTagsMap[option]}>
					{option} ({selectableTagsMap[option] ?? 0})
				</option>
			{/each}
		</select>
		<ChevronDownOutline class="select-chevron h-3.5 w-3.5" aria-hidden="true" />
	</div>

	<!-- Indoor/Outdoor Filter -->
	<div class="filter-control">
		<label class="sr-only" for="setting-filter">Indoor or outdoor filter</label>
		<select
			id="setting-filter"
			class="filter-select"
			class:filter-select--active={!!indoorOutdoorSelect}
			value={indoorOutdoorSelect ?? ''}
			on:change={handleSettingSelect}
		>
			<option value="">Indoor / Outdoor</option>
			{#each INDOOR_OUTDOOR_OPTIONS as option}
				<option value={option} disabled={!selectableTagsMap[option]}>
					{option} ({selectableTagsMap[option] ?? 0})
				</option>
			{/each}
		</select>
		<ChevronDownOutline class="select-chevron h-3.5 w-3.5" aria-hidden="true" />
	</div>

	<!-- Tags Filter -->
	<details class="tags-disclosure" bind:open={tagsOpen}>
		<summary
			bind:this={tagsSummary}
			class="filter-trigger"
			class:filter-trigger--active={checkedItems.length > 0}
			aria-expanded={tagsOpen}
			aria-controls="tags-filter-menu"
		>
			<span>Tags{checkedItems.length > 0 ? ` (${checkedItems.length})` : ''}</span>
			<ChevronDownOutline class="disclosure-chevron h-3.5 w-3.5" aria-hidden="true" />
		</summary>
		<div id="tags-filter-menu" class="tag-panel" role="group" aria-label="Tag filter options">
			<ul class="tag-options">
				{#each displayTags as tag (tag.name)}
					<li
						class="rounded-sm p-2 transition-colors duration-fast hover:bg-primary-50 dark:hover:bg-primary-900 {tag.disabled
							? 'opacity-50'
							: ''}"
					>
						<Checkbox
							class={tag.disabled ? 'cursor-not-allowed text-subtle' : ''}
							on:change={(e) => onTagCheckboxChange(tag, e)}
							checked={tag.checked}
							disabled={tag.disabled}
						>
							{tag.name}
							{#if tag.disabled}
								<span class="ml-1 text-xs text-neutral-500">(none)</span>
							{/if}
						</Checkbox>
					</li>
				{/each}
			</ul>
		</div>
	</details>

	<!-- Active Tag Chips (excluding virtual categories — those show on the trigger buttons) -->
	{#if checkedItems.length > 0}
		<div class="flex flex-wrap gap-1.5">
			{#each checkedItems as name (name)}
				<div class="active-chip">
					<span>{name}</span>
					<button
						type="button"
						aria-label={`Remove ${name} filter`}
						on:click={() => removeTag(name)}
					>
						<CloseCircleSolid class="h-3.5 w-3.5" />
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.filter-control {
		position: relative;
		display: inline-flex;
		align-items: center;
	}

	.filter-select,
	.filter-trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		min-height: 2.75rem;
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

	.filter-select {
		appearance: none;
		padding: 0.4375rem 2rem 0.4375rem 0.75rem;
	}

	.filter-trigger {
		padding: 0.4375rem 0.75rem;
	}

	.filter-select:hover,
	.filter-trigger:hover {
		border-color: var(--border-strong);
		color: theme('colors.primary.700');
	}

	.filter-select:focus-visible,
	.filter-trigger:focus-visible {
		outline: 2px solid theme('colors.primary.500');
		outline-offset: 2px;
	}

	.filter-select--active,
	.filter-trigger--active {
		background: theme('colors.primary.50');
		border-color: theme('colors.primary.500');
		color: theme('colors.primary.700');
	}

	:global(.dark) .filter-select--active,
	:global(.dark) .filter-trigger--active {
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

	.tags-disclosure {
		position: relative;
	}

	.tags-disclosure > summary {
		list-style: none;
	}

	.tags-disclosure > summary::-webkit-details-marker {
		display: none;
	}

	:global(.disclosure-chevron) {
		transition: transform 100ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.tags-disclosure[open] :global(.disclosure-chevron) {
		transform: rotate(180deg);
	}

	.tag-panel {
		position: absolute;
		z-index: 50;
		top: calc(100% + 0.25rem);
		left: 0;
		width: min(20rem, calc(100vw - 2rem));
		padding: 0.375rem;
		background: var(--surface-surface);
		border: 1px solid var(--border-subtle);
		border-radius: 2px;
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.14);
	}

	.tag-options {
		max-height: 15rem;
		overflow-y: auto;
		padding: 0;
		margin: 0;
		list-style: none;
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

	@media (prefers-reduced-motion: reduce) {
		:global(.disclosure-chevron) {
			transition: none;
		}
	}
</style>
