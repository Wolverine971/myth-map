<!-- src/routes/about/+page.svelte -->
<script lang="ts">
	import SEOHead from '$lib/components/shared/SEOHead.svelte';
	import { MapPinAltSolid, UsersGroupSolid, GlobeOutline } from 'flowbite-svelte-icons';
</script>

<SEOHead
	title="About · Tiny Tribe Adventures"
	description="A curated guide to family adventures in the DMV, built parent-to-parent by two families who met at a kid's birthday party."
	canonical="/about"
/>

<div class="page-container space-y-12">
	<!-- Field-manual style header -->
	<header class="border-b border-subtle pb-6">
		<div class="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted">
			<MapPinAltSolid class="h-3.5 w-3.5 text-tertiary-500" />
			<span>Field guide · §00 · About this project</span>
		</div>
		<h1 class="font-display text-3xl text-primary-700 dark:text-primary-300 sm:text-4xl">
			Tiny Tribe Adventures
		</h1>
		<p class="mt-2 text-base text-muted sm:text-lg">
			Family-tested places for when you need ideas.
		</p>
	</header>

	<!-- Mission -->
	<section class="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
		<div class="flex items-center gap-2 sm:flex-col sm:items-start">
			<GlobeOutline class="h-5 w-5 text-tertiary-500" />
			<div class="font-mono text-xs uppercase tracking-wide text-muted">§01 Mission</div>
		</div>
		<div class="space-y-4 text-base text-default">
			<p>
				A curated list of family-friendly locations for parents who need ideas. Built
				parent-to-parent so families can spend less time scrolling and more time exploring.
			</p>
			<p>
				Parenting is hard. Finding the next thing to do shouldn't be. We point you to the places
				that are actually worth the drive — with the practical details parents need (where to park,
				what ages it works for, when to go) up front.
			</p>
			<p class="font-display text-lg text-primary-700 dark:text-primary-300">
				Put down your phone. Explore together.
			</p>
		</div>
	</section>

	<!-- About us -->
	<section class="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
		<div class="flex items-center gap-2 sm:flex-col sm:items-start">
			<UsersGroupSolid class="h-5 w-5 text-tertiary-500" />
			<div class="font-mono text-xs uppercase tracking-wide text-muted">§02 About us</div>
		</div>
		<div class="space-y-4 text-base text-default">
			<p>
				Two families who met randomly at a kid's birthday party and became fast friends. Many stars
				aligned for us to meet and engage with each other — and that experience is what inspired
				this project. We want to help other families expand their own tribe.
			</p>
			<p>
				This is a project by <span class="font-semibold text-default">Zach &amp; Kerry</span>,
				<span class="font-semibold text-default">DJ &amp; Anna</span>
				<span aria-hidden="true">👋</span>
			</p>
		</div>
	</section>

	<!-- Coverage area — field manual data block -->
	<section class="border border-subtle bg-surface px-5 py-4">
		<div class="mb-3 font-mono text-xs uppercase tracking-wide text-muted">§03 Coverage</div>
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			{#each [{ code: 'DC', name: 'Washington' }, { code: 'MD', name: 'Maryland' }, { code: 'VA', name: 'Virginia' }, { code: 'DE', name: 'Delaware' }] as place}
				<div class="border border-subtle bg-sunken px-3 py-2">
					<div class="font-mono text-lg font-bold text-primary-700 dark:text-primary-300">
						{place.code}
					</div>
					<div class="font-mono text-xs uppercase tracking-wide text-muted">{place.name}</div>
				</div>
			{/each}
		</div>
		<p class="mt-3 font-mono text-xs uppercase tracking-wide text-muted">
			Optimized for kids age 0–9 · Mobile-first · Updated continuously
		</p>
	</section>

	<!-- What we are not — defines the boundary -->
	<section class="space-y-3">
		<div class="font-mono text-xs uppercase tracking-wide text-muted">§04 What this is not</div>
		<ul class="space-y-2 text-base text-muted">
			<li class="flex gap-2">
				<span class="text-tertiary-500" aria-hidden="true">×</span>
				<span>Not a parenting blog. We don't tell you how to parent.</span>
			</li>
			<li class="flex gap-2">
				<span class="text-tertiary-500" aria-hidden="true">×</span>
				<span>Not a deal site. We never lead with discounts.</span>
			</li>
			<li class="flex gap-2">
				<span class="text-tertiary-500" aria-hidden="true">×</span>
				<span>Not Yelp. We're curated, not user-review-driven.</span>
			</li>
			<li class="flex gap-2">
				<span class="text-tertiary-500" aria-hidden="true">×</span>
				<span>Not a travel app. We're for next Saturday, not next vacation.</span>
			</li>
		</ul>
	</section>

	<!-- Footer marker -->
	<footer class="border-t border-subtle pt-6 text-center">
		<a
			href="/"
			class="inline-flex items-center gap-2 rounded-sm bg-primary-700 px-4 py-2 font-mono text-xs uppercase tracking-wide text-white transition-colors duration-fast hover:bg-primary-600 dark:bg-primary-500 dark:text-primary-50 dark:hover:bg-primary-400"
		>
			<MapPinAltSolid class="h-3.5 w-3.5" />
			<span>Find your next adventure</span>
		</a>
	</footer>
</div>
