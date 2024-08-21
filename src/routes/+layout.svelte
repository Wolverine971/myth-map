<script lang="ts">
	import { onMount } from 'svelte';
	import { currentItinerary } from '$lib/stores/itineraryStore';
	import NavBar from '$lib/components/base/NavBar.svelte';
	import ItineraryModal from '$lib/components/itinerary/ItineraryModal.svelte';
	import '../app.css';
	import { Button } from 'flowbite-svelte';
	// import { supabase } from '$lib/supabaseClient';
	import { supabase } from '$lib/supabaseClient';


	import { invalidate } from '$app/navigation';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	$: ({ session } = data);

	console.log('layoutsession', session);

	let innerWidth = 0;
	let isItineraryModalOpen = false;
	let hasItinerary = false;
	let itinerary;
	currentItinerary.subscribe((value) => {
		if (value) {
			itinerary = value;
		}
	});

	// onMount(() => {
	// 	const {
	// 		data: { subscription }
	// 	} = supabase.auth.onAuthStateChange((event, _session) => {
	// 		if (_session?.expires_at !== session?.expires_at) {
	// 			invalidate('supabase:auth');
	// 		}
	// 	});

	// 	const unsubscribe = currentItinerary.subscribe((itinerary) => {
	// 		hasItinerary = !!itinerary;
	// 	});

	// 	return unsubscribe;
	// });


	currentItinerary.subscribe((itinerary) => {
			hasItinerary = !!itinerary;
		});
	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange(( state, _session) => {
			if (state == 'SIGNED_IN') {
				session = _session;
				// session.user.set(session.user);
				console.log('session.user', _session.user);
			} else {
				session?.user?.set(false);
			}
			// invalidateAll();
			if (state === 'PASSWORD_RECOVERY') {
				// redirect user to the page where it creates a new password
				return {
					status: 302,
					redirect: '/resetPassword'
				};
			}
		});
		return () => {
			subscription.unsubscribe();
		};
	});


</script>

<svelte:window bind:innerWidth />

<NavBar {innerWidth} />

<hr />

<main
	
>
<!-- style="display: flex; flex-direction:column; justify-content: center; align-items:center; padding-bottom: 60px;" -->
	<slot></slot>
</main>

{#if hasItinerary}
	<div class="bottom-bar">
		<a href="/itineraries/{itinerary.id}">
			<Button outline color="primary" size="sm" block>Go to Itinerary</Button>
		</a>
		<Button
			outline
			color="alternative"
			size="sm"
			block
			on:click={() => (isItineraryModalOpen = true)}>Edit Itinerary</Button
		>
	</div>
{/if}

<ItineraryModal bind:isOpen={isItineraryModalOpen} />

<style>
	main {
		min-height: calc(100vh - 60px); /* Adjust based on your navbar height */
	}

	.bottom-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 60px;
		background-color: #f0f0f0;
		display: flex;
		justify-content: center;
		gap: 1rem;
		align-items: center;
		box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
	}

	.bottom-bar button {
		padding: 10px 20px;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		font-size: 16px;
	}

	.bottom-bar button:hover {
		background-color: #0056b3;
	}
</style>
