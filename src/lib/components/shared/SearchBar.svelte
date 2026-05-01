<!-- src/lib/components/shared/SearchBar.svelte -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { SearchOutline, CloseCircleSolid, GlobeOutline } from 'flowbite-svelte-icons';
	import { debounce } from '../../../utils/debounce';

	export let placeholder = 'Search locations...';
	export let value = '';
	export let debounceMs = 300;
	export let minLength = 2;
	export let isLoading = false;
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let showClearButton = true;

	const dispatch = createEventDispatcher();

	let inputElement: HTMLInputElement;

	const debouncedSearch = debounce((searchValue: string) => {
		if (searchValue.length >= minLength || searchValue.length === 0) {
			dispatch('search', searchValue);
		}
	}, debounceMs);

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value;
		debouncedSearch(value);
	}

	function handleClear() {
		value = '';
		dispatch('search', '');
		inputElement?.focus();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') handleClear();
		dispatch('keydown', event);
	}

	$: sizeClasses = {
		sm: 'text-sm px-3 py-2 pl-9',
		md: 'text-base px-4 py-3 pl-11',
		lg: 'text-lg px-5 py-4 pl-12'
	};

	$: iconSize = {
		sm: 'h-4 w-4',
		md: 'h-5 w-5',
		lg: 'h-6 w-6'
	};

	onMount(() => {
		return () => {
			(debouncedSearch as unknown as { cancel?: () => void }).cancel?.();
		};
	});
</script>

<div class="group relative">
	<div id="search-description" class="sr-only">
		Search by location name, city, state, address, or activity tags. Results will appear as you
		type.
	</div>

	<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
		{#if isLoading}
			<GlobeOutline class="animate-spin text-subtle {iconSize[size]}" />
		{:else}
			<SearchOutline
				class="text-subtle transition-colors duration-fast group-focus-within:text-primary-700 dark:group-focus-within:text-primary-300 {iconSize[
					size
				]}"
			/>
		{/if}
	</div>

	<input
		bind:this={inputElement}
		bind:value
		type="text"
		{placeholder}
		class="block w-full rounded-sm border border-subtle bg-surface text-default transition-colors duration-fast placeholder:text-subtle focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-sunken disabled:text-subtle dark:focus:border-primary-300 dark:focus:ring-primary-300 {sizeClasses[
			size
		]}"
		on:input={handleInput}
		on:keydown={handleKeydown}
		on:focus
		on:blur
		disabled={isLoading}
		aria-label="Search locations by name, city, or activity type"
		aria-describedby="search-description"
		role="searchbox"
		autocomplete="off"
		spellcheck="false"
	/>

	{#if showClearButton && value.length > 0}
		<button
			type="button"
			class="absolute inset-y-0 right-0 flex items-center pr-3 text-subtle transition-colors duration-fast hover:text-tertiary-700 dark:hover:text-tertiary-300"
			on:click={handleClear}
			aria-label="Clear search"
		>
			<CloseCircleSolid class="h-4 w-4" />
		</button>
	{/if}
</div>

<style>
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>
