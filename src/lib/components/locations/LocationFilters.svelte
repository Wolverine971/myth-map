<!-- src/lib/components/locations/LocationFilters.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Checkbox, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ChevronDownOutline, CloseCircleSolid } from 'flowbite-svelte-icons';
	import { fade } from 'svelte/transition';

	const dispatch = createEventDispatcher();

	export let allTags: { name: string }[] = [];
	export let selectableTagsMap: Record<string, number> = {};
	export let selectedTags: string[] = [];

	let baseDropdownOpen = false;
	let indoorOutdoorDropdownOpen = false;
	let tagsDropdownOpen = false;

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
		baseDropdownOpen = false;
	}

	function pickIndoorOutdoor(name: string) {
		pickOneOf(INDOOR_OUTDOOR_OPTIONS, name);
		indoorOutdoorDropdownOpen = false;
	}

	function removeTag(tagName: string) {
		emit(selectedTags.filter((t) => t !== tagName));
	}

	$: checkedItems = selectedTags.filter((t) => !VIRTUAL_TAGS.has(t));

	let activeClass = 'text-primary-700 hover:text-primary-900';
</script>

<div class="flex flex-wrap items-center gap-2">
	<!-- Base Activity/Eats Filter -->
	<div class="relative">
		<button type="button" class="filter-trigger" class:filter-trigger--active={!!baseSelect}>
			<span>{baseSelect ?? 'Activity / Eats'}</span>
			<ChevronDownOutline class="h-3.5 w-3.5" />
		</button>
		<Dropdown style="z-index: 50" placement="bottom" bind:open={baseDropdownOpen} {activeClass}>
			{#if baseSelect}
				<DropdownItem
					on:click={() => {
						clearGroup(BASE_OPTIONS);
						baseDropdownOpen = false;
					}}
					class="font-medium text-neutral-600"
				>
					Any
				</DropdownItem>
				<div class="my-1 border-t border-secondary-200"></div>
			{/if}
			{#each BASE_OPTIONS as option}
				<DropdownItem
					on:click={() => pickBase(option)}
					class={baseSelect === option
						? 'bg-primary-50 font-semibold text-primary-700'
						: 'hover:bg-primary-50'}
					disabled={!selectableTagsMap[option]}
				>
					<div class="flex w-full items-center justify-between">
						<span>{option}</span>
						<span class="ml-2 text-xs text-neutral-500">{selectableTagsMap[option] ?? 0}</span>
					</div>
				</DropdownItem>
			{/each}
		</Dropdown>
	</div>

	<!-- Indoor/Outdoor Filter -->
	<div class="relative">
		<button
			type="button"
			class="filter-trigger"
			class:filter-trigger--active={!!indoorOutdoorSelect}
		>
			<span>{indoorOutdoorSelect ?? 'Indoor / Outdoor'}</span>
			<ChevronDownOutline class="h-3.5 w-3.5" />
		</button>
		<Dropdown
			style="z-index: 50"
			placement="bottom"
			bind:open={indoorOutdoorDropdownOpen}
			{activeClass}
		>
			{#if indoorOutdoorSelect}
				<DropdownItem
					on:click={() => {
						clearGroup(INDOOR_OUTDOOR_OPTIONS);
						indoorOutdoorDropdownOpen = false;
					}}
					class="font-medium text-neutral-600"
				>
					Any
				</DropdownItem>
				<div class="my-1 border-t border-secondary-200"></div>
			{/if}
			{#each INDOOR_OUTDOOR_OPTIONS as option}
				<DropdownItem
					on:click={() => pickIndoorOutdoor(option)}
					class={indoorOutdoorSelect === option
						? 'bg-primary-50 font-semibold text-primary-700'
						: 'hover:bg-primary-50'}
					disabled={!selectableTagsMap[option]}
				>
					<div class="flex w-full items-center justify-between">
						<span>{option}</span>
						<span class="ml-2 text-xs text-neutral-500">{selectableTagsMap[option] ?? 0}</span>
					</div>
				</DropdownItem>
			{/each}
		</Dropdown>
	</div>

	<!-- Tags Filter -->
	<div class="relative">
		<button
			type="button"
			class="filter-trigger"
			class:filter-trigger--active={checkedItems.length > 0}
		>
			<span>Tags{checkedItems.length > 0 ? ` (${checkedItems.length})` : ''}</span>
			<ChevronDownOutline class="h-3.5 w-3.5" />
		</button>
		<Dropdown placement="bottom" bind:open={tagsDropdownOpen}>
			<div class="max-h-60 overflow-y-auto">
				{#each displayTags as tag (tag.name)}
					<li
						class="rounded p-2 hover:bg-primary-50 {tag.disabled ? 'opacity-50' : ''}"
						transition:fade={{ duration: 100 }}
					>
						<Checkbox
							class={tag.disabled ? 'cursor-not-allowed text-gray-400' : ''}
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
			</div>
		</Dropdown>
	</div>

	<!-- Active Tag Chips (excluding virtual categories — those show on the trigger buttons) -->
	{#if checkedItems.length > 0}
		<div class="flex flex-wrap gap-1.5">
			{#each checkedItems as name (name)}
				<div class="active-chip" transition:fade={{ duration: 150 }}>
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
	.filter-trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.4375rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: theme('colors.neutral.800');
		background: #ffffff;
		border: 1px solid theme('colors.secondary.200');
		border-radius: 999px;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease,
			color 0.15s ease;
	}

	.filter-trigger:hover {
		border-color: theme('colors.primary.300');
		color: theme('colors.primary.700');
	}

	.filter-trigger--active {
		background: theme('colors.primary.50');
		border-color: theme('colors.primary.500');
		color: theme('colors.primary.700');
	}

	.active-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem 0.25rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: theme('colors.primary.700');
		background: theme('colors.primary.50');
		border: 1px solid theme('colors.primary.200');
		border-radius: 999px;
	}

	.active-chip button {
		display: inline-flex;
		color: theme('colors.primary.500');
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: color 0.15s ease;
	}

	.active-chip button:hover {
		color: theme('colors.tertiary.600');
	}
</style>
