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

<!-- src/lib/components/locations/LocationCard.svelte -->
<script lang="ts">
	import { getLocationIcon } from '../../../utils/locationPhotos';

	export let name: string;
	export let address: string;
	export let website: string;
	export let tags: Array<{ tags: { name: string } }> = [];
	export let coords: { lat: number; lng: number };
	export let contentLocation: any;
	export let innerWidth: number = 0;

	// Public exports surfaced for parent flexibility — currently unread inside the card.
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

	// City + state line: address looks like "Street, City, ST Zip"
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
		const state = contentLocation?.location?.state;
		const city = contentLocation?.location?.city;
		if (!state || !city || !name) return null;
		const slug = (s: string) => s.replace(/\s+/g, '-');
		return `/locations/states/${state}/${slug(city)}/${slug(name)}`;
	})();

	// Compact tag chips: drop noise tags that don't add scanning value.
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

	{#if website}
		<a class="card__website" href={website} target="_blank" rel="noopener noreferrer">
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
</article>

<style>
	.card {
		--band-from: #e6f0ea; /* primary-50 */
		--band-to: #c2dac9; /* primary-100 */
		--accent: #014421; /* primary-500 */
		--accent-soft: #f7f0e6; /* secondary-100 */

		position: relative;
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #ffffff;
		border: 1px solid #eee0cc; /* secondary-200 */
		border-radius: 14px;
		overflow: hidden;
		transition:
			transform 0.18s ease,
			box-shadow 0.18s ease,
			border-color 0.18s ease;
		box-shadow: 0 1px 2px rgba(1, 68, 33, 0.04);
	}

	.card:hover,
	.card:focus-within {
		transform: translateY(-2px);
		border-color: var(--accent);
		box-shadow:
			0 14px 24px -12px rgba(1, 68, 33, 0.22),
			0 4px 8px -4px rgba(1, 68, 33, 0.08);
	}

	.card__inner {
		flex: 1;
		display: flex;
		flex-direction: column;
		text-decoration: none;
		color: inherit;
	}

	.card__inner:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}

	/* Category palettes */
	.card--outdoor {
		--band-from: #e6f0ea;
		--band-to: #9bc2a7;
		--accent: #014421;
	}
	.card--indoor {
		--band-from: #f1f9fd; /* accent-50 */
		--band-to: #abdaf1; /* accent-300 */
		--accent: #5e8fa3; /* accent-800 */
	}
	.card--eats {
		--band-from: #fbefe6; /* tertiary-50 */
		--band-to: #f5d8c2; /* tertiary-100 */
		--accent: #a44600; /* tertiary-700 */
	}
	.card--activity {
		--band-from: #fcf9f5; /* secondary-50 */
		--band-to: #eee0cc; /* secondary-200 */
		--accent: #014421;
	}

	.card__band {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.625rem 0.75rem;
		background: linear-gradient(135deg, var(--band-from), var(--band-to));
		border-bottom: 1px solid rgba(1, 68, 33, 0.06);
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
		font-size: 0.625rem;
		font-weight: 700;
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

	.card__title {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 700;
		line-height: 1.3;
		color: #014421;
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
		color: #5a6673; /* neutral-700 */
		line-height: 1.3;
	}

	.card__location svg {
		flex-shrink: 0;
		color: #708090;
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

	.card__chip {
		font-size: 0.6875rem;
		font-weight: 500;
		color: #4e5964; /* neutral-800 */
		background: #f7f0e6; /* secondary-100 */
		padding: 0.1875rem 0.5rem;
		border-radius: 999px;
		line-height: 1.3;
		white-space: nowrap;
	}

	.card__website {
		display: inline-flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.25rem;
		padding: 0.4375rem 0.875rem;
		border-top: 1px solid #f7f0e6; /* secondary-100 */
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--accent);
		text-decoration: none;
		background: #fcf9f5; /* secondary-50 */
		transition:
			background 0.15s ease,
			color 0.15s ease;
	}

	.card__website:hover {
		background: #f7f0e6;
		color: #013d1e;
	}

	.card__website:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}

	.card__website svg {
		flex-shrink: 0;
	}
</style>
