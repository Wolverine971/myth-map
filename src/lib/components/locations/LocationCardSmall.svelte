<script lang="ts">
	import { Card, Button } from 'flowbite-svelte';
	import { browser } from '$app/environment';
	import { getLocationIcon } from '../../../utils/locationPhotos';
	import { currentLocation } from '$lib/stores/locationStore';
	import { deserialize } from '$app/forms';
	import { getCurrentLocation } from '../../../utils/userLocation';
	import { currentItinerary } from '$lib/stores/itineraryStore';
	import type { SizeType } from 'flowbite-svelte/dist/types';
	import type { Location } from '$lib/types';

	export let name: string;
	export let address: string;
	export let website: string;
	export let tags: Array<{ tags: { name: string } }>;
	export let coords: { lat: number; lng: number };
	export let size: SizeType = 'md';
	export let location: Location;
	export let user: { email: string } | null;
	export let innerWidth: number;

	let duration: number;
	let distance: number;
	let distanceLoading = false;
	let userLocation: { lat: number; lng: number } | null;
	let isInItinerary = false;

	$: [addressPart1, ...addressPart2] = address.split(',');
	$: trimmedAddress = addressPart2.join(',').trim();

	currentLocation.subscribe((value) => (userLocation = value));
	currentItinerary.subscribe((value) => {
		isInItinerary = value?.items?.some((item) => item.location.id === location.id) ?? false;
	});

	async function getHowFarAwayIsLocation() {
		if (distanceLoading || !browser) return;
		distanceLoading = true;

		if (!userLocation) {
			await getCurrentLocation();
			userLocation = $currentLocation;
		}

		if (!userLocation) {
			distanceLoading = false;
			return;
		}

		const body = new FormData();
		body.append('originlat', userLocation.lat.toString());
		body.append('originlng', userLocation.lng.toString());
		body.append('destinationlat', coords.lat.toString());
		body.append('destinationlng', coords.lng.toString());

		try {
			const response = await fetch('?/getHowFarAwayIsLocation', { method: 'POST', body });
			const result: any = deserialize(await response.text());

			if (result.type === 'success') {
				({ duration, distance } = result.data);
			} else {
				console.error('Error:', result.error);
			}
		} catch (error) {
			console.error('Fetch error:', error);
		} finally {
			distanceLoading = false;
		}
	}

	function addToItinerary() {
		const newLocation: Location = {
			id: location.id,
			name,
			latitude: coords.lat,
			longitude: coords.lng,
			address: location.address,
			description: location.description
		};
		currentItinerary.addItem({
			location: newLocation,
			itineraryId: $currentItinerary?.id,
			name: user?.email ?? ''
		});
	}
</script>

<Card
	horizontal={true}
	{size}
	class="mx-auto flex max-w-md flex-col gap-4 p-4 sm:flex-row sm:gap-2 sm:p-2 sm:p-6"
>
	<div style={innerWidth > 500 ? 'width: 50%;' : ''}>
		<img src="/map/{getLocationIcon(name)}.png" alt="" class="w-full object-contain sm:w-48" />

		{#if tags?.length}
			<details class="mb-3 sm:hidden">
				<summary class="cursor-pointer rounded-md border border-gray-300 p-2 text-center">
					Tags
				</summary>
				<ul class="mt-2 flex flex-wrap gap-1">
					{#each tags as tag}
						<li class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
							{tag?.tags.name}
						</li>
					{/each}
				</ul>
			</details>
			<ul class="mb-3 hidden flex-wrap gap-1 sm:flex">
				{#each tags as tag}
					<li class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
						{tag?.tags.name}
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<div class="flex flex-grow flex-col">
		<h5 class="mb-2 text-xl font-bold">{name}</h5>
		<p class="mb-3 text-sm">
			<span class="hidden sm:inline">{addressPart1},<br /></span>
			{trimmedAddress}
		</p>

		<div class="mt-auto flex flex-col gap-2">
			<a href={website} target="_blank" rel="noopener noreferrer">
				<Button outline color="primary" size="sm" class="w-full">Visit Website</Button>
			</a>
			<a
				href={`/locations/states/${location.state}/${location.city}/${name}`.replace(/\s/g, '-')}
				class="w-full"
			>
				<Button outline color="alternative" size="sm" class="w-full">Details</Button>
			</a>
			{#if distance}
				<div class="text-sm">
					<p>Distance: {distance} miles</p>
					<p>Duration: {duration} minutes</p>
				</div>
			{:else}
				<Button
					outline
					color="alternative"
					size="sm"
					on:click={getHowFarAwayIsLocation}
					class="h-11 w-full"
				>
					{distanceLoading ? 'Loading...' : 'How far away is it?'}
				</Button>
			{/if}
			{#if user}
				<Button disabled={isInItinerary} on:click={addToItinerary} class="h-11 w-full">
					{isInItinerary ? 'Added' : 'Add to Itinerary'}
				</Button>
			{/if}
		</div>
	</div>
</Card>
