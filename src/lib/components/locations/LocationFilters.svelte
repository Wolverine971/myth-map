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
	// export let locationTags: any[] = [];
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

<div class="mb-4 rounded-lg bg-white p-4 shadow-md">
	<div class="flex flex-wrap items-center gap-2">
		<div class="flex items-center" transition:fade={{ duration: 600 }}>
			<Button color="primary">
				Location Type: {baseSelect ?? 'Any'}
				<ChevronDownOutline class="ms-2 h-4 w-4" />
			</Button>
			<Dropdown bind:open={baseDropdownOpen} class="z-50">
				<DropdownItem on:click={baseSelection}>Activity</DropdownItem>
				<DropdownItem on:click={baseSelection}>Food</DropdownItem>
			</Dropdown>
		</div>
		<div class="flex items-center" transition:fade={{ duration: 800 }}>
			<Button color="primary">
				Environment: {indoorOutdoorSelect ?? 'Any'}
				<ChevronDownOutline class="ms-2 h-4 w-4" />
			</Button>
			<Dropdown bind:open={indoorOutdoorDropdownOpen} class="z-50">
				<DropdownItem on:click={indoorOutdoorSelection}>Indoor</DropdownItem>
				<DropdownItem on:click={indoorOutdoorSelection}>Outdoor</DropdownItem>
			</Dropdown>
		</div>
		<div class="flex items-center" transition:fade={{ duration: 1000 }}>
			<Button color="primary">
				Tags ({checkedItems.length})
				<ChevronDownOutline class="ms-2 h-4 w-4" />
			</Button>
			<Dropdown class="z-50">
				{#each displayTags as tag (tag.name)}
					<li
						class="p-2 hover:bg-secondary-100 {!selectableTagsMap[tag.name] &&
							'cursor-not-allowed opacity-50'}"
					>
						<Checkbox
							disabled={!selectableTagsMap[tag.name]}
							on:change={(e) => updateChecked(tag, e)}
							bind:checked={tag.checked}
						>
							{tag.name}
						</Checkbox>
					</li>
				{/each}
			</Dropdown>
		</div>
	</div>
	<div class="mt-2 flex flex-wrap gap-2">
		{#each checkedItems as checkedItem (checkedItem.name)}
			<span
				class="inline-flex items-center rounded-full bg-secondary-200 px-2 py-1 text-sm text-primary-700"
			>
				{checkedItem.name}
				<button
					on:click={() => closeBtn(checkedItem.name)}
					class="ml-1 text-primary-500 hover:text-primary-700"
				>
					<CloseCircleSolid class="h-4 w-4" />
				</button>
			</span>
		{/each}
	</div>
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
