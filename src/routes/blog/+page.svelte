<!-- src/routes/blog/+page.svelte -->
<script lang="ts">
	import { Heading, Card } from 'flowbite-svelte';
	import SEOHead from '$lib/components/shared/SEOHead.svelte';
</script>

<SEOHead title="Blog" description="Topics related to family-friendly locations." canonical="/blog" />

<Heading tag="h1" class="mb-4" customSize="text-4xl font-extrabold md:text-5xl">Blog</Heading>
<hr />

<Card href="/locations" style="align-self: baseline;">
	<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Locations</h5>
	<p class="font-normal leading-tight text-gray-700 dark:text-gray-400">
		Get the scoop on all the activities, places to eat and all family-friendly locations.
	</p>
</Card>
