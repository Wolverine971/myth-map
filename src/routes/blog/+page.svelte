<!-- src/routes/blog/+page.svelte -->
<script lang="ts">
	import SEOHead from '$lib/components/shared/SEOHead.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	function formatMonth(value: string | null): string {
		if (!value) return 'Drafted';
		const date = new Date(`${value}T12:00:00Z`);
		if (Number.isNaN(date.getTime())) return 'Drafted';
		return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
	}
</script>

<SEOHead
	title="Field Notes"
	description="Published Tiny Tribe Adventures guides with parent-tested tips, parking notes, timing, and practical details for Maryland family outings."
	canonical="/blog"
/>

<div class="page-container pb-16">
	<header class="mb-10 border-b border-subtle pb-8">
		<div class="data-label mb-3">Field notes · Published guides · {data.guides.length}</div>
		<h1
			class="font-display text-4xl font-extrabold tracking-tight text-primary-700 dark:text-primary-300 md:text-5xl"
		>
			Field Notes
		</h1>
		<p class="mt-3 max-w-2xl text-base text-default">
			The full Tiny Tribe guides: practical notes on parking, timing, bathrooms, cost, age fit, and
			what parents should know before loading everyone into the car.
		</p>
	</header>

	{#if data.guides.length}
		<ul class="grid gap-3 sm:grid-cols-2">
			{#each data.guides as guide}
				<li>
					<a
						href={guide.href}
						class="group block h-full rounded-md border border-subtle bg-surface p-4 transition duration-fast hover:border-strong hover:shadow-md dark:hover:bg-elevated"
					>
						<div class="data-label mb-2">
							{guide.city}, {guide.state} · {formatMonth(guide.publishedAt)}
						</div>
						<h2
							class="font-display text-xl font-bold leading-tight text-default transition-colors duration-fast group-hover:text-primary-700 dark:group-hover:text-primary-300"
						>
							{guide.name}
						</h2>
						<div class="mt-3 flex flex-wrap gap-2">
							<span class="stamped-tag">Guide</span>
							{#if guide.parentTested}
								<span class="stamped-tag">Parent-tested</span>
							{/if}
							{#if guide.verifiedAt}
								<span class="stamped-tag">Verified {formatMonth(guide.verifiedAt)}</span>
							{/if}
						</div>
						<div
							class="mt-4 font-mono text-xs uppercase tracking-wide text-tertiary-600 transition-colors duration-fast group-hover:text-tertiary-700 dark:text-tertiary-400 dark:group-hover:text-tertiary-300"
						>
							Read guide →
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<section class="border border-dashed border-strong bg-sunken px-6 py-12 text-center">
			<div class="data-label mb-2">No published guides yet</div>
			<p class="mx-auto max-w-md text-base text-default">
				The location directory is live while the long-form family guides are being written.
			</p>
			<a
				href="/locations"
				class="mt-4 inline-flex rounded-sm bg-primary-700 px-4 py-2 font-mono text-xs uppercase tracking-wide text-white transition-colors duration-fast hover:bg-primary-600 dark:bg-primary-500 dark:text-primary-50 dark:hover:bg-primary-400"
			>
				Browse locations
			</a>
		</section>
	{/if}
</div>
