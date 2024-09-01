<script lang="ts">
	import type { PageData } from './$types';
	import { currentItinerary } from '$lib/stores/itineraryStore';
	import LocationCardSmall from '$lib/components/locations/LocationCardSmall.svelte';
	import { Card, Button, Heading, P } from 'flowbite-svelte';
	import CalendarInviteComponent from '$lib/components/itinerary/GoogleCalendarInvites.svelte';
	import QRCode from 'qrcode';
	import { onMount } from 'svelte';
	import { notifications } from '$lib/components/shared/notifications';
	import SendInvites from '$lib/components/itinerary/SendInvites.svelte';

	export let data: PageData;

	let qrCodeUrl = '';
	const QR_OPTS = {
		errorCorrectionLevel: 'H',
		type: 'image/png',
		quality: 0.7,
		margin: 1,
		color: {
			dark: '#000000',
			light: '#ffffff'
		}
	};

	$: currentItinerary.setItinerary(data.itinerary);
	let innerWidth = 0;

	onMount(() => {
		QRCode.toDataURL(`https://tinytribeadventures.com/itineraries/${data.itinerary.id}`, QR_OPTS)
			.then((url) => (qrCodeUrl = url))
			.catch((err) => console.error('QR Code generation failed:', err));
	});

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function shareItinerary() {
		if (navigator.share) {
			navigator
				.share({
					title: 'Check out my itinerary!',
					text: 'I created this awesome itinerary. Take a look!',
					url: window.location.href
				})
				.then(() => {
					console.log('Itinerary shared successfully');
				})
				.catch((error) => {
					console.log('Error sharing itinerary:', error);
				});
		} else {
			// Fallback for browsers that don't support the Web Share API
			const shareUrl = window.location.href;
			navigator.clipboard
				.writeText(shareUrl)
				.then(() => {
					alert('Itinerary link copied to clipboard!');
				})
				.catch((err) => {
					console.error('Failed to copy: ', err);
				});
		}
	}
	console.log(data);
</script>

<svelte:window bind:innerWidth />

<div class="container mx-auto max-w-7xl bg-secondary-50 px-4 py-8">
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		<div class="lg:col-span-2">
			<Card class="mb-8 max-w-xl bg-white shadow-lg">
				<div class="mb-6 flex flex-col items-center justify-between md:flex-row">
					<Heading
						tag="h1"
						class="mb-4 text-center text-3xl font-bold text-primary-700 md:mb-0 md:text-left md:text-4xl"
						style="overflow-wrap: break-word;"
					>
						{data.itinerary.name}
					</Heading>
					<img
						src={qrCodeUrl}
						alt="Itinerary QR Code"
						class="h-24 w-24 rounded-lg border-4 border-secondary-200 shadow-md md:h-32 md:w-32"
					/>
				</div>
				<div class="flex flex-wrap items-center justify-between">
					<P class="mb-2 mr-4 text-lg text-neutral-700"
						>From: {formatDate(data.itinerary.start_date)}</P
					>
					<P class="mb-2 text-lg text-neutral-700">To: {formatDate(data.itinerary.end_date)}</P>
				</div>
			</Card>

			<Card class="mb-8 max-w-xl bg-white shadow-lg">
				<Heading tag="h2" class="mb-6 text-2xl font-semibold text-primary-600">Locations</Heading>

				{#if data.itinerary.items.length === 0}
					<P class="text-lg text-neutral-600">No locations added to this itinerary yet.</P>
				{:else}
					<div class="space-y-6">
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
					</div>
				{/if}
			</Card>
		</div>

		<div class="lg:col-span-1">
			<div class="sticky top-8">
				<Card class="mb-8 bg-white shadow-lg">
					<Heading tag="h2" class="mb-6 text-2xl font-semibold text-primary-600"
						>Quick Actions</Heading
					>
					<div class="space-y-4">
						<Button
							href="/itineraries/{data.itinerary.id}/edit"
							color="primary"
							class="w-full"
							disabled={data.itinerary.user_id !== data.user?.id}>Edit Itinerary</Button
						>
						<SendInvites
							itineraryName={data.itinerary.name}
							itineraryId={data.itinerary.id}
							endDate={data.itinerary.end_date}
							startDate={data.itinerary.start_date}
							places={data.itinerary.items}
						/>
						<Button color="primary" on:click={shareItinerary}>Share</Button>
					</div>
				</Card>
			</div>
		</div>
	</div>
</div>
