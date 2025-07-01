<!-- src/lib/components/SearchHeader.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let value = '';
	export let loading = false;
	export let error = '';

	const dispatch = createEventDispatcher();
	let focused = false;

	function handleSearch() {
		if (value.trim()) {
			dispatch('search', value);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSearch();
		}
	}
</script>

<div class="sticky top-0 z-10 w-full bg-white shadow-sm">
	<div class="mx-auto max-w-6xl p-4">
		<div class="relative">
			<div class="flex gap-2">
				<div
					class="relative flex-1 rounded-lg border transition-all duration-200
          {focused ? 'border-blue-500 ring-2 ring-blue-500' : 'hover:border-gray-400'}"
				>
					<input
						bind:value
						on:focus={() => (focused = true)}
						on:blur={() => (focused = false)}
						on:keydown={handleKeydown}
						type="text"
						placeholder="Search census data (e.g., population, income, housing)..."
						class="w-full rounded-lg p-4 focus:outline-none"
						disabled={loading}
					/>
				</div>

				<button
					on:click={handleSearch}
					disabled={loading || !value.trim()}
					class="rounded-lg bg-blue-500 px-6 py-4 font-medium text-white
            transition-colors hover:bg-blue-600 focus:ring-2 focus:ring-blue-500
            focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
				>
					{#if loading}
						<div
							class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
						></div>
					{:else}
						Search
					{/if}
				</button>
			</div>

			{#if error}
				<div
					class="absolute left-0 right-0 top-full mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"
				>
					{error}
				</div>
			{/if}
		</div>
	</div>
</div>
