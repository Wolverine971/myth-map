<!-- src/lib/components/locations/LocationCard.svelte -->
<script context="module" lang="ts">
	function categoryLabel(c: 'eats' | 'outdoor' | 'indoor' | 'activity' | 'default') {
		switch (c) {
			case 'eats':
				return 'Eats';
			case 'outdoor':
				return 'Outdoor';
			case 'indoor':
				return 'Indoor';
			case 'activity':
				return 'Activity';
			default:
				return 'Place';
		}
	}
</script>

<script lang="ts">
	import { getLocationIcon } from '../../../utils/locationPhotos';
	import { hrefForId } from '$lib/content/loader';

	export let name: string;
	export let address: string;
	export let website: string;
	export let tags: Array<{ tags: { name: string } }> = [];
	export let coords: { lat: number; lng: number };
	export let contentLocation: any;
	export let innerWidth: number = 0;

	void coords;
	void contentLocation;
	void innerWidth;

	type Category = 'eats' | 'outdoor' | 'indoor' | 'activity' | 'default';

	const EATS_TAGS = new Set(['Eats', 'Treat', 'Food', 'Drink']);
	const OUTDOOR_TAGS = new Set([
		'Outdoor',
		'Park',
		'Playground',
		'Hiking',
		'Water',
		'Beach',
		'Farm',
		'Biking',
		'Swimming'
	]);
	const INDOOR_TAGS = new Set([
		'Indoor',
		'Educational',
		'Interactive',
		'Creativity',
		'Animals',
		'Trains'
	]);
	const ACTIVITY_TAGS = new Set(['Activity', 'Physical Activity', 'Play', 'Wellness']);

	$: tagNames = (tags || []).map((t) => t?.tags?.name).filter(Boolean) as string[];

	$: category = pickCategory(tagNames);

	function pickCategory(names: string[]): Category {
		const set = new Set(names);
		if (intersect(set, EATS_TAGS)) return 'eats';
		if (intersect(set, OUTDOOR_TAGS)) return 'outdoor';
		if (intersect(set, INDOOR_TAGS)) return 'indoor';
		if (intersect(set, ACTIVITY_TAGS)) return 'activity';
		return 'default';
	}

	function intersect<T>(a: Set<T>, b: Set<T>): boolean {
		for (const v of a) if (b.has(v)) return true;
		return false;
	}

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

	const SUPPRESS = new Set(['Activity', 'Eats', 'Indoor', 'Outdoor', 'both']);
	$: chipTags = tagNames.filter((n) => !SUPPRESS.has(n)).slice(0, 3);

	$: iconKey = name ? getLocationIcon(name) : 'mythmap';
</script>

<article class="card card--{category}">
	<a
		href={detailsHref ?? '#'}
		class="card__inner"
		aria-label={`View details for ${name}`}
		on:click={(e) => {
			if (!detailsHref) e.preventDefault();
		}}
	>
		<div class="card__band">
			<div class="card__icon">
				<img src={`/map/${iconKey}.png`} alt="" loading="lazy" decoding="async" />
			</div>
			<span class="card__category">{categoryLabel(category)}</span>
		</div>

		<div class="card__body">
			<h3 class="card__title" title={name}>{name || 'Unknown Location'}</h3>

			{#if cityState}
				<p class="card__location">
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
						<circle cx="12" cy="10" r="3" />
					</svg>
					<span>{cityState}</span>
				</p>
			{/if}

			{#if chipTags.length}
				<ul class="card__chips">
					{#each chipTags as tag}
						<li class="card__chip">{tag}</li>
					{/each}
				</ul>
			{/if}
		</div>
	</a>

	{#if detailsHref || website}
		<div class="card__footer">
			{#if detailsHref}
				<a class="card__cta card__cta--primary" href={detailsHref} aria-label={`View details for ${name}`}>
					<span>Details</span>
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.25"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
					</svg>
				</a>
			{/if}
			{#if website}
				<a
					class="card__cta card__cta--secondary"
					href={website}
					target="_blank"
					rel="noopener noreferrer"
					aria-label={`Open ${name} website in a new tab`}
				>
					<span>Website</span>
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.25"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M7 17 17 7" /><path d="M7 7h10v10" />
					</svg>
				</a>
			{/if}
		</div>
	{/if}
</article>

<style>
	/* Field-manual card — sharp 2px corners, borders do the work, no lift on hover.
	   Category palettes survive as the topo "elevation band" at the top. */
	.card {
		--band-from: theme('colors.primary.50');
		--band-to: theme('colors.primary.100');
		--accent: theme('colors.primary.700');

		position: relative;
		display: flex;
		flex-direction: column;
		height: 100%;
		background: var(--surface-surface);
		border: 1px solid var(--border-subtle);
		border-radius: 2px;
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

	.card__inner {
		flex: 1;
		display: flex;
		flex-direction: column;
		text-decoration: none;
		color: inherit;
	}

	/* Category palettes — light mode topo "elevation zones" */
	.card--outdoor {
		--band-from: theme('colors.primary.50');
		--band-to: theme('colors.primary.200');
		--accent: theme('colors.primary.700');
	}
	.card--indoor {
		--band-from: theme('colors.accent.50');
		--band-to: theme('colors.accent.300');
		--accent: theme('colors.accent.800');
	}
	.card--eats {
		--band-from: theme('colors.tertiary.50');
		--band-to: theme('colors.tertiary.200');
		--accent: theme('colors.tertiary.700');
	}
	.card--activity {
		--band-from: theme('colors.secondary.50');
		--band-to: theme('colors.secondary.200');
		--accent: theme('colors.primary.700');
	}

	/* Dark mode — bands shift to muted versions of the same hues so the topo zones
	   still read but don't blow out against the dusk surface. */
	:global(.dark) .card {
		--band-from: theme('colors.primary.900');
		--band-to: theme('colors.primary.800');
		--accent: theme('colors.primary.300');
	}
	:global(.dark) .card--outdoor {
		--band-from: theme('colors.primary.900');
		--band-to: theme('colors.primary.700');
		--accent: theme('colors.primary.300');
	}
	:global(.dark) .card--indoor {
		--band-from: theme('colors.accent.900');
		--band-to: theme('colors.accent.700');
		--accent: theme('colors.accent.200');
	}
	:global(.dark) .card--eats {
		--band-from: theme('colors.tertiary.900');
		--band-to: theme('colors.tertiary.700');
		--accent: theme('colors.tertiary.200');
	}
	:global(.dark) .card--activity {
		--band-from: theme('colors.secondary.900');
		--band-to: theme('colors.secondary.700');
		--accent: theme('colors.primary.300');
	}

	.card__band {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.625rem 0.75rem;
		background: linear-gradient(135deg, var(--band-from), var(--band-to));
		border-bottom: 1px solid var(--border-subtle);
		min-height: 64px;
	}

	.card__icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card__icon img {
		width: 52px;
		height: 52px;
		object-fit: contain;
		filter: drop-shadow(0 1px 1px rgba(1, 68, 33, 0.18));
	}

	.card__category {
		flex: 1;
		min-width: 0;
		font-family: theme('fontFamily.mono');
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--accent);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: clip;
	}

	.card__body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 0.875rem 0.875rem;
	}

	/* Title uses the display font (Bitter) per the type system */
	.card__title {
		margin: 0;
		font-family: theme('fontFamily.display');
		font-size: 1rem;
		font-weight: 700;
		line-height: 1.25;
		color: var(--text-default);
		letter-spacing: -0.01em;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		word-break: break-word;
	}

	.card__location {
		margin: 0;
		display: inline-flex;
		align-items: center;
		gap: 0.3125rem;
		font-size: 0.75rem;
		color: var(--text-muted);
		line-height: 1.3;
	}

	.card__location svg {
		flex-shrink: 0;
		color: theme('colors.tertiary.500');
	}

	.card__location span {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card__chips {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	/* Stamped tag — sharp 2px corners, mono, uppercase. Field-guide label, not pill. */
	.card__chip {
		font-family: theme('fontFamily.mono');
		font-size: 0.6875rem;
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-default);
		background: var(--surface-sunken);
		border: 1px solid var(--border-subtle);
		padding: 0.125rem 0.4375rem;
		border-radius: 2px;
		line-height: 1.3;
		white-space: nowrap;
	}

	.card__footer {
		display: flex;
		border-top: 1px solid var(--border-subtle);
		background: var(--surface-sunken);
	}

	.card__cta {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.4375rem 0.875rem;
		font-family: theme('fontFamily.mono');
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		text-decoration: none;
		transition:
			background 100ms cubic-bezier(0.22, 1, 0.36, 1),
			color 100ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.card__cta + .card__cta {
		border-left: 1px solid var(--border-subtle);
	}

	.card__cta--primary {
		color: var(--accent);
	}

	.card__cta--primary:hover {
		background: var(--surface-elevated);
		color: theme('colors.primary.800');
		box-shadow: inset 0 1px 0 var(--border-subtle);
	}

	:global(.dark) .card__cta--primary:hover {
		color: theme('colors.primary.200');
	}

	.card__cta--secondary {
		color: var(--text-muted);
	}

	.card__cta--secondary:hover {
		background: var(--surface-elevated);
		color: theme('colors.tertiary.700');
		box-shadow: inset 0 1px 0 var(--border-subtle);
	}

	:global(.dark) .card__cta--secondary:hover {
		color: theme('colors.tertiary.300');
	}

	.card__cta svg {
		flex-shrink: 0;
	}
</style>
