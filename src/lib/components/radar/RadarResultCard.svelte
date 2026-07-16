<!-- src/lib/components/radar/RadarResultCard.svelte -->
<script lang="ts">
	import { ArrowUpRight, MapPin } from '@lucide/svelte';
	import type { RadarEntity } from '$lib/types/radar';

	type Props = {
		entity: RadarEntity;
		focused?: boolean;
		onentityfocus?: (detail: { id: string | null }) => void;
		onentityselect?: (detail: { id: string }) => void;
	};

	let { entity, focused = false, onentityfocus, onentityselect }: Props = $props();

	let external = $derived(!!entity.url && /^https?:\/\//.test(entity.url));
	let driveLabel = $derived(
		entity.driveMinutes
			? `${entity.driveMinutes} min ring`
			: entity.distanceMiles != null
				? `${entity.distanceMiles.toFixed(1)} mi away`
				: 'nearby'
	);
	let layerLabel = $derived(labelForLayer(entity.layer));
	let sourceLabel = $derived(labelForSource(entity.source));
	let reasonText = $derived(entity.reasons.slice(0, 2).join(' / '));

	function labelForLayer(layer: string): string {
		return layer.replace(/_/g, ' ');
	}

	function labelForSource(source: string): string {
		switch (source) {
			case 'tta':
				return 'Tiny Tribe';
			case 'osm':
				return 'OSM';
			case 'wikipedia':
				return 'Wikipedia';
			case 'wikidata':
				return 'Wikidata';
			case 'ticketmaster':
				return 'Ticketmaster';
			case 'opensky':
				return 'OpenSky';
			default:
				return source;
		}
	}

	function focus(id: string | null) {
		onentityfocus?.({ id });
	}
</script>

<article
	class={['radar-card', focused && 'focused']}
	onmouseenter={() => focus(entity.id)}
	onmouseleave={() => focus(null)}
	onfocusin={() => focus(entity.id)}
	onfocusout={() => focus(null)}
>
	<svelte:element
		this={entity.url ? 'a' : 'button'}
		href={entity.url || undefined}
		target={external ? '_blank' : undefined}
		rel={external ? 'noopener noreferrer' : undefined}
		type={!entity.url ? 'button' : undefined}
		role={entity.url ? undefined : 'button'}
		class="radar-card__body"
		onclick={() => onentityselect?.({ id: entity.id })}
	>
		<div class="radar-card__meta">
			<span>{sourceLabel}</span>
			<span aria-hidden="true">/</span>
			<span>{layerLabel}</span>
			<span aria-hidden="true">/</span>
			<span>{driveLabel}</span>
		</div>
		<h3>{entity.name}</h3>
		{#if entity.address || entity.city}
			<p class="radar-card__place">
				<MapPin size={13} />
				<span>{entity.address || [entity.city, entity.state].filter(Boolean).join(', ')}</span>
			</p>
		{/if}
		{#if reasonText}
			<p class="radar-card__reason">{reasonText}</p>
		{/if}
		<div class="radar-card__footer">
			<span>Score {entity.score}</span>
			{#if entity.url}
				<span class="radar-card__link">
					Details <ArrowUpRight size={13} />
				</span>
			{/if}
		</div>
	</svelte:element>
</article>

<style>
	.radar-card {
		border: 1px solid var(--border-subtle);
		border-radius: 4px;
		background: var(--surface-surface);
		transition:
			border-color 120ms cubic-bezier(0.22, 1, 0.36, 1),
			box-shadow 120ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.radar-card:hover,
	.radar-card:focus-within,
	.radar-card.focused {
		border-color: theme('colors.tertiary.500');
		box-shadow: 0 0 0 1px theme('colors.tertiary.500');
	}

	.radar-card__body {
		display: block;
		width: 100%;
		height: 100%;
		padding: 0.75rem;
		text-align: left;
		text-decoration: none;
		color: inherit;
		background: transparent;
	}

	button.radar-card__body {
		border: 0;
		cursor: pointer;
	}

	.radar-card__meta,
	.radar-card__footer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.3125rem;
		font-family: theme('fontFamily.mono');
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	h3 {
		margin: 0.25rem 0 0;
		font-family: theme('fontFamily.display');
		font-size: 1rem;
		font-weight: 800;
		line-height: 1.2;
		color: var(--text-default);
		word-break: break-word;
	}

	.radar-card__place,
	.radar-card__reason {
		margin: 0.5rem 0 0;
		color: var(--text-muted);
		font-size: 0.8125rem;
		line-height: 1.35;
	}

	.radar-card__place {
		display: flex;
		align-items: flex-start;
		gap: 0.3125rem;
	}

	.radar-card__reason {
		color: var(--text-default);
	}

	.radar-card__footer {
		justify-content: space-between;
		margin-top: 0.75rem;
	}

	.radar-card__link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		color: theme('colors.primary.700');
	}

	:global(.dark) .radar-card__link {
		color: theme('colors.primary.300');
	}
</style>
