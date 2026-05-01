<!-- src/routes/locations/+page.svelte -->
<script lang="ts">
	import SEOHead from '$lib/components/shared/SEOHead.svelte';
	import type { PageData } from './$types';
	import { getLocationIcon } from '../../utils/locationPhotos';

	export let data: PageData;

	function formatCoords(
		lat: number | null | undefined,
		lng: number | null | undefined
	): string | null {
		if (lat == null || lng == null) return null;
		const ns = lat >= 0 ? 'N' : 'S';
		const ew = lng >= 0 ? 'E' : 'W';
		return `${Math.abs(lat).toFixed(3)}°${ns} · ${Math.abs(lng).toFixed(3)}°${ew}`;
	}

	$: byCity = (() => {
		type Entry = (typeof data.entries)[number];
		const groups = new Map<
			string,
			{ city: string; stateSlug: string; citySlug: string; entries: Entry[] }
		>();
		for (const entry of data.entries) {
			const city = entry.frontmatter.city || 'Unknown';
			const key = `${entry.stateSlug}/${entry.citySlug}`;
			const group = groups.get(key);
			if (group) {
				group.entries.push(entry);
			} else {
				groups.set(key, {
					city,
					stateSlug: entry.stateSlug,
					citySlug: entry.citySlug,
					entries: [entry]
				});
			}
		}
		return [...groups.values()]
			.map((g) => ({
				...g,
				entries: [...g.entries].sort((a, b) => a.frontmatter.name.localeCompare(b.frontmatter.name))
			}))
			.sort((a, b) => b.entries.length - a.entries.length || a.city.localeCompare(b.city));
	})();

	$: stateAbbrs = (() => {
		const set = new Set<string>();
		for (const entry of data.entries) {
			if (entry.frontmatter.state) set.add(entry.frontmatter.state);
		}
		return [...set].sort();
	})();

	$: publishedCount = data.entries.filter((e) => e.frontmatter.published).length;
</script>

<SEOHead
	title="All Locations"
	description="Browse every family-friendly location in the Tiny Tribe Adventures directory, grouped by city."
	canonical="/locations"
/>

<div id="top" class="pb-16 pt-2">
	<!-- Header / field-manual title block -->
	<header class="mb-10 border-b border-subtle pb-8">
		<div class="data-label mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
			<span>Field directory</span>
			<span aria-hidden="true" class="text-subtle">·</span>
			<span>{stateAbbrs.join(' / ')}</span>
			<span aria-hidden="true" class="text-subtle">·</span>
			<span>{data.entries.length} entries</span>
		</div>

		<h1
			class="text-4xl font-extrabold tracking-tight text-primary-700 dark:text-primary-300 md:text-5xl"
		>
			All Locations
		</h1>

		<p class="mt-3 max-w-2xl text-base text-default">
			Every spot we've logged so far, grouped by city. Family-tested, parent-recommended, and
			ordered by where we've put in the most miles.
		</p>

		<!-- Stat strip -->
		<dl
			class="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-subtle bg-[var(--border-subtle)]"
		>
			<div class="bg-surface px-4 py-3">
				<dt class="data-label">Locations</dt>
				<dd class="mt-1 font-display text-2xl font-bold text-primary-700 dark:text-primary-300">
					{data.entries.length}
				</dd>
			</div>
			<div class="bg-surface px-4 py-3">
				<dt class="data-label">Cities</dt>
				<dd class="mt-1 font-display text-2xl font-bold text-primary-700 dark:text-primary-300">
					{byCity.length}
				</dd>
			</div>
			<div class="bg-surface px-4 py-3">
				<dt class="data-label">Guides</dt>
				<dd class="mt-1 font-display text-2xl font-bold text-primary-700 dark:text-primary-300">
					{publishedCount}
				</dd>
			</div>
		</dl>

		<!-- City jump nav -->
		<nav class="mt-6" aria-label="Jump to city">
			<div class="data-label mb-2">Jump to city</div>
			<ul class="flex flex-wrap gap-1.5">
				{#each byCity as group (group.stateSlug + '/' + group.citySlug)}
					<li>
						<a
							href={`#${group.citySlug}`}
							class="stamped-tag transition duration-fast hover:border-strong hover:bg-surface hover:text-primary-700 hover:shadow-sm dark:hover:bg-elevated dark:hover:text-primary-300"
						>
							<span>{group.city}</span>
							<span class="ml-1.5 text-subtle">{group.entries.length}</span>
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	</header>

	<!-- City sections -->
	{#each byCity as group (group.stateSlug + '/' + group.citySlug)}
		<section id={group.citySlug} class="mb-12 scroll-mt-6">
			<div
				class="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-subtle pb-2"
			>
				<h2 class="font-display text-2xl font-bold tracking-tight text-default md:text-3xl">
					<a
						href={`/locations/${group.stateSlug}/${group.citySlug}`}
						class="transition-colors duration-fast hover:text-primary-700 dark:hover:text-primary-300"
					>
						{group.city}
					</a>
				</h2>
				<div class="flex items-center gap-3">
					<span class="data-label">
						{group.entries.length}
						{group.entries.length === 1 ? 'spot' : 'spots'}
					</span>
					<a
						href="#top"
						class="data-label transition-colors duration-fast hover:text-primary-700 dark:hover:text-primary-300"
						aria-label="Back to top"
					>
						↑ Top
					</a>
				</div>
			</div>

			<ul class="grid gap-3 sm:grid-cols-2">
				{#each group.entries as entry (entry.id)}
					{@const linkable = entry.frontmatter.published}
					{@const cardHref = linkable
						? `/locations/${entry.stateSlug}/${entry.citySlug}/${entry.slug}`
						: entry.location.website || null}
					{@const externalLink = !linkable && !!cardHref}
					{@const coords = formatCoords(entry.location.location.lat, entry.location.location.lng)}
					<li>
						<svelte:element
							this={cardHref ? 'a' : 'div'}
							href={cardHref ?? undefined}
							target={externalLink ? '_blank' : undefined}
							rel={externalLink ? 'noopener noreferrer' : undefined}
							class="group relative flex h-full items-start gap-3 rounded-md border border-subtle bg-surface p-3 transition duration-fast hover:border-strong hover:shadow-md dark:hover:bg-elevated"
						>
							<img
								class="h-14 w-14 flex-shrink-0 object-contain"
								src={`/map/${getLocationIcon(entry.frontmatter.name)}.png`}
								alt=""
								loading="lazy"
							/>
							<div class="min-w-0 flex-1">
								<div class="flex items-start justify-between gap-2">
									<h3
										class="font-display text-lg font-bold leading-tight text-default transition-colors duration-fast group-hover:text-primary-700 dark:group-hover:text-primary-300"
									>
										{entry.frontmatter.name}
									</h3>
									{#if linkable}
										<span
											class="mt-0.5 flex-shrink-0 rounded-sm border border-primary-200 bg-primary-50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-primary-700 dark:border-primary-700 dark:bg-primary-900 dark:text-primary-300"
										>
											Guide
										</span>
									{/if}
								</div>
								<p class="mt-1 text-sm text-muted">
									{#if entry.location.location.address_line_1}{entry.location.location
											.address_line_1},
									{/if}{entry.frontmatter.city}, {entry.frontmatter.state}
									{entry.location.location.zip_code ?? ''}
								</p>
								<div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
									{#if coords}
										<span class="font-mono text-xs uppercase tracking-wide text-subtle">
											{coords}
										</span>
									{/if}
									{#if linkable}
										<span aria-hidden="true" class="text-subtle">·</span>
										<span
											class="font-mono text-xs uppercase tracking-wide text-tertiary-600 transition-colors duration-fast group-hover:text-tertiary-700 dark:text-tertiary-400 dark:group-hover:text-tertiary-300"
										>
											Read guide →
										</span>
									{:else if entry.location.website}
										<span aria-hidden="true" class="text-subtle">·</span>
										<span
											class="font-mono text-xs uppercase tracking-wide text-tertiary-600 transition-colors duration-fast group-hover:text-tertiary-700 dark:text-tertiary-400 dark:group-hover:text-tertiary-300"
										>
											Visit site →
										</span>
									{/if}
								</div>
							</div>
						</svelte:element>
					</li>
				{/each}
			</ul>
		</section>
	{/each}

	<div class="border-t border-subtle pt-6 text-center">
		<a
			href="#top"
			class="data-label transition-colors duration-fast hover:text-primary-700 dark:hover:text-primary-300"
		>
			↑ Back to top
		</a>
	</div>
</div>
