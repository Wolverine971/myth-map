<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { Button, Checkbox, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ChevronDownOutline, CloseCircleSolid } from 'flowbite-svelte-icons';

	import { fade } from 'svelte/transition';
	// import { availableTagsStore } from '../../../stores';

	// let selectableTagsMap;
	// availableTagsStore.subscribe((value) => {
	// 	selectableTagsMap = value;
	// });

	const dispatch = createEventDispatcher();
	export let allTags: { name: string }[] = [];
	export let selectableTagsMap;
	export let locationTags: any[] = [];
	let baseDropdownOpen = false;
	let indoorOutdoorDropdownOpen = false;
	let checkedItems: { name: string; checked: boolean }[] = [];
	let displayTags: { name: string; checked: boolean; disabled: boolean }[] = [];
	let baseSelect: string | null = null;
	let indoorOutdoorSelect: string | null = null;

	onMount(() => {
		displayTags = allTags.map((tag) => {
			return { ...tag, checked: false, disabled: false };
		});
	});

	let clicks = 0;

	// $: selectableTagsMap,
	// 	() => {
	// 		clicks += 1;
	// 		displayTags = displayTags.map((tag) => {
	// 			if (selectableTagsMap[tag.name]) {
	// 				tag.disabled = false;
	// 			} else {
	// 				tag.disabled = true;
	// 			}
	// 			return tag;
	// 		});
	// 	};
	const updateChecked = (item, event) => {
		displayTags.forEach((tag) => {
			if (tag.name === item.name) {
				tag.checked = event.target.checked;
			}
		});

		checkedItems = displayTags.filter((tag) => tag.checked);

		dispatch(
			'selected',
			checkedItems.map((tag) => tag.name)
		);
		// moreDropdownOpen = false;
	};

	const baseSelection = (e) => {
		// dispatch('baseSelection', [e.target.innerText]);
		baseSelect = e.target.innerText;
		const selectedItem = displayTags.find((tag) => tag.name === e.target.innerText);
		selectedItem.checked = true;

		checkedItems = [...displayTags.filter((tag) => tag.checked)];

		dispatch(
			'baseSelection',
			checkedItems.map((tag) => tag.name)
		);
		baseDropdownOpen = false;
	};

	const indoorOutdoorSelection = (e) => {
		// dispatch('baseSelection', [e.target.innerText]);
		indoorOutdoorSelect = e.target.innerText;
		const selectedItem = displayTags.find((tag) => tag.name === e.target.innerText);
		selectedItem.checked = true;

		checkedItems = [...displayTags.filter((tag) => tag.checked)];
		dispatch(
			'indoorOutdoorSelection',
			checkedItems.map((tag) => tag.name)
		);
		indoorOutdoorDropdownOpen = false;
	};

	const closeBtn = (name: string) => {
		displayTags.forEach((tag) => {
			if (tag.name === name) {
				tag.checked = false;
			}
			return tag;
		});
		checkedItems = displayTags.filter((tag) => tag.checked);
		if (name === baseSelect) {
			baseSelect = null;
		}
		if (name === 'Activity' || name === 'Food') {
			baseSelect = null;
			dispatch(
				'baseSelection',
				checkedItems.map((tag) => tag.name)
			);
		} else if (name === 'Outdoor' || name === 'Indoor') {
			indoorOutdoorSelect = null;
			dispatch(
				'indoorOutdoorSelection',
				checkedItems.map((tag) => tag.name)
			);
		} else {
			dispatch(
				'selected',
				checkedItems.map((tag) => tag.name)
			);
		}
	};

	let activeClass =
		'text-orange-700 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-500';
</script>

<div class="flex flex-wrap items-center gap-1">
	<div class="flex items-center">
		<!-- <label for="search" class="mr-2">Search:</label>
			<input type="text" id="search" class="form-input" placeholder="Search..." /> -->
		<Button>
			Location Type: {baseSelect ? `${baseSelect}` : 'Any'}
			<ChevronDownOutline class="ms-2 h-6 w-6 text-white dark:text-white" />
		</Button>
		<Dropdown
			style="z-index: 1232134234"
			placement={'bottom'}
			bind:open={baseDropdownOpen}
			{activeClass}
		>
			<DropdownItem
				class="hover:bg-gray-100 {baseSelect === 'Activity' && 'active'}"
				activeClass={'active'}
				on:click={baseSelection}>Activity</DropdownItem
			>
			<DropdownItem
				class="hover:bg-gray-100 {baseSelect === 'Food' && 'active'}"
				activeClass={'active'}
				on:click={baseSelection}>Food</DropdownItem
			>
		</Dropdown>
	</div>
	<div class="flex items-center">
		<!-- <label for="search" class="mr-2">Search:</label>
			<input type="text" id="search" class="form-input" placeholder="Search..." /> -->
		<Button>
			Location Type: {indoorOutdoorSelect ? `${indoorOutdoorSelect}` : 'Any'}
			<ChevronDownOutline class="ms-2 h-6 w-6 text-white dark:text-white" />
		</Button>
		<Dropdown
			style="z-index: 1232134234"
			placement={'bottom'}
			bind:open={indoorOutdoorDropdownOpen}
			{activeClass}
		>
			<DropdownItem
				class="hover:bg-gray-100 {indoorOutdoorSelect === 'Indoor' && 'active'}"
				activeClass={'active'}
				on:click={indoorOutdoorSelection}>Indoor</DropdownItem
			>
			<DropdownItem
				class="hover:bg-gray-100 {indoorOutdoorSelect === 'Outdoor' && 'active'}"
				activeClass={'active'}
				on:click={indoorOutdoorSelection}>Outdoor</DropdownItem
			>
		</Dropdown>
	</div>
	<div class="flex items-center" transition:fade={{ duration: 1000 }} style="z-index: 123423543;">
		<Button>
			Tags ({checkedItems.length})
			<ChevronDownOutline class="ms-2 h-6 w-6 text-white dark:text-white" />
		</Button>
		<Dropdown placement={'bottom'}>
			{#each displayTags as tag}
				<li
					class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600 {!selectableTagsMap[
						tag.name
					] && 'disabled'}"
					transition:fade={{ duration: 100 }}
				>
					<Checkbox
						class={!selectableTagsMap[tag.name] &&
							'disabled text-gray-400 disabled:cursor-not-allowed dark:text-gray-300'}
						on:change={(e) => {
							if (selectableTagsMap[tag.name]) {
								updateChecked(tag, e);
							}
						}}
						bind:checked={tag.checked}
					>
						{tag.name}
					</Checkbox>
				</li>
			{/each}
		</Dropdown>
	</div>
	<ul style="display: flex;">
		{#each checkedItems as checkedItem}
			<li class="chip">
				{checkedItem.name}
				<CloseCircleSolid
					withEvents
					on:click={() => closeBtn(checkedItem.name)}
					class="text-grey dark:text-grey ms-2 h-6 w-6 cursor-pointer hover:text-red-500"
				/>
			</li>
		{/each}
	</ul>
</div>

<style>
	.disabled {
		cursor: not-allowed;
		pointer-events: none;
	}
	.active {
		background-color: red;
	}
	.chip {
		background-color: #f1f1f1;
		border-radius: 10px;
		padding: 0.5rem 1rem;
		margin: 0 0.5rem;
		display: flex;
		gap: 5px;
	}
	.chip:hover {
		background-color: #e1e1e1;
	}
</style>
