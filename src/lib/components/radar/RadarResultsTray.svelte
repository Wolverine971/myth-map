<!-- src/lib/components/radar/RadarResultsTray.svelte -->
<script lang="ts">
	import { X } from '@lucide/svelte';
	import type { RadarState } from '$lib/stores/radarStore';
	import type { RadarLayer } from '$lib/types/radar';
	import RadarLayerToggles from './RadarLayerToggles.svelte';
	import RadarResultCard from './RadarResultCard.svelte';

	type Props = {
		state: RadarState;
		focusedId?: string | null;
		onclear?: () => void;
		onentityfocus?: (detail: { id: string | null }) => void;
		onentityselect?: (detail: { id: string }) => void;
		onlayerchange?: (layers: RadarLayer[]) => void;
	};

	let {
		state,
		focusedId = null,
		onclear,
		onentityfocus,
		onentityselect,
		onlayerchange
	}: Props = $props();

	let entities = $derived(state.result?.entities ?? []);
	let isVisible = $derived(state.status !== 'idle');
	let sourceNotes = $derived(
		state.result?.sourceStatus.filter((source) => source.status === 'skipped' && source.message) ??
			[]
	);
	let statusMessage = $derived(
		state.status === 'loading'
			? 'Scanning the map area for family-friendly places.'
			: state.status === 'error'
				? `Radar scan failed. ${state.error ?? ''}`.trim()
				: entities.length
					? `${entities.length} ranked ${entities.length === 1 ? 'pick' : 'picks'} found${state.result?.partial ? ' in a partial scan' : ''}.`
					: state.status === 'success'
						? 'No family-friendly radar picks found for this scan.'
						: ''
	);
</script>

{#if isVisible}
	<section class="tray">
		<p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
			{statusMessage}
		</p>
		<div class="tray__header">
			<div>
				<div class="data-label">Adventure Radar</div>
				<h2>Right now near you</h2>
			</div>
			<button type="button" class="tray__clear" aria-label="Clear radar scan" onclick={onclear}>
				<X size={16} />
			</button>
		</div>

		<div class="tray__toggles">
			<RadarLayerToggles
				selected={state.layers}
				disabled={state.status === 'loading'}
				onchange={onlayerchange}
			/>
		</div>

		{#if sourceNotes.length}
			<div class="tray__sources">
				{#each sourceNotes as source (source.source)}
					<span>{source.source}: {source.message}</span>
				{/each}
			</div>
		{/if}

		{#if state.status === 'loading'}
			<div class="tray__loading">
				<div></div>
				<div></div>
				<div></div>
			</div>
		{:else if state.status === 'error'}
			<div class="tray__empty">
				<p>{state.error}</p>
			</div>
		{:else if entities.length}
			<div class="tray__summary">
				<span>{entities.length} ranked picks</span>
				{#if state.result?.partial}
					<span>Partial scan</span>
				{/if}
			</div>
			<div class="tray__grid">
				{#each entities as entity (entity.id)}
					<RadarResultCard
						{entity}
						focused={focusedId === entity.id}
						{onentityfocus}
						{onentityselect}
					/>
				{/each}
			</div>
		{:else}
			<div class="tray__empty">
				<p>No family-friendly radar picks came back for this scan. Try another spot nearby.</p>
			</div>
		{/if}
	</section>
{/if}

<style>
	.tray {
		border: 1px solid var(--border-subtle);
		border-radius: 4px;
		background: var(--surface-surface);
		box-shadow: 0 14px 34px rgba(1, 68, 33, 0.12);
		padding: 0.875rem;
	}

	.tray__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	h2 {
		margin: 0.125rem 0 0;
		font-family: theme('fontFamily.display');
		font-size: 1.25rem;
		font-weight: 800;
		line-height: 1.15;
		color: var(--text-default);
	}

	.tray__clear {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border: 1px solid var(--border-subtle);
		border-radius: 4px;
		background: var(--surface-sunken);
		color: var(--text-muted);
	}

	.tray__clear:hover {
		color: var(--text-default);
		border-color: var(--border-strong);
	}

	.tray__summary {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		font-family: theme('fontFamily.mono');
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.tray__toggles {
		margin-bottom: 0.75rem;
	}

	.tray__sources {
		display: grid;
		gap: 0.25rem;
		margin-bottom: 0.75rem;
		border-left: 3px solid theme('colors.tertiary.500');
		padding: 0.375rem 0 0.375rem 0.625rem;
		color: var(--text-muted);
		font-size: 0.75rem;
		line-height: 1.35;
	}

	.tray__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.625rem;
		max-height: min(50vh, 28rem);
		overflow: auto;
		padding-right: 0.25rem;
	}

	.tray__loading {
		display: grid;
		gap: 0.625rem;
	}

	.tray__loading div {
		height: 5.75rem;
		border-radius: 4px;
		background: linear-gradient(
			90deg,
			var(--surface-sunken),
			var(--surface-surface),
			var(--surface-sunken)
		);
		background-size: 200% 100%;
		animation: shimmer 1.2s linear infinite;
	}

	.tray__empty {
		border: 1px dashed var(--border-strong);
		background: var(--surface-sunken);
		padding: 1rem;
		color: var(--text-default);
	}

	.tray__empty p {
		margin: 0;
	}

	@keyframes shimmer {
		to {
			background-position: -200% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tray__loading div {
			animation: none;
		}
	}
</style>
