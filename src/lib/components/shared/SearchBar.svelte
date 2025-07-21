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
	let focused = false;
	
	// Debounced search function
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
		if (event.key === 'Escape') {
			handleClear();
		}
		dispatch('keydown', event);
	}
	
	// Size classes
	$: sizeClasses = {
		sm: 'text-sm px-3 py-2 pl-9',
		md: 'text-base px-4 py-3 pl-11',
		lg: 'text-lg px-5 py-4 pl-12'
	};
	
	$: iconSizeClasses = {
		sm: 'h-4 w-4 left-3',
		md: 'h-5 w-5 left-3',
		lg: 'h-6 w-6 left-3'
	};
	
	onMount(() => {
		// Auto-focus if needed
		return () => {
			debouncedSearch.cancel?.();
		};
	});
</script>

<div class="relative group">
	<!-- Hidden description for screen readers -->
	<div id="search-description" class="sr-only">
		Search by location name, city, state, address, or activity tags. Results will appear as you type.
	</div>
	
	<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center {iconSizeClasses[size]}">
		{#if isLoading}
			<GlobeOutline class="animate-spin text-gray-400 {iconSizeClasses[size]}" />
		{:else}
			<SearchOutline class="text-gray-400 {iconSizeClasses[size]} transition-colors group-focus-within:text-primary-500" />
		{/if}
	</div>
	
	<input
		bind:this={inputElement}
		bind:value
		type="text"
		{placeholder}
		class="block w-full rounded-lg border border-gray-300 bg-white {sizeClasses[size]} text-gray-900 transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
		on:input={handleInput}
		on:keydown={handleKeydown}
		on:focus={() => focused = true}
		on:blur={() => focused = false}
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
			class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
			on:click={handleClear}
			aria-label="Clear search"
		>
			<CloseCircleSolid class="h-4 w-4" />
		</button>
	{/if}
	
	<!-- Focus ring for better accessibility -->
	{#if focused}
		<div class="absolute -inset-1 rounded-lg border-2 border-primary-500 opacity-20 pointer-events-none"></div>
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