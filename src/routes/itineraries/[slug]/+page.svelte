<script lang="ts">
	import type { PageData } from './$types';
	import { currentItinerary } from '$lib/stores/itineraryStore';
	import LocationCardSmall from '$lib/components/locations/LocationCardSmall.svelte';
	import { Card, Button, Heading, P, List, Li } from 'flowbite-svelte';

	import QRCode from 'qrcode';
	import { onMount } from 'svelte';

	export let data: PageData;
	console.log('data', data);

	let qrCodeUrl = '';
	const QR_OPTS = {
		errorCorrectionLevel: 'H',
		type: 'image/png',
		quality: 0.7,
		margin: 1,
		color: {
			dark: '',
			light: '#c1c0c036'
		}
	};

	$: currentItinerary.setItinerary(data.itinerary);
	$: qrCodeSize = innerWidth > 400 ? '20%' : '30%';

	let innerWidth = 0;

	console.log(data.itinerary);
	onMount(() => {
		QRCode.toDataURL(`https://tinytribeadventures.com/itineraries/${data.itinerary.id}`, QR_OPTS)
			.then((url) => (qrCodeUrl = url))
			.catch((err) => console.error('QR Code generation failed:', err));
	});
</script>

<svelte:window bind:innerWidth />
<Card class="mb-6 max-w-lg">
	<div class="heading-container">
		<Heading tag="h1" class="mb-2" style="overflow-wrap: anywhere; font-size: 2rem"
			>{data.itinerary.name}</Heading
		>
		<img
			src={qrCodeUrl}
			alt="9takes QR Code"
			class="qr-image-border"
			style="width: {qrCodeSize};"
		/>
	</div>
	<P>From: {data.itinerary.start_date} To: {data.itinerary.end_date}</P>
</Card>

<Card class="mb-6 max-w-lg ">
	<Heading tag="h2" class="mb-4">Locations</Heading>

	{#if data.itinerary.items.length === 0}
		<P>No locations added to this itinerary yet.</P>
	{:else}
		{#each data.itinerary.items.sort((a, b) => a.order_index - b.order_index) as item}
			<LocationCardSmall
				name={item.location.name}
				coords={{ lat: item.location.lat, lng: item.location.lng }}
				address={`${item.location.address_line_1}${item.location.address_line_2 ? ` ${item.location.address_line_2}` : ''}, ${item.location.city}, ${item.location.state} ${item.location.zip_code}`}
				website={item.location.website}
				tags={[]}
				location={item.location}
				user={data.user}
				{innerWidth}
			/>
		{/each}
	{/if}
</Card>

<div class="mt-4">
	<Button href="/itineraries/{data.itinerary.id}/edit">Edit Itinerary</Button>
</div>

<style>
	.heading-container {
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
