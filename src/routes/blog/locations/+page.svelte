<script lang="ts">
	import { Heading, P, Button } from 'flowbite-svelte';

	import BlogPageHead from '$lib/components/blog/BlogPageHead.svelte';
	import type { PageData } from './$types';
	import ArrowRightIcon from '$lib/components/icons/arrowRightIcon.svelte';
	export let data: PageData;
	let innerWidth = 0;
</script>

<svelte:window bind:innerWidth />

<BlogPageHead
	data={{
		title: 'Tiny Tribe Adventures Blogs',
		description: 'Topics related to family friendly locations'
	}}
	slug={'blog/locations'}
/>

<Heading tag="h1" class="mb-4" customSize="text-4xl font-extrabold  md:text-5xl">Locations</Heading>
<hr />

<div class="text-left" style="align-self: baseline;">
	{#each data.blogs as blog}
		<div class="mb-8">
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white">{blog.title}</h2>
			{#if blog.description}
				<p class="text-gray-700 dark:text-gray-400">{blog.description}</p>
			{/if}

			<a href={`locations/${blog.loc}`} class="text-primary mt-2 flex items-center">
				Read More
				<ArrowRightIcon class="ml-1 h-4 w-4" />
			</a>
		</div>
	{/each}
</div>

<style>
	.blog-display {
		display: flex;
		flex-direction: column;
		align-items: start;
		width: 100%;
	}
</style>
