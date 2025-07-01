<!-- src/lib/components/locations/LocationFilters.svelte -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { Button, Checkbox, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ChevronDownOutline, CloseCircleSolid } from 'flowbite-svelte-icons';
	import { fade } from 'svelte/transition';

	const dispatch = createEventDispatcher();
	
	export let allTags: { name: string }[] = [];
	export let selectableTagsMap: Record<string, number> = {};
	export let selectedTags: string[] = [];

	let baseDropdownOpen = false;
	let indoorOutdoorDropdownOpen = false;
	let tagsDropdownOpen = false;
	
	let displayTags: { name: string; checked: boolean; disabled: boolean }[] = [];
	let baseSelect: string | null = null;
	let indoorOutdoorSelect: string | null = null;
	let tagsToRemove = ['both']

	onMount(() => {
		displayTags = allTags.filter(t => tagsToRemove.includes(t) ).map((tag) => ({
			...tag,
			checked: selectedTags.includes(tag.name),
			disabled: !selectableTagsMap[tag.name]
		}));
	});

	// Update display tags when selectableTagsMap changes
	$: if (selectableTagsMap && displayTags.length > 0) {
		displayTags = displayTags.map((tag) => ({
			...tag,
			disabled: !selectableTagsMap[tag.name]
		}));
	}

	// Update display tags when selectedTags changes externally
	$: if (selectedTags && displayTags.length > 0) {
		displayTags = displayTags.map((tag) => ({
			...tag,
			checked: selectedTags.includes(tag.name)
		}));
		
		// Update base selections
		baseSelect = selectedTags.includes('Activity') ? 'Activity' : 
					 selectedTags.includes('Eats') ? 'Eats' : null;
		indoorOutdoorSelect = selectedTags.includes('Indoor') ? 'Indoor' :
							 selectedTags.includes('Outdoor') ? 'Outdoor' : null;
	}

	function emitFilterChange() {
		const checkedTags = displayTags.filter(tag => tag.checked).map(tag => tag.name);
		dispatch('filterChange', checkedTags);
	}

	function updateChecked(item: { name: string }, event: Event) {
		const target = event.target as HTMLInputElement;
		
		displayTags = displayTags.map((tag) => {
			if (tag.name === item.name) {
				return { ...tag, checked: target.checked };
			}
			return tag;
		});

		emitFilterChange();
	}

	function baseSelection(event: Event) {
		const target = event.target as HTMLElement;
		const selection = target.innerText;
		
		// Clear previous base selection
		if (baseSelect && baseSelect !== selection) {
			displayTags = displayTags.map((tag) => {
				if (tag.name === baseSelect) {
					return { ...tag, checked: false };
				}
				return tag;
			});
		}

		baseSelect = selection;
		
		// Set new selection
		displayTags = displayTags.map((tag) => {
			if (tag.name === selection) {
				return { ...tag, checked: true };
			}
			return tag;
		});

		emitFilterChange();
		baseDropdownOpen = false;
	}

	function indoorOutdoorSelection(event: Event) {
		const target = event.target as HTMLElement;
		const selection = target.innerText;
		
		// Clear previous indoor/outdoor selection
		if (indoorOutdoorSelect && indoorOutdoorSelect !== selection) {
			displayTags = displayTags.map((tag) => {
				if (tag.name === indoorOutdoorSelect) {
					return { ...tag, checked: false };
				}
				return tag;
			});
		}

		indoorOutdoorSelect = selection;
		
		// Set new selection
		displayTags = displayTags.map((tag) => {
			if (tag.name === selection) {
				return { ...tag, checked: true };
			}
			return tag;
		});

		emitFilterChange();
		indoorOutdoorDropdownOpen = false;
	}

	function removeTag(tagName: string) {
		displayTags = displayTags.map((tag) => {
			if (tag.name === tagName) {
				return { ...tag, checked: false };
			}
			return tag;
		});

		// Update special selections
		if (tagName === baseSelect) {
			baseSelect = null;
		}
		if (tagName === indoorOutdoorSelect) {
			indoorOutdoorSelect = null;
		}

		emitFilterChange();
	}

	// Get checked items for display
	$: checkedItems = displayTags.filter(tag => tag.checked);

	let activeClass = 'text-orange-700 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-500';
</script>

<div class="flex flex-wrap items-center gap-1">
	<!-- Base Activity/Eats Filter -->
	<div class="flex items-center" transition:fade={{ duration: 600 }}>
		<Button outline class={baseSelect ? 'ring-2 ring-primary-500' : ''}>
			{baseSelect ? baseSelect : 'Activity/Eats: Any'}
			<ChevronDownOutline class="ms-2 h-6 w-6" />
		</Button>
		<Dropdown
			style="z-index: 1232134234"
			placement="bottom"
			bind:open={baseDropdownOpen}
			{activeClass}
		>
			<DropdownItem
				class="hover:bg-gray-100 {baseSelect === 'Activity' ? 'bg-blue-50 font-semibold' : ''}"
				on:click={baseSelection}
				disabled={!selectableTagsMap['Activity']}
			>
				Activity {!selectableTagsMap['Activity'] ? '(unavailable)' : ''}
			</DropdownItem>
			<DropdownItem
				class="hover:bg-gray-100 {baseSelect === 'Eats' ? 'bg-blue-50 font-semibold' : ''}"
				on:click={baseSelection}
				disabled={!selectableTagsMap['Eats']}
			>
				Eats {!selectableTagsMap['Eats'] ? '(unavailable)' : ''}
			</DropdownItem>
		</Dropdown>
	</div>

	<!-- Indoor/Outdoor Filter -->
	<div class="flex items-center" transition:fade={{ duration: 800 }}>
		<Button outline class={indoorOutdoorSelect ? 'ring-2 ring-primary-500' : ''}>
			{indoorOutdoorSelect ? indoorOutdoorSelect : 'Indoor/Outdoor: Any'}
			<ChevronDownOutline class="ms-2 h-6 w-6" />
		</Button>
		<Dropdown
			style="z-index: 1232134234"
			placement="bottom"
			bind:open={indoorOutdoorDropdownOpen}
			{activeClass}
		>
			<DropdownItem
				class="hover:bg-gray-100 {indoorOutdoorSelect === 'Indoor' ? 'bg-blue-50 font-semibold' : ''}"
				on:click={indoorOutdoorSelection}
				disabled={!selectableTagsMap['Indoor']}
			>
				Indoor {!selectableTagsMap['Indoor'] ? '(unavailable)' : ''}
			</DropdownItem>
			<DropdownItem
				class="hover:bg-gray-100 {indoorOutdoorSelect === 'Outdoor' ? 'bg-blue-50 font-semibold' : ''}"
				on:click={indoorOutdoorSelection}
				disabled={!selectableTagsMap['Outdoor']}
			>
				Outdoor {!selectableTagsMap['Outdoor'] ? '(unavailable)' : ''}
			</DropdownItem>
		</Dropdown>
	</div>

	<!-- Other Tags Filter -->
	<div class="flex items-center" transition:fade={{ duration: 1000 }}>
		<Button outline class={checkedItems.length > 0 ? 'ring-2 ring-primary-500' : ''}>
			Tags ({checkedItems.length})
			<ChevronDownOutline class="ms-2 h-6 w-6" />
		</Button>
		<Dropdown placement="bottom" bind:open={tagsDropdownOpen}>
			<div class="max-h-60 overflow-y-auto">
				{#each displayTags as tag (tag.name)}
					{#if tag.name !== 'Activity' && tag.name !== 'Eats' && tag.name !== 'Indoor' && tag.name !== 'Outdoor'}
						<li
							class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600 {tag.disabled ? 'opacity-50' : ''}"
							transition:fade={{ duration: 100 }}
						>
							<Checkbox
								class={tag.disabled ? 'cursor-not-allowed text-gray-400' : ''}
								on:change={(e) => {
									if (!tag.disabled) {
										updateChecked(tag, e);
									}
								}}
								bind:checked={tag.checked}
								disabled={tag.disabled}
							>
								{tag.name}
								{#if tag.disabled}
									<span class="text-xs text-gray-400 ml-1">(unavailable)</span>
								{/if}
							</Checkbox>
						</li>
					{/if}
				{/each}
			</div>
		</Dropdown>
	</div>

	<!-- Selected Tags Display -->
	{#if checkedItems.length > 0}
		<div class="flex flex-wrap gap-1 ml-4">
			{#each checkedItems as checkedItem (checkedItem.name)}
				<div class="chip" transition:fade={{ duration: 200 }}>
					<span class="text-sm">{checkedItem.name}</span>
					<CloseCircleSolid
						withEvents
						on:click={() => removeTag(checkedItem.name)}
						class="ml-2 h-4 w-4 cursor-pointer hover:text-red-500 transition-colors"
					/>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.chip {
		background-color: #f1f5f9;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		padding: 0.25rem 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		transition: all 0.2s ease;
	}
	
	.chip:hover {
		background-color: #e2e8f0;
		border-color: #cbd5e1;
	}
</style>