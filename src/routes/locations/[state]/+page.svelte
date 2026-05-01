<!-- src/routes/locations/[state]/+page.svelte -->
<script lang="ts">
	import SEOHead from '$lib/components/shared/SEOHead.svelte';
	import Breadcrumbs from '$lib/components/shared/Breadcrumbs.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	$: canonical = `/locations/${data.stateSlug}`;
	$: breadcrumbItems = [
		{ label: 'Locations', href: '/locations' },
		{ label: data.stateAbbr, current: true }
	];
</script>

<SEOHead
	title={`Family-friendly things to do in ${data.stateAbbr}`}
	description={`${data.total} family-friendly places across ${data.stateAbbr}, organized by city. Playgrounds, museums, parks, food, and more — curated by Tiny Tribe Adventures.`}
	{canonical}
/>

<div class="container mx-auto max-w-3xl px-4 py-8">
	<div class="mb-4">
		<Breadcrumbs items={breadcrumbItems} />
	</div>

	<header class="mb-6 border-b border-subtle pb-6">
		<div class="mb-2 font-mono text-xs uppercase tracking-wide text-muted">
			Field directory · {data.stateAbbr} · {data.total} entries
		</div>
		<h1
			class="mb-2 text-3xl font-extrabold tracking-tight text-primary-700 dark:text-primary-300 md:text-4xl"
		>
			Things to do with kids in {data.stateAbbr}
		</h1>
		<p class="text-default">
			{data.total} family-friendly {data.total === 1 ? 'spot' : 'spots'} across {data.cities.length}
			{data.cities.length === 1 ? 'city' : 'cities'}.
		</p>
	</header>

	<ul class="grid gap-3 sm:grid-cols-2">
		{#each data.cities as city (city.slug)}
			<li>
				<a
					href={`/locations/${data.stateSlug}/${city.slug}`}
					class="group flex items-center justify-between rounded-md border border-subtle bg-surface p-4 transition duration-fast hover:border-strong hover:shadow-md dark:hover:bg-elevated"
				>
					<div>
						<div
							class="font-display text-lg font-bold text-default transition-colors duration-fast group-hover:text-primary-700 dark:group-hover:text-primary-300"
						>
							{city.name}
						</div>
						<div class="font-mono text-xs uppercase tracking-wide text-subtle">
							{city.count}
							{city.count === 1 ? 'place' : 'places'}
						</div>
					</div>
					<span
						class="font-mono text-tertiary-600 transition-colors duration-fast group-hover:text-tertiary-700 dark:text-tertiary-400 dark:group-hover:text-tertiary-300"
						aria-hidden="true"
					>
						→
					</span>
				</a>
			</li>
		{/each}
	</ul>
</div>
