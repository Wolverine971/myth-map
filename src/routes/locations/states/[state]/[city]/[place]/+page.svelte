<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { marked } from 'marked';
	import { Heading, A } from 'flowbite-svelte';
	import { notifications } from '$lib/components/shared/notifications';
	import { getLocationIcon } from '../../../../../../utils/locationPhotos';
	import BlogPageHead from '$lib/components/blog/BlogPageHead.svelte';
	import ArticleTitle from '$lib/components/blog/ArticleTitle.svelte';
	import ArticleSubTitle from '$lib/components/blog/ArticleSubTitle.svelte';
	import LocationCardSmall from '$lib/components/locations/LocationCardSmall.svelte';
	import Comments from '$lib/components/comments/Comments.svelte';

	export let data: PageData;

	$: content = data.blog?.content ? marked(data.blog.content) : '';
	$: icon = getLocationIcon(data?.blog?.title);
	$: placesToEat = [];
	$: activities = [];

	onMount(() => {
		const placesToEatMap = new Set(
			data.locationTags.filter((tag) => tag.tags.name === 'Food').map((tag) => tag.locations.name)
		);

		[placesToEat, activities] = data.nearbyLocations.reduce(
			([eat, act], location) => {
				if (placesToEatMap.has(location.name)) {
					eat.push(location);
				} else {
					act.push(location);
				}
				return [eat, act];
			},
			[[], []]
		);
	});

	async function findNearby() {
		const body = new FormData();
		body.append('lat', '39.272216');
		body.append('lng', '-76.731829');

		try {
			const response = await fetch('?/findNearby', { method: 'POST', body });
			const { data: nearbyData, error } = await response.json();

			if (nearbyData) {
				notifications.info('Locations found', 3000);
			} else {
				notifications.warning('Locations not found', 3000);
			}
		} catch (error) {
			notifications.error('Error finding nearby locations', 3000);
		}
	}
	let innerWidth = 0;
</script>

<svelte:window bind:innerWidth />

{#if data.blog}
	<article itemscope itemtype="https://schema.org/BlogPosting" class="blog">
		<BlogPageHead data={data.blog} slug={`blog/locations/${data?.blog?.loc}`} />

		<div class="mb-6 flex items-center gap-8">
			<img
				src={`/map/${icon}.png`}
				alt={data.blog?.title}
				class="h-auto w-1/3 max-w-[30%] rounded-lg object-cover"
			/>
			<div>
				<ArticleTitle title={data.blog?.title} />
				<ArticleSubTitle metaData={data.blog} />
				{#if data.locationData.website}
					<A href={data.locationData.website} target="_blank" rel="noopener noreferrer">Webpage</A>
				{/if}
			</div>
		</div>

		{#if content}
			<div class="preview">{@html content}</div>
		{:else}
			<p class="my-20">Information Needed</p>
		{/if}
		<hr class="my-8" />

		<Comments
			parentId={data.blog.id}
			parentType="content_location"
			{innerWidth}
			user={data?.user}
		/>

		<hr class="my-8" />

		{#if data.nearbyLocations}
			<Heading tag="h2" class="mb-6 text-4xl">Nearby Family Friendly Activities</Heading>

			<div class="flex flex-col gap-4 md:flex-row">
				<div class="flex-1">
					<h3 class="mb-4 text-2xl">Places to Eat</h3>
					{#if placesToEat.length === 0}
						<p>No places to eat found</p>
					{:else}
						{#each placesToEat as location}
							<LocationCardSmall
								name={location.name}
								coords={{ lat: location.lat, lng: location.lng }}
								address={`${location.address_line_1}${location.address_line_2 ? ` ${location.address_line_2}` : ''}, ${location.city}, ${location.state} ${location.zip_code}`}
								website={location.website}
								tags={data.locationTags.filter((tag) => tag.locations.name === location.name)}
								{location}
								user={data.user}
								{innerWidth}
							/>
						{/each}
					{/if}
				</div>

				<div class="flex-1">
					<h3 class="mb-4 text-2xl">Activities</h3>
					{#if activities.length === 0}
						<p>No activities found</p>
					{:else}
						{#each activities as location}
							<LocationCardSmall
								name={location.name}
								coords={{ lat: location.lat, lng: location.lng }}
								address={`${location.address_line_1}${location.address_line_2 ? ` ${location.address_line_2}` : ''}, ${location.city}, ${location.state} ${location.zip_code}`}
								website={location.website}
								tags={data.locationTags.filter((tag) => tag.locations.name === location.name)}
								{location}
								user={data.user}
								{innerWidth}
							/>
						{/each}
					{/if}
				</div>
			</div>
		{/if}
	</article>
{/if}

<style lang="scss">
	.preview {
		:global(h1) {
			@apply mb-4 text-4xl;
		}
		:global(h2) {
			@apply mb-3 text-3xl;
		}
		:global(p) {
			@apply mb-4;
		}
	}
</style>
