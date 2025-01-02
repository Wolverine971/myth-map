<script lang="ts">
	import { fade, slide } from 'svelte/transition';

	export let results = [];
	export let loading = false;

	console.log(results);

	const placeholderCount = 3;
</script>

<div class="grid gap-6">
	{#if loading}
		{#each Array(placeholderCount) as _}
			<div class="animate-pulse rounded-lg bg-white p-6 shadow-sm" transition:fade>
				<div class="mb-4 h-6 w-3/4 rounded bg-gray-200"></div>
				<div class="space-y-3">
					<div class="h-4 w-1/2 rounded bg-gray-200"></div>
					<div class="h-4 w-1/3 rounded bg-gray-200"></div>
				</div>
			</div>
		{/each}
	{:else}
		{#each results as result, i}
			<div
				class="rounded-lg bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
				transition:slide
			>
				<div class="p-6">
					<h3 class="mb-2 text-lg font-medium">{result.description}</h3>
					<div class="text-sm text-gray-600">ID: {result.id}</div>
					<div class="mt-3 flex flex-wrap gap-2">
						<span class="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
							{result.vintage}
						</span>
						<span class="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800">
							{result.dataset}
						</span>
					</div>
				</div>
			</div>
		{/each}
	{/if}
</div>
