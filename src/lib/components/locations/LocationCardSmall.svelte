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
	export let contentLocation: any;
	export let user: any;
	export let innerWidth: number;

	let location: Location = contentLocation.location;
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
			name: user?.email ?? '',
			userId: user?.id
		});
	}
</script>

<Card
	horizontal={true}
	{size}
	class="mx-auto flex max-w-md flex-col bg-white p-4 shadow-md transition-shadow duration-300 hover:shadow-lg sm:flex-row sm:gap-2 sm:p-6 md:gap-4"
>
	<div
		style={innerWidth >= 640 ? 'width: 50%;' : 'width: 100%;'}
		class="flex flex-col items-center"
	>
		<img src="/map/{getLocationIcon(name)}.png" alt="" class="mb-3 w-full object-contain" />

		{#if tags?.length}
			<details class="mb-3 w-full sm:hidden">
				<summary
					class="cursor-pointer rounded-md bg-secondary-100 p-2 text-center text-primary-700"
				>
					Tags
				</summary>
				<ul class="mt-2 flex flex-wrap gap-1">
					{#each tags as tag}
						<li
							class="rounded-full bg-secondary-200 px-2.5 py-0.5 text-xs font-medium text-primary-700"
						>
							{tag?.tags.name}
						</li>
					{/each}
				</ul>
			</details>
			<ul class="mb-3 hidden w-full flex-wrap gap-1 sm:flex">
				{#each tags as tag}
					<li
						class="rounded-full bg-secondary-200 px-2.5 py-0.5 text-xs font-medium text-primary-700"
					>
						{tag?.tags.name}
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<div class="flex min-w-0 flex-grow flex-col">
		<h5 title={name} class="mb-2 text-wrap text-lg font-bold text-primary-700">
			{name}
		</h5>

		<p class="mb-3 text-sm text-neutral-600">
			<span class="hidden sm:inline">{addressPart1},<br /></span>
			{trimmedAddress}
		</p>

		<div class="mt-auto flex flex-col gap-2">
			<a
				href={`/locations/states/${location.state}/${location.city}/${name}`.replace(/\s/g, '-')}
				class="w-full"
			>
				<Button
					color="primary"
					size="sm"
					class="w-full hover:outline hover:outline-2 hover:outline-primary-600">Details</Button
				>
			</a>
			{#if website}
				<a href={website} target="_blank" rel="noopener noreferrer">
					<Button
						color="alternative"
						size="sm"
						class="w-full hover:outline hover:outline-2 hover:outline-primary-600"
						>Visit Website</Button
					>
				</a>
			{/if}

			{#if distance}
				<div class="text-sm text-neutral-600">
					<p>Distance: {distance} miles</p>
					<p>Duration: {duration} minutes</p>
				</div>
			{:else}
				<Button
					color="alternative"
					size="sm"
					on:click={getHowFarAwayIsLocation}
					class="w-full hover:outline hover:outline-2 hover:outline-primary-600"
				>
					{distanceLoading ? 'Loading...' : 'How far away is it?'}
				</Button>
			{/if}
			{#if user}
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
	</div>
</Card>
