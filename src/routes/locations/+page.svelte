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

<Heading tag="h2" class="mb-3" customSize="text-2xl font-extrabold  md:text-3xl">Maryland</Heading>

<div class="text-left" style="align-self: baseline;">
	{#each data.locations as location}
		<div class="mb-8">
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white">{location?.title}</h2>
			{#if location.description}
				<p class="text-gray-700 dark:text-gray-400">{location.description}</p>
			{/if}
			<p>{location.city}</p>

			<a
				href={`locations/states/${location.state}/${location.city}/${location.loc}`}
				class="text-primary mt-2 flex items-center"
			>
				Read More
				<ArrowRightIcon className="ml-1 h-4 w-4" />
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
	.map-div {
		align-self: center;
		min-height: 430px;
		height: 500px;
		width: 100%;
	}
</style>
