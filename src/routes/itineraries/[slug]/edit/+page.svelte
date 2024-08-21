<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { Card, Button, Label, Input, Heading, P } from 'flowbite-svelte';
	// import { Trash } from 'svelte-heros-v2';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';

	export let data: PageData;

	let name = data.itinerary.name;
	let startDate = data.itinerary.start_date;
	let endDate = data.itinerary.end_date;
	let items = data.itinerary.items.sort((a, b) => a.order_index - b.order_index);

	async function saveChanges() {
		try {
			const response = await fetch(`/itineraries/${data.itinerary.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name,
					startDate,
					endDate,
					items
				})
			});

			if (!response.ok) {
				throw new Error('Failed to update itinerary');
			}

			goto(`/itineraries/${data.itinerary.id}`);
		} catch (error) {
			console.error('Failed to save changes:', error);
			// Handle error (e.g., show error message to user)
		}
	}

	function removeLocation(id: string) {
		items = items.filter((item) => item.id !== id);
	}

	function handleDndConsider(e: CustomEvent<{ items: typeof items }>) {
		items = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<{ items: typeof items }>) {
		items = e.detail.items;
	}
</script>

<Card class="mb-4">
	<form on:submit|preventDefault={saveChanges}>
		<Heading tag="h1" class="mb-4">Edit Itinerary</Heading>

		<Label for="name" class="mb-2">Itinerary Name</Label>
		<Input id="name" bind:value={name} required class="mb-4" />

		<div class="mb-4 grid grid-cols-2 gap-4">
			<div>
				<Label for="startDate" class="mb-2">Start Date</Label>
				<Input id="startDate" type="date" bind:value={startDate} required />
			</div>
			<div>
				<Label for="endDate" class="mb-2">End Date</Label>
				<Input id="endDate" type="date" bind:value={endDate} required />
			</div>
		</div>

		<Heading tag="h2" class="mb-2">Locations</Heading>
		{#if items.length === 0}
			<P>No locations added to this itinerary yet.</P>
		{:else}
			<section
				use:dndzone={{ items }}
				on:consider={handleDndConsider}
				on:finalize={handleDndFinalize}
			>
				{#each items as item (item.id)}
					<div animate:flip={{ duration: 200 }}>
						<Card class="mb-2">
							<div class="flex items-center justify-between">
								<span>{item.location.name}</span>
								<Button color="red" on:click={() => removeLocation(item.id)}>
									<!-- <Trash /> -->
									Trash
								</Button>
							</div>
						</Card>
					</div>
				{/each}
			</section>
		{/if}

		<div class="mt-4 flex justify-end space-x-2">
			<Button color="alternative" href="/itineraries/{data.itinerary.id}">Cancel</Button>
			<Button type="submit">Save Changes</Button>
		</div>
	</form>
</Card>
