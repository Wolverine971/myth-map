<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { Button, Checkbox, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ChevronDownOutline, CloseCircleSolid } from 'flowbite-svelte-icons';
	const dispatch = createEventDispatcher();
	export let tags: { name: string }[] = [];
	export let locationTags: any[] = [];
	let baseDropdownOpen = false;
	let moreDropdownOpen = false;
	let checkedItems: { name: string; checked: boolean }[] = [];
	let displayTags: { name: string; checked: boolean }[] = [];
	let baseSelect: string | null = null;

	onMount(() => {
		// console.log(tags);

		displayTags = tags.map((tag) => {
			return { ...tag, checked: false };
		});
	});

	const updateChecked = (item, event) => {
		// console.log(e);
		// console.log(e.target.innerText);

		displayTags.forEach((tag) => {
			if (tag.name === item.name) {
				tag.checked = event.target.checked;
			}
			return tag;
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
			'selected',
			checkedItems.map((tag) => tag.name)
		);
		baseDropdownOpen = false;
	};

	const closeBtn = (name: string) => {
		console.log(name);
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
		dispatch(
			'selected',
			checkedItems.map((tag) => tag.name)
		);
	};
	let activeClass =
		'text-orange-700 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-500';
</script>

<div>
	<div class="mb-4 flex flex-wrap items-center gap-1">
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
				Tags ({checkedItems.length})
				<ChevronDownOutline class="ms-2 h-6 w-6 text-white dark:text-white" />
			</Button>
			<Dropdown
				style="z-index: 1232134234"
				placement={'bottom'}
				bind:open={moreDropdownOpen}
				on:close={() => {
					console.log('closed');
				}}
			>
				{#each displayTags as tag}
					<!-- <DropdownItem class="hover:bg-gray-100" on:click={selected}>{tag.name}</DropdownItem> -->
					<li class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600">
						<Checkbox on:change={(e) => updateChecked(tag, e)} checked={tag.checked}
							>{tag.name}</Checkbox
						>
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
</div>

<style>
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
