<!-- src/routes/locations/[state]/[city]/+page.svelte -->
<script lang="ts">
	import SEOHead from '$lib/components/shared/SEOHead.svelte';
	import Breadcrumbs from '$lib/components/shared/Breadcrumbs.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	$: items = data.items;
	$: canonical = `/locations/${data.stateSlug}/${data.citySlug}`;
	$: stateHref = `/locations/${data.stateSlug}`;
	$: publishedCount = items.filter((i) => i.frontmatter.published).length;
	$: breadcrumbItems = [
		{ label: 'Locations', href: '/locations' },
		{ label: data.stateAbbr, href: stateHref },
		{ label: data.cityName, current: true }
	];
</script>

<SEOHead
	title={`Family-friendly things to do in ${data.cityName}, ${data.stateAbbr}`}
	description={`${items.length} family-friendly places in ${data.cityName}, ${data.stateAbbr} — playgrounds, museums, parks, and more. Curated by Tiny Tribe Adventures.`}
	{canonical}
/>

<div class="container mx-auto max-w-3xl px-4 py-8">
	<div class="mb-4">
		<Breadcrumbs items={breadcrumbItems} />
	</div>

	<header class="mb-6 border-b border-subtle pb-6">
		<div class="mb-2 font-mono text-xs uppercase tracking-wide text-muted">
			{data.stateAbbr} · {data.cityName} · {items.length} entries
		</div>
		<h1
			class="mb-2 text-3xl font-extrabold tracking-tight text-primary-700 dark:text-primary-300 md:text-4xl"
		>
			Family things to do in {data.cityName}
		</h1>
		<p class="text-default">
			{items.length} family-friendly {items.length === 1 ? 'spot' : 'spots'} in {data.cityName}, {data.stateAbbr}{publishedCount
				? ` — ${publishedCount} with a full guide.`
				: '.'}
		</p>
	</header>

	<ul class="grid gap-3">
		{#each items as item (item.id)}
			<li>
				<a
					href={`/locations/${item.stateSlug}/${item.citySlug}/${item.slug}`}
					class="group flex items-start justify-between gap-3 rounded-md border border-subtle bg-surface p-4 transition duration-fast hover:border-strong hover:shadow-md dark:hover:bg-elevated"
				>
					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-center gap-2">
							<h2
								class="font-display text-lg font-bold text-default transition-colors duration-fast group-hover:text-primary-700 dark:group-hover:text-primary-300"
							>
								{item.frontmatter.name}
							</h2>
							{#if item.frontmatter.published}
								<span
									class="rounded-sm border border-primary-200 bg-primary-50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-primary-700 dark:border-primary-700 dark:bg-primary-900 dark:text-primary-300"
								>
									Guide
								</span>
							{/if}
						</div>
						<p class="mt-1 text-sm text-muted">
							{item.location.location.address_line_1 || ''}{item.location.location.address_line_1
								? ', '
								: ''}{item.frontmatter.city}, {item.frontmatter.state}
						</p>
						<div
							class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-wide text-subtle"
						>
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
					<span
						class="shrink-0 self-center font-mono text-tertiary-600 transition-colors duration-fast group-hover:text-tertiary-700 dark:text-tertiary-400 dark:group-hover:text-tertiary-300"
						aria-hidden="true"
					>
						→
					</span>
				</a>
			</li>
		{/each}
	</ul>
</div>
