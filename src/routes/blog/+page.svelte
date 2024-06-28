<script lang="ts">
	import { Heading, P, Button } from 'flowbite-svelte';

	import BlogPageHead from '$lib/components/blog/BlogPageHead.svelte';
	import type { PageData } from './$types';
	import ArrowRightIcon from '$lib/components/icons/arrowRightIcon.svelte';
	export let data: PageData;
	let innerWidth = 0;
	console.log(data);
</script>

<svelte:window bind:innerWidth />

<BlogPageHead
	data={{
		title: 'Mythmap Blogs',
		description: 'Topics realted to family friendly locations'
	}}
	slug={'blog/enneagram'}
/>

<Heading tag="h1" class="mb-4" customSize="text-4xl font-extrabold  md:text-5xl">Blog</Heading>

<!-- <details open>
	<summary class="accordion">Table of Contents</summary>
	<ul>
		<li><a href="#understanding">Understanding the Enneagram</a></li>
		<li><a href="#9types">The Nine Enneagram Types</a></li>
		<li><a href="#personal-development">The Enneagram for Personal Development</a></li>
		<li><a href="#relationships">The Enneagram in Relationships</a></li>
		<li><a href="#workplace">The Enneagram in the Workplace</a></li>
		<li><a href="#resources">The Enneagram Resources</a></li>
		<li><a href="#situations">The Enneagram Types in Specific Situations</a></li>
	</ul>
</details> -->

<div class=" text-left">
	{#each data.blogs as blog}
		<div class="mb-8">
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white">{blog.title}</h2>
			<p class="text-gray-700 dark:text-gray-400">{blog.description}</p>
			<a href={`blog/${blog.slug}`} class="text-primary mt-2 flex items-center">
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
