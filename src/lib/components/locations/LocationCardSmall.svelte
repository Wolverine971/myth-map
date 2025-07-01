<!-- src/lib/components/locations/LocationCardSmall.svelte -->
<script lang="ts">
	import { Card, Button, Badge } from 'flowbite-svelte';
	import { browser } from '$app/environment';
	import { getLocationIcon } from '../../../utils/locationPhotos';
	import { currentLocation } from '$lib/stores/locationStore';
	import { deserialize } from '$app/forms';
	import { getCurrentLocation } from '../../../utils/userLocation';
	import { currentItinerary } from '$lib/stores/itineraryStore';
	import type { Location } from '$lib/types';
	import { 
		ChevronRightOutline, 
		MapPinOutline, 
		ClockOutline,
		StarOutline,
		PlusOutline,
		CheckOutline
	} from 'flowbite-svelte-icons';

	export let name: string;
	export let address: string;
	export let website: string = '';
	export let tags: Array<{ tags: { name: string } }> = [];
	export let coords: { lat: number; lng: number };
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
	let showDetails = false;

	// Parse address for better display
	$: addressParts = address ? address.split(',') : [];
	$: streetAddress = addressParts[0] || '';
	$: cityStateZip = addressParts.length > 1 ? addressParts.slice(1).join(',').trim() : '';

	// Subscribe to stores
	currentLocation.subscribe((value) => (userLocation = value));
	currentItinerary.subscribe((value) => {
		isInItinerary = value?.items?.some((item) => item.location.id === location.id) ?? false;
	});

	async function getDistanceInfo() {
		if (distanceLoading || !browser || distance !== null) return;
		
		distanceLoading = true;
		distanceError = false;

		try {
			if (!userLocation) {
				await getCurrentLocation();
				userLocation = $currentLocation;
			}

			if (!userLocation) {
				throw new Error('Unable to get location');
			}

			const body = new FormData();
			body.append('originlat', userLocation.lat.toString());
			body.append('originlng', userLocation.lng.toString());
			body.append('destinationlat', coords.lat.toString());
			body.append('destinationlng', coords.lng.toString());

			const response = await fetch('?/getHowFarAwayIsLocation', { method: 'POST', body });
			const result: any = deserialize(await response.text());

			if (result.type === 'success' && result.data) {
				duration = result.data.duration;
				distance = result.data.distance;
			} else {
				throw new Error(result.error || 'Failed to get distance');
			}
		} catch (error) {
			console.error('Distance calculation error:', error);
			distanceError = true;
		} finally {
			distanceLoading = false;
		}
	}

	function addToItinerary() {
		if (!location || !user) return;

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

	// Generate safe URL for location details
	$: detailsUrl = location?.state && location?.city && name 
		? `/locations/states/${location.state}/${location.city.replace(/\s+/g, '-')}/${name.replace(/\s+/g, '-')}`
		: '#';

	// Truncate name for display
	$: displayName = name && name.length > 45 ? name.slice(0, 45) + '...' : (name || 'Unknown Location');

	// Get primary tag for display
	$: primaryTag = tags?.[0]?.tags?.name || null;
</script>

<Card class="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
	<!-- Image Section -->
	<div class="relative h-48 sm:h-40 bg-gray-100 overflow-hidden">
		<img 
			src="/map/{getLocationIcon(name || 'default')}.png" 
			alt={name || 'Location'}
			class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
			loading="lazy"
			on:error={(e) => {
				e.currentTarget.src = '/map/mythmap.png';
			}}
		/>
		
		<!-- Category Badge -->
		{#if primaryTag}
			<div class="absolute top-3 left-3">
				<Badge color="primary" class="text-xs font-medium bg-white/90 text-primary-700">
					{primaryTag}
				</Badge>
			</div>
		{/if}

		<!-- Distance Badge -->
		{#if distance}
			<div class="absolute top-3 right-3">
				<Badge color="dark" class="text-xs bg-black/70 text-white">
					{distance} mi • {duration} min
				</Badge>
			</div>
		{:else if !distanceLoading && !distanceError}
			<!-- Auto-load distance when card comes into view -->
			<div class="absolute top-3 right-3">
				<button 
					on:click={getDistanceInfo}
					class="text-xs bg-black/70 text-white px-2 py-1 rounded-full hover:bg-black/80 transition-colors"
				>
					📍 Distance?
				</button>
			</div>
		{/if}
	</div>

	<!-- Content Section -->
	<div class="p-4 space-y-4">
		<!-- Header -->
		<div class="space-y-2">
			<h3 class="font-bold text-lg text-gray-900 leading-tight group-hover:text-primary-700 transition-colors">
				{displayName}
			</h3>
			
			<!-- Address -->
			<div class="flex items-start gap-2 text-sm text-gray-600">
				<MapPinOutline class="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
				<div class="min-w-0">
					<p class="truncate">{streetAddress}</p>
					{#if cityStateZip}
						<p class="truncate text-xs">{cityStateZip}</p>
					{/if}
				</div>
			</div>
			
			<!-- Rating placeholder - you can implement this when you have rating data -->
			<div class="flex items-center gap-1">
				{#each Array(5) as _, i}
					<StarOutline class="w-3 h-3 text-yellow-400" />
				{/each}
				<span class="text-xs text-gray-500 ml-1">(42)</span>
			</div>
		</div>

		<!-- Tags -->
		{#if tags.length > 0}
			<div class="flex flex-wrap gap-1">
				{#each tags.slice(0, 3) as tag}
					{#if tag?.tags?.name}
						<Badge color="light" class="text-xs">
							{tag.tags.name}
						</Badge>
					{/if}
				{/each}
				{#if tags.length > 3}
					<Badge color="light" class="text-xs text-gray-500">
						+{tags.length - 3}
					</Badge>
				{/if}
			</div>
		{/if}

		<!-- Distance Info -->
		{#if distance && duration}
			<div class="flex items-center gap-2 text-sm bg-green-50 text-green-700 px-3 py-2 rounded-lg">
				<ClockOutline class="w-4 h-4" />
				<span>{distance} miles • {duration} minutes drive</span>
			</div>
		{:else if distanceLoading}
			<div class="flex items-center gap-2 text-sm bg-gray-50 text-gray-600 px-3 py-2 rounded-lg">
				<div class="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin"></div>
				<span>Calculating distance...</span>
			</div>
		{:else if distanceError}
			<div class="flex items-center gap-2 text-sm bg-red-50 text-red-600 px-3 py-2 rounded-lg">
				<span>Distance unavailable</span>
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="flex flex-col sm:flex-row gap-2 pt-2">
			<a href={detailsUrl} class="flex-1">
				<Button 
					color="primary" 
					size="sm" 
					class="w-full flex items-center justify-center gap-2 hover:shadow-md transition-shadow"
				>
					<span>View Details</span>
					<ChevronRightOutline class="w-4 h-4" />
				</Button>
			</a>

			{#if user}
				<Button
					color={isInItinerary ? "green" : "alternative"}
					size="sm"
					disabled={isInItinerary}
					on:click={addToItinerary}
					class="flex-shrink-0 flex items-center justify-center gap-2"
				>
					{#if isInItinerary}
						<CheckOutline class="w-4 h-4" />
						<span class="hidden sm:inline">Added</span>
					{:else}
						<PlusOutline class="w-4 h-4" />
						<span class="hidden sm:inline">Save</span>
					{/if}
				</Button>
			{/if}
		</div>

		<!-- Expandable Details -->
		{#if website || tags.length > 3}
			<div class="border-t pt-3">
				<button 
					on:click={() => showDetails = !showDetails}
					class="text-sm text-primary-600 hover:text-primary-800 transition-colors"
				>
					{showDetails ? 'Hide' : 'Show'} more details
				</button>
				
				{#if showDetails}
					<div class="mt-3 space-y-2">
						{#if website}
							<a 
								href={website} 
								target="_blank" 
								rel="noopener noreferrer"
								class="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800"
							>
								🌐 Visit Website
								<ChevronRightOutline class="w-3 h-3" />
							</a>
						{/if}
						
						{#if tags.length > 3}
							<div class="flex flex-wrap gap-1">
								{#each tags.slice(3) as tag}
									{#if tag?.tags?.name}
										<Badge color="light" class="text-xs">
											{tag.tags.name}
										</Badge>
									{/if}
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</Card>

<!-- Auto-load distance when card becomes visible -->
{#if !distance && !distanceLoading && !distanceError}
	<div class="intersection-observer" on:intersect={getDistanceInfo}></div>
{/if}

<style>
	/* Intersection observer for auto-loading distance */
	.intersection-observer {
		position: absolute;
		top: 0;
		left: 0;
		width: 1px;
		height: 1px;
		opacity: 0;
		pointer-events: none;
	}
	
	/* Loading animation */
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>