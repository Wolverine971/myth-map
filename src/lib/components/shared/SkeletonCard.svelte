<!-- src/lib/components/shared/SkeletonCard.svelte -->
<script lang="ts">
	import { Card } from 'flowbite-svelte';

	// No props or logic needed for this component
</script>

<!-- <div class="h-64 w-full animate-pulse rounded-lg bg-white shadow-md">
	<div class="mb-4 h-32 rounded-md bg-gray-200"></div>
	<div class="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
	<div class="mb-2 h-4 w-1/2 rounded bg-gray-200"></div>
	<div class="h-4 w-1/4 rounded bg-gray-200"></div>
</div> -->

<Card padding="none" class="animate-pulse overflow-hidden rounded-lg bg-white shadow-md">
	<div class="mb-4 h-32 rounded-md bg-gray-200"></div>
	<div class="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
	<div class="mb-2 h-4 w-1/2 rounded bg-gray-200"></div>
	<div class="h-4 w-1/4 rounded bg-gray-200"></div>
</Card>
