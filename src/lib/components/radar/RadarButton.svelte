<!-- src/lib/components/radar/RadarButton.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { LoaderCircle, Radar } from 'lucide-svelte';
	import type { RadarStatus } from '$lib/stores/radarStore';

	export let status: RadarStatus = 'idle';
	export let hasLocation = false;

	const dispatch = createEventDispatcher<{ scan: void }>();

	$: isLoading = status === 'loading';
	$: label = isLoading ? 'Scanning...' : hasLocation ? "What's around us?" : 'Scan map area';
</script>

<button
	type="button"
	class="radar-button"
	class:is-loading={isLoading}
	aria-busy={isLoading}
	on:click={() => dispatch('scan')}
	disabled={isLoading}
	title={hasLocation ? "Scan what's nearby" : 'Scan the current map area'}
>
	<span class="radar-button__icon" aria-hidden="true">
		{#if isLoading}
			<LoaderCircle size={18} />
		{:else}
			<Radar size={18} />
		{/if}
	</span>
	<span>{label}</span>
</button>

<style>
	.radar-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 2.75rem;
		max-width: 100%;
		border: 1px solid rgba(1, 68, 33, 0.22);
		border-radius: 999px;
		background: #014421;
		color: #fff;
		box-shadow: 0 8px 24px rgba(1, 68, 33, 0.22);
		padding: 0.6875rem 1rem;
		font-family: theme('fontFamily.mono');
		font-size: 0.75rem;
		font-weight: 700;
		line-height: 1;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		transition:
			transform 120ms cubic-bezier(0.22, 1, 0.36, 1),
			background-color 120ms cubic-bezier(0.22, 1, 0.36, 1),
			box-shadow 120ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.radar-button:hover:not(:disabled) {
		background: #01361a;
		box-shadow: 0 10px 28px rgba(1, 68, 33, 0.28);
		transform: translateY(-1px);
	}

	.radar-button:disabled {
		cursor: wait;
		opacity: 0.92;
	}

	.radar-button__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
	}

	.is-loading .radar-button__icon {
		animation: radar-spin 900ms linear infinite;
	}

	@keyframes radar-spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.radar-button,
		.is-loading .radar-button__icon {
			animation: none;
			transition: none;
		}
	}
</style>
