<!-- src/lib/components/locations/LocationCard.svelte -->
<script lang="ts">
	import { Card, Button } from 'flowbite-svelte';
	import { ChevronRightOutline } from 'flowbite-svelte-icons';
	import SimpleImage from '$lib/components/shared/SimpleImage.svelte';
	import { browser } from '$app/environment';
	import { getLocationIcon } from '../../../utils/locationPhotos';
	import { currentLocation } from '$lib/stores/locationStore';
	import { deserialize } from '$app/forms';
	import { getCurrentLocation } from '../../../utils/userLocation';

	export let name: string;
	export let address: string;
	export let website: string;
	export let tags: Array<{ tags: { name: string } }>;
	export let coords: { lat: number; lng: number };
	export let contentLocation: any;
	export let innerWidth: number = 0;

	let duration: number | null = null;
	let distance: number | null = null;
	let distanceLoading = false;
	let distanceError = false;
	let userLocation: { lat: number; lng: number } | null = null;

	$: addressParts = address ? address.split(',') : [];
	$: addressPart2Joined = addressParts.length > 1 ? addressParts.slice(1).join(',').trim() : '';

	currentLocation.subscribe((value) => (userLocation = value));

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
			{#if website}
				<a href={website} target="_blank" rel="noopener noreferrer" class="w-full">
					<Button
						color="primary"
						size="xs"
						class="w-full justify-between transition-transform hover:scale-105 active:scale-95"
					>
						<span>Visit Website</span>
						<ChevronRightOutline class="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
					</Button>
				</a>
			{/if}
		</div>
	</div>
</Card>
