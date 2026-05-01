<!-- src/routes/locations/+page.svelte -->
<script lang="ts">
	import { Heading, P } from 'flowbite-svelte';
	import SEOHead from '$lib/components/shared/SEOHead.svelte';
	import type { PageData } from './$types';
	import { getLocationIcon } from '../../utils/locationPhotos';

	export let data: PageData;

	$: byCity = (() => {
		const groups: Record<string, typeof data.contentLocations> = {};
		for (const loc of data.contentLocations) {
			const city = loc.location.city || 'Unknown';
			(groups[city] ??= []).push(loc);
		}
		return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
	})();
</script>

<SEOHead
	title="All Locations"
	description="Browse every family-friendly location in the Tiny Tribe Adventures directory, grouped by city."
	canonical="/locations"
/>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<Heading tag="h1" customSize="text-4xl md:text-5xl font-extrabold mb-2">Locations</Heading>
	<P class="mb-6 text-gray-600">{data.contentLocations.length} family-friendly spots across Maryland.</P>
	<hr class="mb-8" />

	{#each byCity as [city, locs]}
		<section class="mb-10">
			<Heading tag="h2" customSize="text-2xl md:text-3xl font-bold mb-4">{city}</Heading>
			<ul class="grid gap-4">
				{#each locs as cl}
					<li class="flex items-start gap-4 border-l-4 border-gray-200 pl-4 transition hover:border-primary-500">
						<img
							class="h-16 w-16 flex-shrink-0 object-contain"
							src={`/map/${getLocationIcon(cl.location.name)}.png`}
							alt={`${cl.location.name} icon`}
						/>
						<div class="flex-1">
							<h3 class="text-lg font-bold text-gray-900">{cl.location.name}</h3>
							<p class="text-sm text-gray-600">
								{cl.location.address_line_1}{cl.location.address_line_1 ? ', ' : ''}{cl.location.city}, {cl.location.state} {cl.location.zip_code}
							</p>
							{#if cl.website}
								<a href={cl.website} target="_blank" rel="noopener noreferrer" class="text-sm text-primary-600 hover:underline">
									Visit website →
								</a>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>
