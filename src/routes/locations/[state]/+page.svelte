<!-- src/routes/locations/[state]/+page.svelte -->
<script lang="ts">
	import SEOHead from '$lib/components/shared/SEOHead.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	$: canonical = `/locations/${data.stateSlug}`;
</script>

<SEOHead
	title={`Family-friendly things to do in ${data.stateAbbr}`}
	description={`${data.total} family-friendly places across ${data.stateAbbr}, organized by city. Playgrounds, museums, parks, food, and more — curated by Tiny Tribe Adventures.`}
	{canonical}
/>

<div class="container mx-auto max-w-3xl px-4 py-8">
	<nav class="mb-4 text-sm text-gray-500" aria-label="Breadcrumb">
		<a href="/locations" class="hover:underline">Locations</a>
		<span aria-hidden="true"> / </span>
		<span class="text-gray-700">{data.stateAbbr}</span>
	</nav>

	<header class="mb-6">
		<h1 class="mb-2 text-3xl font-extrabold text-gray-900 md:text-4xl">
			Things to do with kids in {data.stateAbbr}
		</h1>
		<p class="text-gray-600">
			{data.total} family-friendly {data.total === 1 ? 'spot' : 'spots'} across {data.cities.length}
			{data.cities.length === 1 ? 'city' : 'cities'}.
		</p>
	</header>

	<ul class="grid gap-3 sm:grid-cols-2">
		{#each data.cities as city (city.slug)}
			<li
				class="rounded-md border border-gray-200 bg-white p-4 transition hover:border-primary-400"
			>
				<a
					href={`/locations/${data.stateSlug}/${city.slug}`}
					class="flex items-center justify-between"
				>
					<div>
						<div class="text-lg font-bold text-gray-900">{city.name}</div>
						<div class="text-xs text-gray-500">
							{city.count}
							{city.count === 1 ? 'place' : 'places'}
						</div>
					</div>
					<span class="text-primary-600">→</span>
				</a>
			</li>
		{/each}
	</ul>
</div>
