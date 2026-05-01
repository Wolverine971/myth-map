<!-- src/routes/locations/[state]/[city]/[slug]/+page.svelte -->
<script lang="ts">
	import SEOHead from '$lib/components/shared/SEOHead.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	$: entry = data.entry;
	$: nearby = data.nearby;
	$: loc = entry.location.location;
	$: fm = entry.frontmatter;

	$: canonical = `/locations/${entry.stateSlug}/${entry.citySlug}/${entry.slug}`;
	$: cityHref = `/locations/${entry.stateSlug}/${entry.citySlug}`;
	$: stateHref = `/locations/${entry.stateSlug}`;
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
/>

<div class="container mx-auto max-w-3xl px-4 py-8">
	<nav class="mb-4 text-sm text-gray-500" aria-label="Breadcrumb">
		<a href="/locations" class="hover:underline">Locations</a>
		<span aria-hidden="true"> / </span>
		<a href={stateHref} class="hover:underline">{fm.state}</a>
		<span aria-hidden="true"> / </span>
		<a href={cityHref} class="hover:underline">{fm.city}</a>
		<span aria-hidden="true"> / </span>
		<span class="text-gray-700">{loc.name}</span>
	</nav>

	<header class="mb-6">
		<h1 class="mb-2 text-3xl font-extrabold text-gray-900 md:text-4xl">{loc.name}</h1>
		<p class="text-gray-600">{fullAddressOneLine}</p>
		<div class="mt-3 flex flex-wrap gap-2 text-xs">
			{#if loc.type}
				<span class="rounded-full bg-primary-50 px-2 py-1 text-primary-800">{loc.type}</span>
			{/if}
			{#if loc.indoor_outdoor}
				<span class="rounded-full bg-secondary-100 px-2 py-1 text-secondary-900"
					>{loc.indoor_outdoor}</span
				>
			{/if}
			{#if loc.price}
				<span class="rounded-full bg-gray-100 px-2 py-1 text-gray-700">{loc.price}</span>
			{/if}
			{#if !fm.published}
				<span
					class="rounded-full bg-yellow-50 px-2 py-1 text-yellow-800"
					title="Editorial guide not yet written"
				>
					Basic listing
				</span>
			{/if}
		</div>
	</header>

	<section class="mb-8 rounded-lg border border-gray-200 bg-white p-5">
		<h2 class="mb-3 text-lg font-bold text-gray-900">The basics</h2>
		<dl class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
			<div>
				<dt class="font-semibold text-gray-700">Address</dt>
				<dd class="text-gray-600">{fullAddressOneLine || '—'}</dd>
			</div>
			{#if entry.location.website}
				<div>
					<dt class="font-semibold text-gray-700">Website</dt>
					<dd>
						<a
							href={entry.location.website}
							target="_blank"
							rel="noopener noreferrer"
							class="text-primary-700 hover:underline"
						>
							Visit site →
						</a>
					</dd>
				</div>
			{/if}
			{#if loc.type}
				<div>
					<dt class="font-semibold text-gray-700">Type</dt>
					<dd class="text-gray-600">{loc.type}</dd>
				</div>
			{/if}
			{#if loc.indoor_outdoor}
				<div>
					<dt class="font-semibold text-gray-700">Setting</dt>
					<dd class="text-gray-600">{loc.indoor_outdoor}</dd>
				</div>
			{/if}
			{#if loc.price}
				<div>
					<dt class="font-semibold text-gray-700">Price</dt>
					<dd class="text-gray-600">{loc.price}</dd>
				</div>
			{/if}
		</dl>
	</section>

	{#if fm.published && entry.bodyHtml}
		<article class="prose prose-lg mb-10 max-w-none">
			{@html entry.bodyHtml}
		</article>
	{:else}
		<section
			class="mb-10 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600"
		>
			<p class="font-semibold text-gray-800">We're still writing the family guide for this spot.</p>
			<p class="mt-1">
				The address and website above are verified. Once we publish parent-tested tips, hours, and
				FAQs, they'll appear right here.
			</p>
		</section>
	{/if}

	{#if nearby.length}
		<section class="mb-10">
			<h2 class="mb-3 text-xl font-bold text-gray-900">Nearby places</h2>
			<ul class="grid gap-3 sm:grid-cols-3">
				{#each nearby as n (n.id)}
					<li
						class="rounded-md border border-gray-200 bg-white p-3 transition hover:border-primary-400"
					>
						<a href={`/locations/${n.stateSlug}/${n.citySlug}/${n.slug}`} class="block">
							<div class="font-semibold text-gray-900">{n.frontmatter.name}</div>
							<div class="text-xs text-gray-500">
								{n.frontmatter.city}, {n.frontmatter.state} · {n.distanceMiles.toFixed(1)} mi
							</div>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>
