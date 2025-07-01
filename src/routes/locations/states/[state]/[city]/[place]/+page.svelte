<!-- src/routes/locations/states/[state]/[city]/[place]/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { marked } from 'marked';
	import { Button, Badge, Card } from 'flowbite-svelte';
	import { notifications } from '$lib/components/shared/notifications';
	import { getLocationIcon } from '../../../../../../utils/locationPhotos';
	import LocationCardSmall from '$lib/components/locations/LocationCardSmall.svelte';
	import Comments from '$lib/components/comments/Comments.svelte';
	import LocationPageHead from '$lib/components/blog/LocationPageHead.svelte';
	import {
		FileCopyOutline,
		ArrowRightOutline,
		ClockOutline,
		PhoneOutline,
		MapPinOutline,
		StarSolid,
		PlusOutline,
		CheckOutline,
		GlobeOutline
	} from 'flowbite-svelte-icons';
	import { currentItinerary } from '$lib/stores/itineraryStore';
	import type { Location } from '$lib/types';

	export let data: PageData;
	console.log(data);
	if (data) {
		console.log(data.locationTags.length)
		console.log(
		
			data.selectedLocationTags.filter((tag) => {
				console.log(`${tag.location.name}, ${data.locationData.location.name}`);
				if (tag.location.name == data.locationData.location.name) {
					return true;
				}
			})
		);
	}
	let audio: any;
	let innerWidth = 0;
	let showFullDescription = false;

	onMount(() => {
		audio = new Audio('/sounds/tic-toc-click.wav');
	});

	$: content = data.locationData?.content ? marked(data.locationData.content) : '';
	$: icon = getLocationIcon(data?.locationData?.title);
	$: placesToEat = [];
	$: activities = [];
	$: isInItinerary = false;

	// Reactive statement to categorize nearby locations
	$: if (data.nearbyLocations && data.locationTags) {
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
	}

	// Check if location is in itinerary
	currentItinerary.subscribe((value) => {
		isInItinerary =
			value?.items?.some((item) => item.location.id === data.locationData?.location?.id) ?? false;
	});

	const copyAddress = () => {
		const address = `${data.locationData.location?.address_line_1}${data.locationData.location?.address_line_2 ? ` ${data.locationData.location?.address_line_2}` : ''}, ${data.locationData.location?.city}, ${data.locationData.location?.state} ${data.locationData.location?.zip_code}`;

		if (navigator.clipboard) {
			navigator.clipboard.writeText(address).then(() => {
				audio?.play();
				notifications.info('Address copied to clipboard', 3000);
			});
		}
	};

	function addToItinerary() {
		if (!data.locationData?.location) return;

		const newLocation: Location = {
			id: data.locationData.location.id,
			name: data.locationData.location.name,
			latitude: data.locationData.location.lat,
			longitude: data.locationData.location.lng,
			address: data.locationData.location.address,
			description: data.locationData.location.description
		};

		currentItinerary.addItem({
			location: newLocation,
			itineraryId: $currentItinerary?.id,
			name: data.user?.email ?? '',
			userId: data.user?.id
		});
	}

	// Format opening times for better display
	$: openingTimes = data.locationData?.opening_times
		? data.locationData.opening_times.split(',').map((time) => time.trim())
		: [];

	// Create structured data URL
	$: canonicalUrl = `/locations/states/${data?.locationData?.location?.state}/${data?.locationData?.location?.city?.split(' ').join('-')}/${data?.locationData?.loc}`;

	// Get primary category from tags
	$: primaryCategory =
		data.selectedLocationTags?.find((tag) => tag.tags.name === 'Activity' || tag.tags.name === 'Eats')?.tags
			.name || 'Activity';

	$: otherTags =
		data.selectedLocationTags?.filter((tag) => tag.location.name == data.locationData.location.name)?.filter((tag) => tag.tags.name !== 'Activity' && tag.tags.name !== 'Eats') ||
		[];


	
</script>

<svelte:window bind:innerWidth />

{#if data.locationData}
	<LocationPageHead blogContent={data.locationData} slug={canonicalUrl} />

	<main class="min-h-screen bg-gray-50">
		<!-- Header Section -->
		<header class="border-b bg-white shadow-sm">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="py-6 md:py-8 lg:py-12">
					<div class="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
						<!-- Image Column -->
						<div class="lg:col-span-5 xl:col-span-4">
							<div class="relative">
								<div
									class="aspect-w-16 aspect-h-12 md:aspect-h-10 lg:aspect-h-12 overflow-hidden rounded-xl shadow-lg"
								>
									<img
										src={`/map/${icon}.png`}
										alt={data.locationData?.title}
										class="h-full w-full object-cover"
										loading="eager"
									/>
								</div>
								<!-- Category Badge -->
								<div class="absolute left-4 top-4">
									<Badge color="primary" class="px-3 py-1 text-sm font-semibold">
										{primaryCategory}
									</Badge>
								</div>
							</div>
						</div>

						<!-- Content Column -->
						<div class="space-y-6 lg:col-span-7 xl:col-span-8">
							<!-- Title and Subtitle -->
							<div class="space-y-3">
								<h1 class="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
									{data.locationData?.title}
								</h1>

								<!-- Tags -->
								{#if otherTags.length > 0}
									<div class="flex flex-wrap gap-2">
										{#each otherTags as tag}
											<Badge color="light" class="text-xs font-medium">
												{tag.tags.name}
											</Badge>
										{/each}
									</div>
								{/if}
							</div>

							<!-- Key Information Grid -->
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<!-- Address -->
								{#if data.locationData.location?.address_line_1}
									<button
										on:click={copyAddress}
										class="group rounded-lg bg-gray-50 p-4 text-left transition-colors hover:bg-gray-100"
									>
										<div class="flex items-start gap-3">
											<MapPinOutline
												class="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-600 group-hover:text-primary-600"
											/>
											<div class="min-w-0">
												<h3 class="mb-1 font-medium text-gray-900">Address</h3>
												<p class="text-sm leading-relaxed text-gray-600">
													{data.locationData.location.address_line_1}
													{#if data.locationData.location.address_line_2}
														<br />{data.locationData.location.address_line_2}
													{/if}
													<br />{data.locationData.location.city}, {data.locationData.location
														.state}
													{data.locationData.location.zip_code}
												</p>
												<p class="mt-1 text-xs text-primary-600 group-hover:text-primary-700">
													Click to copy
												</p>
											</div>
										</div>
									</button>
								{/if}

								<!-- Phone -->
								{#if data.locationData.phone_number}
									<div class="rounded-lg bg-gray-50 p-4">
										<div class="flex items-start gap-3">
											<PhoneOutline class="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-600" />
											<div>
												<h3 class="mb-1 font-medium text-gray-900">Phone</h3>
												<a
													href="tel:{data.locationData.phone_number}"
													class="text-sm font-medium text-primary-600 hover:text-primary-800"
												>
													{data.locationData.phone_number}
												</a>
											</div>
										</div>
									</div>
								{/if}

								<!-- Hours -->
								{#if openingTimes.length > 0}
									<div class="rounded-lg bg-gray-50 p-4">
										<div class="flex items-start gap-3">
											<ClockOutline class="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-600" />
											<div class="min-w-0">
												<h3 class="mb-1 font-medium text-gray-900">Hours</h3>
												<div class="space-y-1 text-sm text-gray-600">
													{#each openingTimes.slice(0, 2) as time}
														<p class="truncate">{time}</p>
													{/each}
													{#if openingTimes.length > 2}
														<button
															class="text-xs font-medium text-primary-600 hover:text-primary-800"
														>
															+{openingTimes.length - 2} more days
														</button>
													{/if}
												</div>
											</div>
										</div>
									</div>
								{/if}

								<!-- Website -->
								{#if data.locationData.website}
									<a
										href={data.locationData.website}
										target="_blank"
										rel="noopener noreferrer"
										class="group rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
									>
										<div class="flex items-start gap-3">
											<GlobeOutline
												class="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-600 group-hover:text-primary-600"
											/>
											<div>
												<h3 class="mb-1 font-medium text-gray-900">Website</h3>
												<p
													class="text-sm font-medium text-primary-600 group-hover:text-primary-800"
												>
													Visit official website
												</p>
											</div>
										</div>
									</a>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		</header>

		<!-- Main Content -->
		<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
			<div class="space-y-12">
				<!-- Description Section -->
				{#if content}
					<section>
						<Card class="p-6 lg:p-8">
							<h2 class="mb-6 text-2xl font-bold text-gray-900 lg:text-3xl">About This Location</h2>
							<div class="prose prose-lg prose-gray max-w-none">
								{#if content.length > 800 && !showFullDescription}
									<div class="description-preview">
										{@html content.substring(0, 800) + '...'}
									</div>
									<Button color="light" class="mt-6" on:click={() => (showFullDescription = true)}>
										Read More
									</Button>
								{:else}
									<div class="description-full">
										{@html content}
									</div>
								{/if}
							</div>
						</Card>
					</section>
				{:else}
					<section>
						<Card class="p-6 text-center lg:p-8">
							<h2 class="mb-4 text-2xl font-bold text-gray-900 lg:text-3xl">About This Location</h2>
							<p class="text-lg text-gray-600">
								Information about this location is being updated. Check back soon!
							</p>
						</Card>
					</section>
				{/if}

				<!-- Nearby Locations Section -->
				{#if data.nearbyLocations && data.nearbyLocations.length > 0}
					<section>
						<div class="mb-12 text-center">
							<h2 class="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">
								Nearby Family-Friendly Activities
							</h2>
							<p class="mx-auto max-w-2xl text-lg text-gray-600">
								Discover more great places to visit in the area
							</p>
						</div>

						<div class="grid grid-cols-1 gap-8 lg:gap-12 xl:grid-cols-2">
							<!-- Places to Eat -->
							<div class="space-y-6">
								<div class="flex items-center justify-between">
									<h3 class="flex items-center gap-3 text-2xl font-bold text-gray-900">
										🍽️ Places to Eat
									</h3>
									<Badge color="primary" class="text-sm font-semibold">
										{placesToEat.length} found
									</Badge>
								</div>

								{#if placesToEat.length === 0}
									<Card class="p-8 text-center">
										<div class="mb-4 text-6xl text-gray-400">🍽️</div>
										<h4 class="mb-2 text-lg font-semibold text-gray-900">No restaurants nearby</h4>
										<p class="text-gray-600">
											We didn't find any nearby restaurants in our database.
										</p>
									</Card>
								{:else}
									<div class="space-y-6">
										{#each placesToEat as location (location.id)}
											<LocationCardSmall
												name={location.name}
												coords={{ lat: location.lat, lng: location.lng }}
												address={`${location.address_line_1}${location.address_line_2 ? ` ${location.address_line_2}` : ''}, ${location.city}, ${location.state} ${location.zip_code}`}
												website={location.website}
												tags={data.locationTags.filter(
													(tag) => tag.location.name === location.name
												)}
												contentLocation={{ location: location }}
												user={data.user}
												{innerWidth}
											/>
										{/each}
									</div>
								{/if}
							</div>

							<!-- Activities -->
							<div class="space-y-6">
								<div class="flex items-center justify-between">
									<h3 class="flex items-center gap-3 text-2xl font-bold text-gray-900">
										🎯 Activities
									</h3>
									<Badge color="primary" class="text-sm font-semibold">
										{activities.length} found
									</Badge>
								</div>

								{#if activities.length === 0}
									<Card class="p-8 text-center">
										<div class="mb-4 text-6xl text-gray-400">🎯</div>
										<h4 class="mb-2 text-lg font-semibold text-gray-900">No activities nearby</h4>
										<p class="text-gray-600">
											We didn't find any nearby activities in our database.
										</p>
									</Card>
								{:else}
									<div class="space-y-6">
										{#each activities as location (location.id)}
											<LocationCardSmall
												name={location.name}
												coords={{ lat: location.lat, lng: location.lng }}
												address={`${location.address_line_1}${location.address_line_2 ? ` ${location.address_line_2}` : ''}, ${location.city}, ${location.state} ${location.zip_code}`}
												website={location.website}
												tags={data.locationTags.filter(
													(tag) => tag.location.name === location.name
												)}
												contentLocation={{ location: location }}
												user={data.user}
												{innerWidth}
											/>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					</section>
				{/if}

				<!-- Comments Section -->
				<section>
					<Card class="p-6 lg:p-8">
						<h2 class="mb-8 text-2xl font-bold text-gray-900 lg:text-3xl">Reviews & Comments</h2>
						<Comments
							parentId={data.locationData.id}
							parentType="content_location"
							{innerWidth}
							user={data?.user}
						/>
					</Card>
				</section>
			</div>
		</div>
	</main>
{/if}

<style>
	/* Aspect ratio utilities for responsive images */
	.aspect-w-16 {
		position: relative;
		padding-bottom: calc(var(--aspect-h) / var(--aspect-w) * 100%);
	}

	.aspect-h-12 {
		--aspect-w: 16;
		--aspect-h: 12;
	}

	.aspect-h-10 {
		--aspect-w: 16;
		--aspect-h: 10;
	}

	.aspect-w-16 > * {
		position: absolute;
		height: 100%;
		width: 100%;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
	}

	/* Enhanced prose styles */
	:global(.prose-lg h1) {
		@apply mb-6 text-3xl font-bold text-gray-900;
	}

	:global(.prose-lg h2) {
		@apply mb-4 mt-8 text-2xl font-bold text-gray-900;
	}

	:global(.prose-lg h3) {
		@apply mb-3 mt-6 text-xl font-semibold text-gray-900;
	}

	:global(.prose-lg p) {
		@apply mb-4 text-lg leading-relaxed text-gray-700;
	}

	:global(.prose-lg a) {
		@apply font-medium text-primary-600 hover:text-primary-800;
	}

	:global(.prose-lg ul, .prose-lg ol) {
		@apply mb-6;
	}

	:global(.prose-lg li) {
		@apply mb-2 text-lg text-gray-700;
	}

	:global(.prose-lg blockquote) {
		@apply my-6 border-l-4 border-primary-200 py-2 pl-6 italic text-gray-700;
	}

	/* Smooth transitions */
	.description-preview,
	.description-full {
		transition: all 0.3s ease;
	}

	/* Better focus states */
	button:focus,
	a:focus {
		outline: 2px solid transparent;
		outline-offset: 2px;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
	}
</style>
