<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { marked } from 'marked';
	import { Heading, A, Button } from 'flowbite-svelte';
	import { notifications } from '$lib/components/shared/notifications';
	import { getLocationIcon } from '../../../../../../utils/locationPhotos';
	import ArticleTitle from '$lib/components/blog/ArticleTitle.svelte';
	import ArticleSubTitle from '$lib/components/blog/ArticleSubTitle.svelte';
	import LocationCardSmall from '$lib/components/locations/LocationCardSmall.svelte';
	import Comments from '$lib/components/comments/Comments.svelte';
	import LocationPageHead from '$lib/components/blog/LocationPageHead.svelte';
	import { FileCopyOutline, ArrowRightOutline } from 'flowbite-svelte-icons';
	import { currentItinerary } from '$lib/stores/itineraryStore';

	export let data: PageData;
	let audio: any;

	onMount(() => {
		audio = new Audio('/sounds/tic-toc-click.wav');
	});

	$: content = data.locationData?.content ? marked(data.locationData.content) : '';
	$: icon = getLocationIcon(data?.locationData?.title);
	$: placesToEat = [];
	$: activities = [];

	onMount(() => {
		const placesToEatMap = new Set(
			data.locationTags?.filter((tag) => tag.tags.name === 'Eats').map((tag) => tag.location.name)
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

	let isInItinerary = false;

	currentItinerary.subscribe((value) => {
		isInItinerary = value?.items?.some((item) => item.location.id === location.id) ?? false;
	});

	const copy = () => {
		audio?.play();
		navigator.clipboard.writeText(
			`${data.locationData.location?.address_line_1}${data.locationData.location?.address_line_2 ? ` ${data.locationData.location?.address_line_2}` : ''}, ${data.locationData.location?.city}, ${data.locationData.location?.state} ${data.locationData.location?.zip_code}`
		);
		notifications.info('Address copied to clipboard', 3000);
	};

	function addToItinerary() {
		const newLocation: Location = {
			id: data.locationData.location.id,
			name: data.locationData.location.name,
			latitude: data.locationData.location.lat,
			longitude: data.locationData.location.lng,
			address: data.locationData.location.address,
			description: data.locationData.location.description
		};
		// console.log(newLocation);
		currentItinerary.addItem({
			location: newLocation,
			itineraryId: $currentItinerary?.id,
			name: data.user?.email ?? '',
			userId: data.user?.id
		});
	}

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
			notifications.danger('Error finding nearby locations', 3000);
		}
	}
	let innerWidth = 0;
	const url = `locations/states/${data?.locationData?.location.state}/${data?.locationData?.location?.city.split(' ').join('-')}/${data?.locationData?.loc}`;
	console.log(data);
</script>

<!-- Local Business jsonld 
 https://seotesting.com/google-search-console/enhancements/

The business name.
The opening hours of the business.
A telephone number for the business.
Ratings from Google reviews.
Links to websites.
-->

<svelte:window bind:innerWidth />

{#if data.locationData}
	<article itemscope itemtype="https://schema.org/BlogPosting" class="blog">
		<LocationPageHead blogContent={data.locationData} slug={url} />

		<div class="mb-6 flex items-center gap-8">
			<img
				src={`/map/${icon}.png`}
				alt={data.locationData?.title}
				class="h-auto w-1/3 max-w-[30%] rounded-lg object-cover"
			/>
			<div>
				<ArticleTitle title={data.locationData?.title} />
				<div style="display: flex; gap: 2rem;">
					<div>
						<ArticleSubTitle metaData={data.locationData} />

						{#if data.locationData.location?.address_line_1}
							<Button
								outline
								color="alternative"
								size="sm"
								class=" px-3 hover:outline hover:outline-2 hover:outline-primary-400"
								style="display: block; text-align: start;"
								on:click={() => {
									copy();
								}}
							>
								<div style="display: flex; align-items: center; gap: .5rem">
									<p
										itemprop="address"
										itemscope
										itemtype="https://schema.org/PostalAddress"
										style="text-align: start;"
									>
										<span itemprop="streetAddress"
											>{data.locationData.location?.address_line_1}</span
										>
										{#if data.locationData.location?.address_line_2}
											<span>, {data.locationData.location?.address_line_2}</span>
										{/if}
										<br />
										<span itemprop="addressLocality">{data.locationData.location?.city}</span>,{' '}
										<span itemprop="addressRegion">{data.locationData.location?.state}</span>{' '}
										<span itemprop="postalCode">{data.locationData.location?.zip_code}</span>
									</p>
									<FileCopyOutline class=" h-8 w-8" />
								</div>
							</Button>
						{/if}

						{#if data.locationData.website}
							<A
								href={data.locationData.website}
								target="_blank"
								rel="noopener noreferrer"
								class="my-2">Website <ArrowRightOutline class=" h-8 w-8" /></A
							>
						{/if}
						{#if data.locationData.phone_number}
							<p>Phone: {data.locationData.phone_number}</p>
						{/if}

						{#if data.user}
							<Button
								color="alternative"
								disabled={isInItinerary}
								on:click={addToItinerary}
								class="w-full hover:outline hover:outline-2 hover:outline-primary-600"
							>
								{isInItinerary ? 'Added to Itinerary' : 'Add to Itinerary'}
							</Button>
						{/if}
					</div>
					{#if data.locationData.opening_times}
						<div>
							<p>Opening Times:</p>
							<ul class="list-inside list-disc">
								{#each data.locationData.opening_times.split(',') as time}
									<li>{time}</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			</div>
		</div>

		{#if content}
			<div class="preview">{@html content}</div>
		{:else}
			<p class="my-20">Information Needed</p>
		{/if}
		<hr class="my-8" />

		<Comments
			parentId={data.locationData.id}
			parentType="content_location"
			{innerWidth}
			user={data?.user}
		/>

		<hr class="my-8" />

		{#if data.nearbyLocations}
			<Heading tag="h2" class="mb-6 text-4xl">Nearby Family Friendly Activities</Heading>

			<div class="grid grid-cols-2 gap-4 lg:gap-8">
				<!-- Places to Eat Section -->
				<div class="flex flex-col">
					<h3 class="mb-4 text-2xl font-semibold text-gray-800">Places to Eat</h3>
					{#if placesToEat.length === 0}
						<p class="text-gray-600">No places to eat found</p>
					{:else}
						<div class="space-y-4">
							{#each placesToEat as location}
								<LocationCardSmall
									name={location.name}
									coords={{ lat: location.lat, lng: location.lng }}
									address={`${location.address_line_1}${location.address_line_2 ? ` ${location.address_line_2}` : ''}, ${location.city}, ${location.state} ${location.zip_code}`}
									website={location.website}
									tags={data.locationTags.filter((tag) => tag.location.name === location.name)}
									contentLocation={{ location: location }}
									user={data.user}
									{innerWidth}
								/>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Activities Section -->
				<div class="flex flex-col">
					<h3 class="mb-4 text-2xl font-semibold text-gray-800">Activities</h3>
					{#if activities.length === 0}
						<p class="text-gray-600">No activities found</p>
					{:else}
						<div class="space-y-4">
							{#each activities as location}
								<LocationCardSmall
									name={location.name}
									coords={{ lat: location.lat, lng: location.lng }}
									address={`${location.address_line_1}${location.address_line_2 ? ` ${location.address_line_2}` : ''}, ${location.city}, ${location.state} ${location.zip_code}`}
									website={location.website}
									tags={data.locationTags.filter((tag) => tag.location.name === location.name)}
									contentLocation={{ location: location }}
									user={data.user}
									{innerWidth}
								/>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</article>
{/if}

<style lang="scss">
	.preview {
		:global(h1) {
			@apply mb-4 text-4xl font-bold text-gray-900;
		}
		:global(h2) {
			@apply mb-3 text-3xl font-semibold text-gray-800;
		}
		:global(p) {
			@apply mb-4 text-gray-600;
		}
	}
</style>
