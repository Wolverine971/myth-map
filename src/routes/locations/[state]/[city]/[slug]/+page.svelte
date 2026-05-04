<!-- src/routes/locations/[state]/[city]/[slug]/+page.svelte -->
<script lang="ts">
	import SEOHead from '$lib/components/shared/SEOHead.svelte';
	import Breadcrumbs from '$lib/components/shared/Breadcrumbs.svelte';
	import { getLocationIcon } from '../../../../../utils/locationPhotos';
	import type { PageData } from './$types';

	export let data: PageData;
	$: entry = data.entry;
	$: nearby = data.nearby;
	$: paired = data.paired;
	$: loc = entry.location.location;
	$: fm = entry.frontmatter;
	$: iconSlug = getLocationIcon(loc.name || '');
	$: iconSrc = iconSlug ? `/map/${iconSlug}.png` : '';

	$: canonical = `/locations/${entry.stateSlug}/${entry.citySlug}/${entry.slug}`;
	$: cityHref = `/locations/${entry.stateSlug}/${entry.citySlug}`;
	$: stateHref = `/locations/${entry.stateSlug}`;
	$: breadcrumbItems = [
		{ label: 'Locations', href: '/locations' },
		{ label: fm.state, href: stateHref },
		{ label: fm.city, href: cityHref },
		{ label: loc.name, current: true }
	];
	$: addressLine = [loc.address_line_1, loc.address_line_2].filter(Boolean).join(', ');
	$: fullAddressOneLine = [
		addressLine,
		[loc.city, loc.state].filter(Boolean).join(', '),
		loc.zip_code
	]
		.filter(Boolean)
		.join(' ');

	$: structuredData = {
		'@context': 'https://schema.org',
		'@type': 'TouristAttraction',
		name: loc.name,
		url: `https://tinytribeadventures.com${canonical}`,
		address: {
			'@type': 'PostalAddress',
			streetAddress: addressLine || undefined,
			addressLocality: loc.city,
			addressRegion: loc.state,
			postalCode: loc.zip_code
		},
		geo:
			typeof loc.lat === 'number' && typeof loc.lng === 'number'
				? {
						'@type': 'GeoCoordinates',
						latitude: loc.lat,
						longitude: loc.lng
					}
				: undefined,
		sameAs: entry.location.website ? [entry.location.website] : undefined
	};

	$: faqStructuredData =
		fm.published && entry.faqs.length > 0
			? {
					'@context': 'https://schema.org',
					'@type': 'FAQPage',
					mainEntity: entry.faqs.map((f) => ({
						'@type': 'Question',
						name: f.question,
						acceptedAnswer: { '@type': 'Answer', text: f.answer }
					}))
				}
			: null;

	$: description = fm.published
		? `${loc.name} in ${loc.city}, ${loc.state}. Family-friendly tips, hours, parking, and what to know before you go.`
		: `${loc.name} in ${loc.city}, ${loc.state}. Address, website, and family-friendly details.`;

	const ACCESS_LABEL: Record<string, string> = { yes: 'Yes', partial: 'Partial', no: 'No' };
	const SEASON_LABEL: Record<string, string> = {
		spring: 'Spring',
		summer: 'Summer',
		fall: 'Fall',
		winter: 'Winter'
	};
	const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

	function formatVerifiedDate(value?: string | null): string | null {
		if (!value) return null;
		const d = new Date(`${value}T12:00:00Z`);
		if (Number.isNaN(d.getTime())) return null;
		return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	}

	$: quickFactRows = [
		fm.stroller_friendly && { label: 'Stroller', value: ACCESS_LABEL[fm.stroller_friendly] },
		fm.wheelchair_accessible && {
			label: 'Wheelchair',
			value: ACCESS_LABEL[fm.wheelchair_accessible]
		},
		typeof fm.nursing_room === 'boolean' && {
			label: 'Nursing room',
			value: fm.nursing_room ? 'Yes' : 'No'
		},
		typeof fm.changing_table === 'boolean' && {
			label: 'Changing table',
			value: fm.changing_table ? 'Yes' : 'No'
		},
		fm.noise_level && { label: 'Noise', value: cap(fm.noise_level) },
		fm.sensory_load && { label: 'Sensory load', value: cap(fm.sensory_load) }
	].filter(Boolean) as Array<{ label: string; value: string }>;

	$: weatherBadges = [
		fm.season_best?.length && {
			tone: 'neutral' as const,
			text: `Best in ${fm.season_best.map((s) => SEASON_LABEL[s] ?? cap(s)).join(' · ')}`
		},
		typeof fm.rainy_day_ok === 'boolean' && {
			tone: fm.rainy_day_ok ? ('good' as const) : ('warn' as const),
			text: fm.rainy_day_ok ? 'Rainy-day OK' : 'Skip in rain'
		},
		typeof fm.hot_day_ok === 'boolean' && {
			tone: fm.hot_day_ok ? ('good' as const) : ('warn' as const),
			text: fm.hot_day_ok ? 'Hot-day OK' : 'Skip in heat'
		},
		typeof fm.cold_day_ok === 'boolean' && {
			tone: fm.cold_day_ok ? ('good' as const) : ('warn' as const),
			text: fm.cold_day_ok ? 'Cold-day OK' : 'Skip when freezing'
		}
	].filter(Boolean) as Array<{ tone: 'good' | 'warn' | 'neutral'; text: string }>;

	$: hasQuickFacts = quickFactRows.length > 0 || weatherBadges.length > 0;
	$: verifiedLabel = formatVerifiedDate(fm.verified_at);
</script>

<SEOHead
	title={loc.name}
	{description}
	{canonical}
	type={fm.published ? 'article' : 'website'}
	publishedTime={fm.published_at ?? ''}
	modifiedTime={fm.last_modified}
	{structuredData}
	noIndex={!fm.published}
/>

<svelte:head>
	{#if faqStructuredData}
		{@html `<script type="application/ld+json">${JSON.stringify(faqStructuredData)}</script>`}
	{/if}
</svelte:head>

<div class="container mx-auto max-w-3xl px-4 py-8">
	<div class="mb-4">
		<Breadcrumbs items={breadcrumbItems} />
	</div>

	<header class="mb-6 flex items-start gap-4">
		{#if iconSrc}
			<img
				class="mt-1 h-16 w-16 flex-shrink-0 object-contain md:h-20 md:w-20"
				src={iconSrc}
				alt=""
				loading="lazy"
			/>
		{/if}
		<div class="min-w-0 flex-1">
			<h1
				class="mb-2 text-3xl font-extrabold tracking-tight text-primary-700 dark:text-primary-300 md:text-4xl"
			>
				{loc.name}
			</h1>
			<p class="text-muted">{fullAddressOneLine}</p>
			<div class="mt-3 flex flex-wrap gap-2">
				{#if loc.type}
					<span
						class="rounded-sm border border-primary-200 bg-primary-50 px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-primary-700 dark:border-primary-700 dark:bg-primary-900 dark:text-primary-300"
					>
						{loc.type}
					</span>
				{/if}
				{#if loc.indoor_outdoor}
					<span
						class="rounded-sm border border-secondary-300 bg-secondary-100 px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-secondary-900 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-200"
					>
						{loc.indoor_outdoor}
					</span>
				{/if}
				{#if loc.price}
					<span
						class="rounded-sm border border-subtle bg-sunken px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-default"
					>
						{loc.price}
					</span>
				{/if}
				{#if !fm.published}
					<span
						class="rounded-sm border border-tertiary-300 bg-tertiary-50 px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-tertiary-700 dark:border-tertiary-700 dark:bg-tertiary-900 dark:text-tertiary-300"
						title="Editorial guide not yet written"
					>
						Basic listing
					</span>
				{/if}
			</div>
		</div>
	</header>

	<section class="mb-8 rounded-md border border-subtle bg-surface p-5">
		<h2 class="mb-3 font-display text-lg font-bold text-default">The basics</h2>
		<dl class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
			<div>
				<dt class="font-mono text-xs uppercase tracking-wide text-muted">Address</dt>
				<dd class="mt-0.5 text-default">{fullAddressOneLine || '—'}</dd>
			</div>
			{#if entry.location.website}
				<div>
					<dt class="font-mono text-xs uppercase tracking-wide text-muted">Website</dt>
					<dd class="mt-0.5">
						<a
							href={entry.location.website}
							target="_blank"
							rel="noopener noreferrer"
							class="font-mono uppercase tracking-wide text-tertiary-600 transition-colors duration-fast hover:text-tertiary-700 dark:text-tertiary-400 dark:hover:text-tertiary-300"
						>
							Visit site →
						</a>
					</dd>
				</div>
			{/if}
			{#if loc.type}
				<div>
					<dt class="font-mono text-xs uppercase tracking-wide text-muted">Type</dt>
					<dd class="mt-0.5 text-default">{loc.type}</dd>
				</div>
			{/if}
			{#if loc.indoor_outdoor}
				<div>
					<dt class="font-mono text-xs uppercase tracking-wide text-muted">Setting</dt>
					<dd class="mt-0.5 text-default">{loc.indoor_outdoor}</dd>
				</div>
			{/if}
			{#if loc.price}
				<div>
					<dt class="font-mono text-xs uppercase tracking-wide text-muted">Price</dt>
					<dd class="mt-0.5 text-default">{loc.price}</dd>
				</div>
			{/if}
		</dl>
	</section>

	{#if hasQuickFacts}
		<section class="mb-8 rounded-md border border-subtle bg-surface p-5">
			<h2 class="mb-3 font-display text-lg font-bold text-default">Quick facts</h2>
			{#if quickFactRows.length}
				<dl class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
					{#each quickFactRows as row}
						<div>
							<dt class="font-mono text-xs uppercase tracking-wide text-muted">{row.label}</dt>
							<dd class="mt-0.5 text-default">{row.value}</dd>
						</div>
					{/each}
				</dl>
			{/if}
			{#if weatherBadges.length}
				<div class="mt-4 flex flex-wrap gap-2">
					{#each weatherBadges as badge}
						<span
							class="rounded-sm border px-2 py-0.5 font-mono text-xs uppercase tracking-wide"
							class:border-primary-200={badge.tone === 'good'}
							class:bg-primary-50={badge.tone === 'good'}
							class:text-primary-700={badge.tone === 'good'}
							class:dark:border-primary-700={badge.tone === 'good'}
							class:dark:bg-primary-900={badge.tone === 'good'}
							class:dark:text-primary-300={badge.tone === 'good'}
							class:border-tertiary-300={badge.tone === 'warn'}
							class:bg-tertiary-50={badge.tone === 'warn'}
							class:text-tertiary-700={badge.tone === 'warn'}
							class:dark:border-tertiary-700={badge.tone === 'warn'}
							class:dark:bg-tertiary-900={badge.tone === 'warn'}
							class:dark:text-tertiary-300={badge.tone === 'warn'}
							class:border-subtle={badge.tone === 'neutral'}
							class:bg-sunken={badge.tone === 'neutral'}
							class:text-default={badge.tone === 'neutral'}
						>
							{badge.text}
						</span>
					{/each}
				</div>
			{/if}
		</section>
	{/if}

	{#if fm.published && entry.bodyHtml}
		<article class="prose prose-lg mb-6 max-w-none dark:prose-invert">
			{@html entry.bodyHtml}
		</article>
		{#if verifiedLabel}
			<p class="mb-10 font-mono text-xs uppercase tracking-wide text-subtle">
				Operational details verified {verifiedLabel}. Hours and prices drift — confirm on the
				official site before you drive.
			</p>
		{/if}
	{:else}
		<section
			class="mb-10 rounded-md border border-dashed border-strong bg-sunken p-5 text-sm text-muted"
		>
			<p class="font-display font-semibold text-default">
				We're still writing the family guide for this spot.
			</p>
			<p class="mt-1">
				The address and website above are verified. Once we publish parent-tested tips, hours, and
				FAQs, they'll appear right here.
			</p>
		</section>
	{/if}

	{#if paired.length}
		<section class="mb-10">
			<h2 class="mb-3 font-display text-xl font-bold text-default">Pair with</h2>
			<p class="mb-3 text-sm text-muted">
				Editor-picked stops that work well as a half-day combo with this one.
			</p>
			<ul class="grid gap-3 sm:grid-cols-3">
				{#each paired as p (p.id)}
					<li>
						<a
							href={`/locations/${p.stateSlug}/${p.citySlug}/${p.slug}`}
							class="group block rounded-md border border-subtle bg-surface p-3 transition duration-fast hover:border-strong hover:shadow-md dark:hover:bg-elevated"
						>
							<div
								class="font-display font-semibold text-default transition-colors duration-fast group-hover:text-primary-700 dark:group-hover:text-primary-300"
							>
								{p.frontmatter.name}
							</div>
							<div class="mt-1 font-mono text-xs uppercase tracking-wide text-subtle">
								{p.frontmatter.city}, {p.frontmatter.state}
							</div>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if nearby.length}
		<section class="mb-10">
			<h2 class="mb-3 font-display text-xl font-bold text-default">Nearby places</h2>
			<ul class="grid gap-3 sm:grid-cols-3">
				{#each nearby as n (n.id)}
					<li>
						<a
							href={`/locations/${n.stateSlug}/${n.citySlug}/${n.slug}`}
							class="group block rounded-md border border-subtle bg-surface p-3 transition duration-fast hover:border-strong hover:shadow-md dark:hover:bg-elevated"
						>
							<div
								class="font-display font-semibold text-default transition-colors duration-fast group-hover:text-primary-700 dark:group-hover:text-primary-300"
							>
								{n.frontmatter.name}
							</div>
							<div class="mt-1 font-mono text-xs uppercase tracking-wide text-subtle">
								{n.frontmatter.city}, {n.frontmatter.state} · {n.distanceMiles.toFixed(1)} mi
							</div>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>
