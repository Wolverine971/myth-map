<script lang="ts">
	import { Button, Card, Heading, Li, List, P } from 'flowbite-svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<Heading tag="h1" class="mb-4">Your Itineraries</Heading>

{#if data.itineraries.length === 0}
	<P>You haven't created any itineraries yet.</P>
{:else}
	<List class="space-y-4" list="none">
		{#each data.itineraries as itinerary (itinerary.id)}
			<Li>
				<Card>
					<Heading tag="h2" class="mb-2" style="overflow-wrap: anywhere">
						<a href="/itineraries/{itinerary.id}" class="hover:underline">{itinerary.name}</a>
					</Heading>
					<P>From: {itinerary.start_date} To: {itinerary.end_date}</P>
				</Card>
			</Li>
		{/each}
	</List>
{/if}
