<script lang="ts">
	import { currentItinerary } from '$lib/stores/itineraryStore';
	import type { Location, Itinerary } from '$lib/types/itinerary';
	import { flip } from 'svelte/animate';
	import { dndzone } from 'svelte-dnd-action';

	export let isOpen = false;

	let items: Location[] = [];
	let itineraryName = '';
	let editingName = false;

	currentItinerary.subscribe((value) => {
		if (value) {
			items =
				value.items?.map((item) => item.location).sort((a, b) => a.order_index - b.order_index) ||
				[];
			itineraryName = value.name;
		}
	});

	function handleDndConsider(e: CustomEvent<{ items: Location[] }>) {
		items = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<{ items: Location[] }>) {
		items = e.detail.items;
		currentItinerary.updateOrder(items);
	}

	function removeLocation(id: string) {
		currentItinerary.removeLocation(id);
	}

	function startEditingName() {
		editingName = true;
	}

	function saveName() {
		currentItinerary.updateName(itineraryName);
		editingName = false;
	}
</script>

{#if isOpen}
	<div class="modal-overlay">
		<div class="modal">
			<div class="modal-header">
				{#if editingName}
					<input
						bind:value={itineraryName}
						on:blur={saveName}
						on:keydown={(e) => e.key === 'Enter' && saveName()}
						autofocus
					/>
				{:else}
					<h2 on:click={startEditingName}>{itineraryName}</h2>
				{/if}
				<button class="close-button" on:click={() => (isOpen = false)}>&times;</button>
			</div>
			<div class="modal-content">
				{#if items.length === 0}
					<p>Your itinerary is empty!</p>
				{:else}
					<section
						use:dndzone={{ items }}
						on:consider={handleDndConsider}
						on:finalize={handleDndFinalize}
					>
						{#each items as item (item.id)}
							<div animate:flip={{ duration: 200 }} class="itinerary-item">
								<span class="item-name">{item.name}</span>
								<button class="remove-button" on:click={() => removeLocation(item.id)}
									>Remove</button
								>
							</div>
						{/each}
					</section>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/* ... (existing styles) ... */

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
		cursor: pointer;
	}

	.modal-header input {
		font-size: 1.5rem;
		width: 100%;
		border: none;
		border-bottom: 1px solid #ccc;
		outline: none;
		padding: 5px 0;
	}
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal {
		background-color: white;
		border-radius: 8px;
		width: 90%;
		max-width: 500px;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #e0e0e0;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #666;
	}

	.modal-content {
		padding: 1rem;
		overflow-y: auto;
	}

	.itinerary-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		margin-bottom: 0.5rem;
		background-color: #f0f0f0;
		border-radius: 4px;
		cursor: move;
	}

	.item-name {
		font-weight: bold;
	}

	.remove-button {
		background-color: #ff4136;
		color: white;
		border: none;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.remove-button:hover {
		background-color: #dc352d;
	}
</style>
