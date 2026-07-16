<!-- src/lib/components/shared/BModal.svelte -->
<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	export let title = '';

	const dispatch = createEventDispatcher();

	function closeModal() {
		dispatch('close');
	}

	// Close on escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<!-- Backdrop -->
	<button
		type="button"
		class="fixed inset-0 z-40 bg-black bg-opacity-50"
		aria-label="Close modal"
		on:click={closeModal}
		transition:fade={{ duration: 200 }}
	></button>

	<!-- Modal -->
	<div
		class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="pointer-events-auto flex max-h-[90vh] w-full max-w-6xl flex-col rounded-lg bg-white shadow-xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b p-4">
				<h2 id="modal-title" class="text-xl font-semibold">{title}</h2>
				<button
					class="rounded-full p-2 hover:bg-gray-100"
					on:click={closeModal}
					aria-label="Close modal"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-auto p-6">
				<slot />
			</div>
		</div>
	</div>
{/if}
