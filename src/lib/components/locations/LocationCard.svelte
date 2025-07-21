<!-- src/lib/components/locations/LocationCard.svelte -->
<script lang="ts">
	import { Card, Button, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ChevronDownOutline, ChevronRightOutline } from 'flowbite-svelte-icons';
	import SimpleImage from '$lib/components/shared/SimpleImage.svelte';
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
	let duration: number | null = null;
	let distance: number | null = null;
	let distanceLoading = false;
	let distanceError = false;
	let userLocation: { lat: number; lng: number } | null = null;
	let isInItinerary = false;

	// Fix address parsing to handle undefined/null cases
	$: addressParts = address ? address.split(',') : [];
	$: addressPart1 = addressParts[0] || '';
	$: addressPart2Joined = addressParts.length > 1 ? addressParts.slice(1).join(',').trim() : '';

	// Subscribe to stores
	currentLocation.subscribe((value) => (userLocation = value));
	currentItinerary.subscribe((value) => {
		isInItinerary = value?.items?.some((item) => item.location.id === location.id) ?? false;
	});

	async function getHowFarAwayIsLocation() {
		if (distanceLoading || !browser) return;

		distanceLoading = true;
		distanceError = false;

		try {
			// Get user location if not available
			if (!userLocation) {
				await getCurrentLocation();
				userLocation = $currentLocation;
			}

			if (!userLocation) {
				throw new Error('Unable to get user location');
			}

			// Validate coordinates
			if (!coords.lat || !coords.lng || isNaN(coords.lat) || isNaN(coords.lng)) {
				throw new Error('Invalid location coordinates');
			}

			const body = new FormData();
			body.append('originlat', userLocation.lat.toString());
			body.append('originlng', userLocation.lng.toString());
			body.append('destinationlat', coords.lat.toString());
			body.append('destinationlng', coords.lng.toString());

			const response = await fetch('?/getHowFarAwayIsLocation', {
				method: 'POST',
				body
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result: any = deserialize(await response.text());

			if (result.type === 'success' && result.data) {
				duration = result.data.duration;
				distance = result.data.distance;
			} else {
				throw new Error(result.error || 'Unknown error calculating distance');
			}
		} catch (error) {
			console.error('Error calculating distance:', error);
			distanceError = true;
			duration = null;
			distance = null;
		} finally {
			distanceLoading = false;
		}
	}

	function addToItinerary() {
		if (!location || !user) return;

		try {
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
		} catch (error) {
			console.error('Error adding to itinerary:', error);
		}
	}

	// Safely generate the details URL
	$: detailsUrl =
		location?.state && location?.city && name
			? `/locations/states/${location.state}/${location.city.replace(/\s+/g, '-')}/${name.replace(/\s+/g, '-')}`
			: '#';

	// Safely truncate name
	$: displayName =
		name && name.length > 40 ? name.slice(0, 40) + '...' : name || 'Unknown Location';

	// Get location icon safely
	$: locationIcon = (() => {
		const icon = name ? getLocationIcon(name) : 'mythmap';
		console.log('LocationCard - Location:', name, 'Icon:', icon, 'Full path:', `/map/${icon}.png`);
		return icon;
	})();
</script>

<Card padding="none" class="group flex h-full flex-col overflow-hidden transition-smooth hover-lift hover:shadow-lg">
	<!-- Image with overlay -->
	<div class="relative">
		<SimpleImage
			src="/map/{locationIcon}.png"
			alt={name || 'Location'}
			fallbackSrc="/map/mythmap.png"
			aspectRatio="aspect-video"
		/>
		
		<!-- Tag overlay for quick identification -->
		{#if tags?.length > 0}
			<div class="absolute left-2 top-2">
				<span
					class="rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-primary-700 backdrop-blur-sm shadow-sm"
				>
					{tags[0]?.tags?.name || 'Activity'}
				</span>
			</div>
		{/if}
	</div>

	<div class="flex flex-1 flex-col p-4">
		<h3 title={name} class="mb-2 line-clamp-2 text-base font-bold leading-tight text-primary-700 sm:text-lg">
			{displayName}
		</h3>

		{#if addressPart2Joined}
			<p class="mb-3 line-clamp-1 text-sm text-gray-600">
				{addressPart2Joined}
			</p>
		{/if}

		<!-- Tags section with better overflow handling -->
		{#if tags?.length}
			<div class="mb-3">
				<div class="flex flex-wrap gap-1">
					{#each tags as tag}
						{#if tag?.tags?.name}
							<span
								class="inline-block rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-medium text-primary-700"
							>
								{tag.tags.name}
							</span>
						{/if}
					{/each}
				</div>
			</div>
		{/if}

		<!-- Distance info display -->
		{#if distance && duration}
			<div class="mb-3 rounded-lg bg-green-50 px-3 py-2">
				<div class="flex justify-between text-xs sm:text-sm">
					<span class="text-green-700">🚗 {distance} miles</span>
					<span class="text-green-700">⏱️ {duration} min</span>
				</div>
			</div>
		{/if}

		<!-- Action buttons -->
		<div class="mt-auto flex flex-col gap-2 pt-2">
			<a href={detailsUrl} class="w-full">
				<Button
					color="primary"
					size="xs"
					class="w-full justify-between transition-transform hover:scale-105 active:scale-95"
				>
					<span>View Details</span>
					<ChevronRightOutline class="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
				</Button>
			</a>

			{#if website}
				<a href={website} target="_blank" rel="noopener noreferrer" class="w-full">
					<Button
						color="alternative"
						size="xs"
						class="w-full transition-colors hover:bg-primary-50 hover:text-primary-700"
					>
						🌐 Website
					</Button>
				</a>
			{/if}
		</div>
	</div>
</Card>
