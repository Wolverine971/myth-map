<!-- src/lib/components/locations/LocationCard.svelte -->
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
	$: detailsUrl = location?.state && location?.city && name 
		? `/locations/states/${location.state}/${location.city.replace(/\s+/g, '-')}/${name.replace(/\s+/g, '-')}`
		: '#';

	// Safely truncate name
	$: displayName = name && name.length > 40 ? name.slice(0, 40) + '...' : (name || 'Unknown Location');

	// Get location icon safely
	$: locationIcon = name ? getLocationIcon(name) : 'mythmap';
</script>

<Card padding="none" class="overflow-hidden transition-shadow duration-300 hover:shadow-lg">
	<!-- Image with error handling -->
	<div class="relative h-48 w-full bg-gray-200">
		<img 
			src="/map/{locationIcon}.png" 
			alt={name || 'Location'} 
			class="h-full w-full object-cover"
			on:error={(e) => {
				// Fallback to default image if specific icon fails
				e.currentTarget.src = '/map/mythmap.png';
			}}
		/>
		
		<!-- Tag overlay for quick identification -->
		{#if tags?.length > 0}
			<div class="absolute top-2 left-2">
				<span class="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-primary-700">
					{tags[0]?.tags?.name || 'Activity'}
				</span>
			</div>
		{/if}
	</div>

	<div class="px-4 md:p-4">
		<h3 title={name} class="mb-2 text-lg font-bold text-primary-700 leading-tight">
			{displayName}
		</h3>

		{#if addressPart2Joined}
			<p class="mb-3 text-sm text-neutral-600">
				{addressPart2Joined}
			</p>
		{/if}

		<!-- Tags section with better overflow handling -->
		{#if tags?.length}
			<div class="mb-3">
				<div class="flex flex-wrap gap-1">
					{#each tags as tag}
						{#if tag?.tags?.name}
							<span class="rounded-full bg-secondary-200 px-2 py-0.5 text-xs font-medium text-primary-700">
								{tag.tags.name}
							</span>
						{/if}
					{/each}
					
				</div>
			</div>
		{/if}

		<!-- Distance info display -->
		{#if distance && duration}
			<div class="mb-3 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
				<div class="flex justify-between">
					<span>🚗 {distance} miles</span>
					<span>⏱️ {duration} min</span>
				</div>
			</div>
		{/if}

		<!-- Action buttons -->
		<div class="mt-4 flex flex-col gap-2">
			<a href={detailsUrl} class="w-full">
				<Button
					color="primary"
					size="sm"
					style="display: flex; justify-content: space-between;"
					class="w-full hover:outline hover:outline-2 hover:outline-primary-600"
				>
					<span>Details</span>
					<ChevronRightOutline class="w-4 h-4 ml-2 text-white" />
				</Button>
			</a>

			<Button
				color="alternative"
				size="sm"
				style="display: flex; justify-content: space-between;"
				class="w-full hover:outline hover:outline-2 hover:outline-primary-600"
			>
				<span>More options</span>
				<ChevronDownOutline class="w-4 h-4 ml-2 text-black dark:text-white" />
			</Button>

			<Dropdown>
				<!-- Website link -->
				{#if website}
					<DropdownItem>
						<a href={website} target="_blank" rel="noopener noreferrer" class="w-full">
							<Button
								color="alternative"
								size="sm"
								class="w-full hover:outline hover:outline-2 hover:outline-primary-600"
							>
								🌐 Visit Website
							</Button>
						</a>
					</DropdownItem>
				{/if}

				<!-- Distance calculation -->
				<DropdownItem>
					{#if distance && duration}
						<div class="text-sm text-neutral-600 p-2">
							<p class="font-medium">📍 Distance: {distance} miles</p>
							<p class="font-medium">⏱️ Duration: {duration} minutes</p>
							<button 
								class="text-xs text-gray-500 underline mt-1"
								on:click={getHowFarAwayIsLocation}
							>
								Recalculate
							</button>
						</div>
					{:else}
						<Button
							color="alternative"
							size="sm"
							on:click={getHowFarAwayIsLocation}
							disabled={distanceLoading}
							class="w-full hover:outline hover:outline-2 hover:outline-primary-600"
						>
							{#if distanceLoading}
								🔄 Calculating...
							{:else if distanceError}
								❌ Error - Try again
							{:else}
								📍 How far away?
							{/if}
						</Button>
					{/if}
				</DropdownItem>

				<!-- Add to itinerary -->
				{#if user}
					<DropdownItem>
						<Button
							color="alternative"
							disabled={isInItinerary}
							on:click={addToItinerary}
							class="w-full hover:outline hover:outline-2 hover:outline-primary-600"
						>
							{#if isInItinerary}
								✅ Added to Itinerary
							{:else}
								➕ Add to Itinerary
							{/if}
						</Button>
					</DropdownItem>
				
				{/if}
			</Dropdown>
		</div>
	</div>
</Card>