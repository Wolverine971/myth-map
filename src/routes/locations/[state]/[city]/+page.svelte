<!-- src/routes/locations/[state]/[city]/+page.svelte -->
<script lang="ts">
	import SEOHead from '$lib/components/shared/SEOHead.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	$: items = data.items;
	$: canonical = `/locations/${data.stateSlug}/${data.citySlug}`;
	$: stateHref = `/locations/${data.stateSlug}`;
	$: publishedCount = items.filter((i) => i.frontmatter.published).length;
</script>

<SEOHead
	title={`Family-friendly things to do in ${data.cityName}, ${data.stateAbbr}`}
	description={`${items.length} family-friendly places in ${data.cityName}, ${data.stateAbbr} — playgrounds, museums, parks, and more. Curated by Tiny Tribe Adventures.`}
	{canonical}
/>

<div class="container mx-auto max-w-3xl px-4 py-8">
	<nav class="mb-4 text-sm text-gray-500" aria-label="Breadcrumb">
		<a href="/locations" class="hover:underline">Locations</a>
		<span aria-hidden="true"> / </span>
		<a href={stateHref} class="hover:underline">{data.stateAbbr}</a>
		<span aria-hidden="true"> / </span>
		<span class="text-gray-700">{data.cityName}</span>
	</nav>

	<header class="mb-6">
		<h1 class="mb-2 text-3xl font-extrabold text-gray-900 md:text-4xl">
			Family things to do in {data.cityName}
		</h1>
		<p class="text-gray-600">
			{items.length} family-friendly {items.length === 1 ? 'spot' : 'spots'} in {data.cityName}, {data.stateAbbr}{publishedCount
				? ` — ${publishedCount} with a full guide.`
				: '.'}
		</p>
	</header>

	<ul class="grid gap-3">
		{#each items as item (item.id)}
			<li
				class="rounded-md border border-gray-200 bg-white p-4 transition hover:border-primary-400"
			>
				<a
					href={`/locations/${item.stateSlug}/${item.citySlug}/${item.slug}`}
					class="flex items-start justify-between gap-3"
				>
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<h2 class="text-lg font-bold text-gray-900">{item.frontmatter.name}</h2>
							{#if item.frontmatter.published}
								<span
									class="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-800"
								>
									Guide
								</span>
							{/if}
						</div>
						<p class="text-sm text-gray-600">
							{item.location.location.address_line_1 || ''}
							{item.location.location.address_line_1 ? ', ' : ''}{item.frontmatter.city},
							{item.frontmatter.state}
						</p>
						<div class="mt-1 flex flex-wrap gap-1.5 text-xs text-gray-500">
							{#if item.location.location.type}
								<span>{item.location.location.type}</span>
							{/if}
							{#if item.location.location.indoor_outdoor}
								<span aria-hidden="true">·</span>
								<span>{item.location.location.indoor_outdoor}</span>
							{/if}
							{#if item.location.location.price}
								<span aria-hidden="true">·</span>
								<span>{item.location.location.price}</span>
							{/if}
						</div>
					</div>
					<span class="shrink-0 self-center text-primary-600">→</span>
				</a>
			</li>
		{/each}
	</ul>
</div>
