<script lang="ts">
	import { currentItinerary } from '$lib/stores/itineraryStore';
	import NavBar from '$lib/components/base/NavBar.svelte';
	import ItineraryModal from '$lib/components/itinerary/ItineraryModal.svelte';
	import Toast from '$lib/components/shared/Toast.svelte';
	import '../app.css';
	import { Button } from 'flowbite-svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';

	export let data: LayoutData;

	let innerWidth = 0;
	let isItineraryModalOpen = false;
	let hasItinerary = false;
	let itinerary;

	$: hasItinerary = !!$currentItinerary;
	$: itinerary = $currentItinerary;

	let { supabase, session } = data;
	$: ({ supabase, session } = data);
</script>

<svelte:window bind:innerWidth />

<NavBar user={session?.user} />

<Toast />

<hr />

<main class="flex min-h-[calc(100vh-60px)] flex-col items-center justify-center pb-20">
	<slot></slot>
</main>

{#if hasItinerary && !$page.route.id?.includes('itineraries')}
	<div
		class="fixed bottom-0 left-0 right-0 flex h-20 items-center justify-center gap-2 bg-gray-100 p-2 shadow-md"
	>
		<a href="/itineraries/{itinerary.id}" class="w-1/4">
			<Button outline color="primary" size="sm" class="w-full">Go to Itinerary</Button>
		</a>
		<Button
			outline
			color="alternative"
			size="sm"
			class="w-1/4"
			on:click={() => (isItineraryModalOpen = true)}
		>
			Edit Current Itinerary
		</Button>
	</div>
{/if}

<ItineraryModal bind:isOpen={isItineraryModalOpen} />
