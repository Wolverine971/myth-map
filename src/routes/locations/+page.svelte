<!-- src/routes/locations/+page.svelte -->
<script lang="ts">
	import { Heading, P } from 'flowbite-svelte';
	import BlogPageHead from '$lib/components/blog/BlogPageHead.svelte';
	import type { PageData } from './$types';
	import ArrowRightIcon from '$lib/components/icons/arrowRightIcon.svelte';
	import { getLocationIcon } from '../../utils/locationPhotos';

	export let data: PageData;
	let innerWidth = 0;
</script>

<svelte:window bind:innerWidth />

<BlogPageHead
	data={{
		title: 'Tiny Tribe Adventures Locations',
		description: 'Topics related to family friendly locations'
	}}
	slug={'locations'}
/>

<div class="container mx-auto px-2 py-8 md:px-4">
	<Heading tag="h1" customSize="text-4xl md:text-5xl font-extrabold mb-6">Locations</Heading>
	<hr class="mb-8" />

	<Heading tag="h2" customSize="text-2xl md:text-3xl font-bold mb-6">Maryland</Heading>

	<div class="location-list">
		{#each data.contentLocations as contentLocation}
			<div class="location-item">
				<div>
					<h3 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
						{contentLocation?.title}
					</h3>
					{#if contentLocation.description}
						<P class="mb-2 text-gray-700 dark:text-gray-400">{contentLocation.description}</P>
					{/if}
					<P class="mb-2">{contentLocation.location.city}</P>

					<a
						href={`locations/states/${contentLocation.location.state}/${contentLocation.location.city.split(' ').join('-')}/${contentLocation.loc}`}
						class="read-more-link"
					>
						More Details
						<ArrowRightIcon className="ml-1 h-4 w-4" />
					</a>
				</div>
				<img
					style="max-width: 150px;"
					src={`/map/${getLocationIcon(contentLocation?.title)}.png`}
					alt="{contentLocation?.title} icon"
				/>
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
		display: flex;
		justify-content: space-between;
		align-items: center;

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
