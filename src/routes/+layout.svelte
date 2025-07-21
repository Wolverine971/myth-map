<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { currentItinerary } from '$lib/stores/itineraryStore';
	import NavBar from '$lib/components/base/NavBar.svelte';
	import { LazyItineraryModal, preloadCriticalComponents } from '$lib/utils/lazyComponents';
	import { initializeOptimizations } from '$lib/utils/appOptimizations';
	import { injectAnimationCSS } from '$lib/utils/pageTransitions';
	import PageTransition from '$lib/components/shared/PageTransition.svelte';
	import Toast from '$lib/components/shared/Toast.svelte';
	import { currentLocation } from '$lib/stores/locationStore';
	import '../app.css';
	import { Button } from 'flowbite-svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { debounce } from '../utils/debounce';
	import { onMount } from 'svelte';

	export let data: LayoutData;

	let innerWidth = 0;
	let isItineraryModalOpen = false;
	let hasItinerary = false;
	let itinerary;
	
	// Get the lazy itinerary modal component
	const { componentStore: itineraryModalComponent, load: loadItineraryModal } = LazyItineraryModal;

	$: hasItinerary = !!$currentItinerary;
	$: itinerary = $currentItinerary;

	let { supabase, session } = data;
	$: ({ supabase, session } = data);

	onMount(() => {
		setupLocationSubscription();
		
		// Initialize app optimizations
		initializeOptimizations();
		
		// Inject animation CSS
		injectAnimationCSS();
		
		// Preload critical components
		preloadCriticalComponents();
		
		// Load itinerary modal if user has an itinerary
		if (hasItinerary) {
			loadItineraryModal();
		}
	});

	function setupLocationSubscription() {
		const debouncedUpdate = debounce(async (value) => {
			if (!value || !session?.user.id) return;
			console.log('Updating location in database', value);

			const { error: upsertError } = await supabase.from('user_last_known_locations').upsert({
				updated_at: new Date(),
				latitude: value.latitude,
				longitude: value.longitude,
				accuracy: value.accuracy,
				heading: value.heading,
				zip_code: null,
				tracking_activated: true,
				user_id: session.user.id
			});

			if (upsertError) {
				console.error('Error updating location:', upsertError);
			}
		}, 5000); // 5000 ms debounce time

		return currentLocation.subscribe(debouncedUpdate);
	}
</script>

<svelte:window bind:innerWidth />

<NavBar user={session?.user} />

<Toast />


<main class="flex min-h-[calc(100vh-4rem)] flex-col">
	<PageTransition>
		<slot></slot>
	</PageTransition>
</main>

{#if hasItinerary && !$page.route.id?.includes('itineraries')}
	<div
		class="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-center gap-2 border-t bg-white p-3 shadow-lg sm:h-20 sm:gap-3 sm:p-4"
	>
		<a href="/itineraries/{itinerary.id}" class="flex-1 sm:flex-none">
			<Button color="primary" size="xs" class="w-full sm:w-auto sm:px-4">
				<span class="text-xs sm:text-sm">View Itinerary</span>
			</Button>
		</a>
		<Button
			color="alternative"
			size="xs"
			class="flex-1 sm:flex-none sm:w-auto sm:px-4"
			on:click={() => {
				loadItineraryModal();
				isItineraryModalOpen = true;
			}}
		>
			<span class="text-xs sm:text-sm">Edit Itinerary</span>
		</Button>
	</div>
{/if}

{#if $itineraryModalComponent}
	<svelte:component this={$itineraryModalComponent} bind:isOpen={isItineraryModalOpen} />
{/if}
