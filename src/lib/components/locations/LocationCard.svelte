<script lang="ts">
	import { Card, Button, type SizeType } from 'flowbite-svelte';
	import { getLocationIcon } from '../../../utils/locationPhotos';
	import { currentLocation } from '$lib/stores/locationStore';
	import { deserialize } from '$app/forms';
	import { getCurrentLocation } from '../../../utils/userLocation';

	export let name: string;
	export let address: string;
	export let website: string;
	export let tags: Array<{ tags: { name: string } }>;
	export let coords: { lat: number; lng: number };
	export let size: SizeType = 'md';
	export let location;

	let duration: number;
	let distance: number;
	let distanceLoading = false;
	let userLocation: { lat: number; lng: number } | null;

	currentLocation.subscribe((value) => (userLocation = value));

	const [addressPart1, ...addressPart2] = address.split(',');

	async function getHowFarAwayIsLocation() {
		if (distanceLoading) return;
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
</script>

<Card horizontal {size}>
	<img src="/map/{getLocationIcon(name)}.png" alt="" class="img-icon" />

	<div class="card-content">
		<h5 class="card-title">{name}</h5>
		<p class="card-address">
			{addressPart1}<br />
			{addressPart2}
		</p>

		{#if tags?.length}
			<ul class="tag-list">
				{#each tags as tag}
					<li class="chip {size === 'sm' ? 'small-chip' : ''}">{tag?.tags.name}</li>
				{/each}
			</ul>
		{/if}

		<div class="card-actions">
			<a href={website} target="_blank" rel="noopener noreferrer">
				<Button outline color="primary" size="md" block>Visit Website</Button>
			</a>
			<a
				href="/locations/states/{location.state}/{location.city}/{name.replace(/\s/g, '-')}"
				style="margin-left: auto;"
			>
				<Button outline color="alternative" size="md" block>Details</Button>
			</a>
			{#if distance}
				<div class="distance-info">
					<p>Distance: {distance} miles</p>
					<p>Duration: {duration} minutes</p>
				</div>
			{:else}
				<Button
					style="margin-top: .25rem; height: 43px;"
					type="button"
					outline
					color="alternative"
					size="md"
					on:click={getHowFarAwayIsLocation}
					block
				>
					{distanceLoading ? 'Loading...' : 'How far away is it?'}
				</Button>
			{/if}
		</div>
	</div>
</Card>

<style>
	.img-icon {
		object-fit: contain;
		width: 12rem;
	}
	.card-content {
		display: flex;
		flex-direction: column;
		min-height: 170px;
		margin-left: 0.5rem;
	}
	.card-title {
		margin-bottom: 0.5rem;
		font-size: 1.5rem;
		font-weight: bold;
		line-height: 1.2;
	}
	.card-address {
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
		line-height: 1.25;
	}
	.tag-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2rem;
		margin: 0.5rem 0;
	}
	.chip {
		background-color: #f1f1f1;
		border-radius: 10px;
		padding: 0.2rem 0.5rem;
		font-size: medium;
		pointer-events: none;
	}
	.small-chip {
		padding: 0.1rem 0.3rem;
		font-size: small;
	}
	.card-actions {
		margin-top: auto;
	}
	.distance-info {
		margin-top: 0.25rem;
		height: 43px;
	}
</style>
