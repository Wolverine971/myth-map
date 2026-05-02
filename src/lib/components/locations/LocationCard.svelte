<!-- src/lib/components/locations/LocationCard.svelte -->
<script lang="ts">
	import { getLocationIcon } from '../../../utils/locationPhotos';
	import { hrefForId } from '$lib/content/loader';
	import { locationFocus, type LocationFocusKey } from '$lib/stores/locationFocusStore';

	export let name: string;
	export let address: string;
	export let website: string;
	export let tags: Array<{ tags: { name: string } }> = [];
	export let coords: { lat: number; lng: number };
	export let contentLocation: any;

	$: focusKey = (() => {
		const id = contentLocation?.location?.id ?? contentLocation?.id;
		if (id != null) return id as LocationFocusKey;
		return name as LocationFocusKey;
	})();

	$: isHovered = $locationFocus.hovered === focusKey;
	$: isSelected = $locationFocus.selected === focusKey;
	$: isFocused = isHovered || isSelected;

	function handleEnter() {
		locationFocus.hover(focusKey);
	}
	function handleLeave() {
		if ($locationFocus.hovered === focusKey) locationFocus.hover(null);
	}

	$: tagNames = (tags || []).map((t) => t?.tags?.name).filter(Boolean) as string[];

	$: cityState = (() => {
		if (!address) return '';
		const parts = address
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
		if (parts.length < 2) return '';
		return parts.slice(1, 3).join(', ');
	})();

	$: detailsHref = (() => {
		const id = contentLocation?.location?.id ?? contentLocation?.id;
		if (typeof id !== 'number') return null;
		return hrefForId(id);
	})();

	$: cardHref = detailsHref ?? (website || null);
	$: external = !detailsHref && !!website;
	$: ctaLabel = detailsHref ? 'Read guide' : website ? 'Visit site' : null;

	const SUPPRESS = new Set(['Activity', 'Eats', 'Indoor', 'Outdoor', 'both']);
	$: chipTags = tagNames.filter((n) => !SUPPRESS.has(n)).slice(0, 3);

	$: iconKey = name ? getLocationIcon(name) : 'mythmap';

	$: coordLabel = (() => {
		const lat = coords?.lat;
		const lng = coords?.lng;
		if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return null;
		const ns = lat >= 0 ? 'N' : 'S';
		const ew = lng >= 0 ? 'E' : 'W';
		return `${Math.abs(lat).toFixed(3)}°${ns} · ${Math.abs(lng).toFixed(3)}°${ew}`;
	})();
</script>

<article
	class="card"
	class:is-focused={isFocused}
	class:is-selected={isSelected}
	data-location-id={focusKey}
	on:mouseenter={handleEnter}
	on:mouseleave={handleLeave}
	on:focusin={handleEnter}
	on:focusout={handleLeave}
>
	<svelte:element
		this={cardHref ? 'a' : 'div'}
		href={cardHref ?? undefined}
		target={external ? '_blank' : undefined}
		rel={external ? 'noopener noreferrer' : undefined}
		class="card__link"
	>
		<img class="card__icon" src={`/map/${iconKey}.png`} alt="" loading="lazy" decoding="async" />
		<div class="card__body">
			<h3 class="card__title" title={name}>{name || 'Unknown Location'}</h3>
			{#if cityState}
				<p class="card__address">{cityState}</p>
			{/if}
			{#if coordLabel || ctaLabel}
				<div class="card__meta">
					{#if coordLabel}
						<span class="card__coords">{coordLabel}</span>
					{/if}
					{#if coordLabel && ctaLabel}
						<span aria-hidden="true" class="card__sep">·</span>
					{/if}
					{#if ctaLabel}
						<span class="card__cta">{ctaLabel} →</span>
					{/if}
				</div>
			{/if}
			{#if chipTags.length}
				<ul class="card__chips">
					{#each chipTags as tag}
						<li class="stamped-tag card__chip">{tag}</li>
					{/each}
				</ul>
			{/if}
		</div>
	</svelte:element>
</article>

<style>
	/* Field-directory card — quiet by default, borders do the work.
	   Matches the /locations page entry style: icon on the left, content on
	   the right, no colored bands. */
	.card {
		position: relative;
		display: block;
		height: 100%;
		background: var(--surface-surface);
		border: 1px solid var(--border-subtle);
		border-radius: 4px;
		overflow: hidden;
		transition:
			border-color 100ms cubic-bezier(0.22, 1, 0.36, 1),
			box-shadow 100ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.card:hover,
	.card:focus-within {
		border-color: var(--border-strong);
		box-shadow: 0 4px 12px rgba(1, 68, 33, 0.08);
	}

	:global(.dark) .card:hover,
	:global(.dark) .card:focus-within {
		background: var(--surface-elevated);
	}

	/* Survival-orange focus ring — driven by cross-highlight store. */
	.card.is-focused {
		border-color: theme('colors.tertiary.500');
		box-shadow:
			0 0 0 1px theme('colors.tertiary.500'),
			0 4px 12px rgba(205, 87, 0, 0.18);
	}

	.card.is-selected {
		animation: card-flash 900ms ease-out 1;
	}

	@keyframes card-flash {
		0% {
			box-shadow:
				0 0 0 0 rgba(205, 87, 0, 0.55),
				0 0 0 1px theme('colors.tertiary.500');
		}
		100% {
			box-shadow:
				0 0 0 8px rgba(205, 87, 0, 0),
				0 0 0 1px theme('colors.tertiary.500');
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.card.is-selected {
			animation: none;
		}
	}

	.card__link {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		height: 100%;
		padding: 0.75rem;
		text-decoration: none;
		color: inherit;
	}

	.card__icon {
		width: 3.25rem;
		height: 3.25rem;
		flex-shrink: 0;
		object-fit: contain;
	}

	.card__body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.card__title {
		margin: 0;
		font-family: theme('fontFamily.display');
		font-size: 1rem;
		font-weight: 700;
		line-height: 1.2;
		letter-spacing: -0.01em;
		color: var(--text-default);
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		word-break: break-word;
		transition: color 100ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.card:hover .card__title,
	.card:focus-within .card__title {
		color: theme('colors.primary.700');
	}

	:global(.dark) .card:hover .card__title,
	:global(.dark) .card:focus-within .card__title {
		color: theme('colors.primary.300');
	}

	.card__address {
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.35;
		color: var(--text-muted);
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card__meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.5rem;
		font-family: theme('fontFamily.mono');
		font-size: 0.6875rem;
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		line-height: 1.3;
	}

	.card__coords {
		color: var(--text-subtle);
		white-space: nowrap;
	}

	.card__sep {
		color: var(--text-subtle);
	}

	.card__cta {
		color: theme('colors.tertiary.600');
		white-space: nowrap;
		transition: color 100ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	:global(.dark) .card__cta {
		color: theme('colors.tertiary.400');
	}

	.card:hover .card__cta,
	.card:focus-within .card__cta {
		color: theme('colors.tertiary.700');
	}

	:global(.dark) .card:hover .card__cta,
	:global(.dark) .card:focus-within .card__cta {
		color: theme('colors.tertiary.300');
	}

	.card__chips {
		list-style: none;
		margin: 0.125rem 0 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.card__chip {
		/* `.stamped-tag` global utility provides the styling — this rule just
		   tightens the size for inside-card density. */
		padding: 0.0625rem 0.375rem;
		font-size: 0.625rem;
	}
</style>
