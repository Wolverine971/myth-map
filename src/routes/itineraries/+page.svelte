<script lang="ts">
	import { Button, Card, Heading, Li, List, P } from 'flowbite-svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="container mx-auto bg-secondary-50 px-4 py-8">
	<Heading tag="h1" class="mb-6 text-3xl font-bold text-primary-700">Your Itineraries</Heading>

	{#if data.itineraries.length === 0}
		<P class="text-lg text-neutral-600">You haven't created any itineraries yet.</P>
	{:else}
		<List class="space-y-4" list="none">
			{#each data.itineraries as itinerary (itinerary.id)}
				<Li>
					<Card class="bg-white transition-shadow duration-300 hover:shadow-md">
						<Heading
							tag="h2"
							class="mb-2 text-xl font-semibold text-primary-600"
							style="overflow-wrap: anywhere"
						>
							<a href="/itineraries/{itinerary.id}" class="hover:underline">{itinerary.name}</a>
						</Heading>
						<P class="text-neutral-600">From: {itinerary.start_date} To: {itinerary.end_date}</P>
					</Card>
				</Li>
			{/each}
		</List>
	{/if}
</div>
