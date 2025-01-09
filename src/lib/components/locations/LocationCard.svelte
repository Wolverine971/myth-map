<script lang="ts">
	import { Card, Button, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ChevronDownOutline, ChevronRightOutline } from 'flowbite-svelte-icons';
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
	$: addressPart2Joined = addressPart2.join(',').trim();

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

<Card padding="none" class="overflow-hidden transition-shadow duration-300 hover:shadow-lg">
	<img src="/map/{getLocationIcon(name)}.png" alt="" class="h-48 w-full object-cover" />
	<div class="px-4 md:p-4">
		<h3 title={name} class="mb-2 whitespace-nowrap text-wrap text-lg font-bold text-primary-700">
			{name.length > 40 ? name.slice(0, 40) + '...' : name}
		</h3>

		<p class="mb-3 text-sm text-neutral-600">
			{addressPart2Joined}
		</p>

		{#if tags?.length}
			<div class="mb-3">
				<ul class="flex flex-wrap gap-1">
					{#each tags as tag}
						<li
							class="rounded-full bg-secondary-200 px-2 py-0.5 text-xs font-medium text-primary-700"
						>
							{tag?.tags.name}
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="mt-4 flex flex-col gap-2">
			<a
				href={`/locations/states/${location.state}/${location.city}/${name}`.replace(/\s/g, '-')}
				class="w-full"
			>
				<Button
					color="primary"
					size="sm"
					style="display: flex; justify-content: space-between;"
					class="w-full hover:outline hover:outline-2 hover:outline-primary-600"
					><span>Details</span>
					<ChevronRightOutline class="w-6 h-6 ms-2 text-white dark:text-white" /></Button
				>
			</a>
			<Button
				color="alternative"
				size="sm"
				style="display: flex; justify-content: space-between;"
				class="w-full hover:outline hover:outline-2 hover:outline-primary-600"
				><span>More options</span><ChevronDownOutline
					class="w-6 h-6 ms-2 text-black dark:text-white"
				/></Button
			>
			<Dropdown>
				<DropdownItem
					>{#if website}
						<a href={website} target="_blank" rel="noopener noreferrer">
							<Button
								color="alternative"
								size="sm"
								class="w-full hover:outline hover:outline-2 hover:outline-primary-600"
								>Visit Website</Button
							>
						</a>
					{/if}</DropdownItem
				>
				<DropdownItem
					>{#if distance}
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
					{/if}</DropdownItem
				>
				<DropdownItem
					>{#if user}
						<Button
							color="alternative"
							disabled={isInItinerary}
							on:click={addToItinerary}
							class="w-full hover:outline hover:outline-2 hover:outline-primary-600"
						>
							{isInItinerary ? 'Added to Itinerary' : 'Add to Itinerary'}
						</Button>
					{/if}</DropdownItem
				>
			</Dropdown>
		</div>
	</div>
</Card>
