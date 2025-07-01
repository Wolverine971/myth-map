<!-- src/routes/blog/+page.svelte -->
<script lang="ts">
	import { Heading, Card } from 'flowbite-svelte';

	import BlogPageHead from '$lib/components/blog/BlogPageHead.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
	let innerWidth = 0;
</script>

<svelte:window bind:innerWidth />

<BlogPageHead
	data={{
		title: 'Tiny Tribe Adventures Blogs',
		description: 'Topics related to family friendly locations'
	}}
	slug={'blog'}
/>

<Heading tag="h1" class="mb-4" customSize="text-4xl font-extrabold  md:text-5xl">Blog</Heading>
<hr />

<Card href="/locations" style="align-self: baseline;">
	<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Locations</h5>
	<p class="font-normal leading-tight text-gray-700 dark:text-gray-400">
		Get the scoop on all the activities, places to eat and all family friendly locations
	</p>
</Card>

<style>
	.blog-display {
		display: flex;
		flex-direction: column;
		align-items: start;
		width: 100%;
	}
</style>
