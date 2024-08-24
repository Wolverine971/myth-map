<script lang="ts">
	import { Heading, P } from 'flowbite-svelte';
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

<div class="container mx-auto px-4 py-8">
	<Heading tag="h1" customSize="text-4xl md:text-5xl font-extrabold mb-6">Locations</Heading>
	<hr class="mb-8" />

	<Heading tag="h2" customSize="text-2xl md:text-3xl font-bold mb-6">Maryland</Heading>

	<div class="location-list">
		{#each data.locations as location}
			<div class="location-item">
				<h3 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white">{location?.title}</h3>
				{#if location.description}
					<P class="mb-2 text-gray-700 dark:text-gray-400">{location.description}</P>
				{/if}
				<P class="mb-2">{location.city}</P>

				<a
					href={`locations/states/${location.state}/${location.city}/${location.loc}`}
					class="read-more-link"
				>
					Read More
					<ArrowRightIcon className="ml-1 h-4 w-4" />
				</a>
			</div>
		{/each}
	</div>
</div>

<style lang="scss">
	.container {
		max-width: 800px;
	}

	.location-list {
		display: grid;
		gap: 2rem;
	}

	.location-item {
		padding-left: 1rem;
		border-left: 3px solid #e2e8f0;
		transition: border-color 0.3s ease;

		&:hover {
			border-left-color: #3b82f6;
		}
	}

	.read-more-link {
		display: inline-flex;
		align-items: center;
		color: #3b82f6;
		font-weight: 600;
		transition: color 0.3s ease;

		&:hover {
			color: #2563eb;
		}
	}

	@media (max-width: 640px) {
		.location-item {
			padding-left: 0.5rem;
		}
	}
</style>
