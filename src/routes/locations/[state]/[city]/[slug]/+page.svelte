<!-- src/routes/locations/[state]/[city]/[slug]/+page.svelte -->
<script lang="ts">
	import SEOHead from '$lib/components/shared/SEOHead.svelte';
	import Breadcrumbs from '$lib/components/shared/Breadcrumbs.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	$: entry = data.entry;
	$: nearby = data.nearby;
	$: loc = entry.location.location;
	$: fm = entry.frontmatter;

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

	$: description = fm.published
		? `${loc.name} in ${loc.city}, ${loc.state}. Family-friendly tips, hours, parking, and what to know before you go.`
		: `${loc.name} in ${loc.city}, ${loc.state}. Address, website, and family-friendly details.`;
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

<div class="container mx-auto max-w-3xl px-4 py-8">
	<div class="mb-4">
		<Breadcrumbs items={breadcrumbItems} />
	</div>

	<header class="mb-6">
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

	{#if fm.published && entry.bodyHtml}
		<article class="prose prose-lg mb-10 max-w-none dark:prose-invert">
			{@html entry.bodyHtml}
		</article>
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
