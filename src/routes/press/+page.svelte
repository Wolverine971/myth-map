<!-- src/routes/press/+page.svelte -->
<script lang="ts">
	import SEOHead from '$lib/components/shared/SEOHead.svelte';
	import {
		MapPinAltSolid,
		UsersGroupSolid,
		NewspaperSolid,
		ShareNodesSolid,
		DownloadSolid,
		EnvelopeSolid,
		QuoteSolid
	} from 'flowbite-svelte-icons';

	const contactEmail = 'hello@tinytribeadventures.com';
	const mailtoPartner = `mailto:${contactEmail}?subject=Partnership%20inquiry%20%E2%80%94%20Tiny%20Tribe%20Adventures`;
	const mailtoPress = `mailto:${contactEmail}?subject=Press%20inquiry%20%E2%80%94%20Tiny%20Tribe%20Adventures`;

	const stats = [
		{ value: '57', label: 'Family-tested locations' },
		{ value: '19', label: 'Maryland cities covered' },
		{ value: '0–9', label: 'Primary kid age range' },
		{ value: 'DMV', label: 'DC · MD · VA · DE planned' }
	];

	const audience = [
		'Parents of kids age 0–9 in the Baltimore–DC corridor',
		'Trip planners looking for next-Saturday ideas, not next-vacation ideas',
		'Visitors searching for things to do in the DMV with kids',
		'Mobile-first traffic — most visits start on a phone'
	];

	const partnerOffer = [
		'A richer feature page about your venue on the map',
		'A dedicated social post highlighting your location',
		'A backlink from a curated, topical family guide',
		'Inclusion in seasonal round-ups (best fall, indoor rainy day, etc.)'
	];

	const partnerAsk = [
		'A mention of Tiny Tribe Adventures in your next newsletter',
		'A link from your visitor resources / "things to do nearby" page',
		'A reshare of our feature on your social channels'
	];
</script>

<SEOHead
	title="Press &amp; Partnerships · Tiny Tribe Adventures"
	description="Press kit, founder story, audience, and partnership info for Tiny Tribe Adventures — a curated family-adventure guide to the Maryland and DMV region."
	canonical="/press"
/>

<div class="page-container space-y-12">
	<!-- Header -->
	<header class="border-b border-subtle pb-6">
		<div class="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted">
			<NewspaperSolid class="h-3.5 w-3.5 text-tertiary-500" />
			<span>Field guide · §00 · Press &amp; partnerships</span>
		</div>
		<h1 class="font-display text-3xl text-primary-700 dark:text-primary-300 sm:text-4xl">
			Press &amp; partnerships
		</h1>
		<p class="mt-2 text-base text-muted sm:text-lg">
			A one-page kit for journalists, bloggers, and partner locations. Everything you need to write
			about — or work with — Tiny Tribe Adventures.
		</p>

		<div class="mt-5 flex flex-wrap gap-3">
			<a
				href={mailtoPress}
				class="inline-flex items-center gap-2 rounded-sm bg-primary-700 px-4 py-2 font-mono text-xs uppercase tracking-wide text-white transition-colors duration-fast hover:bg-primary-600 dark:bg-primary-500 dark:text-primary-50 dark:hover:bg-primary-400"
			>
				<NewspaperSolid class="h-3.5 w-3.5" />
				<span>Press inquiry</span>
			</a>
			<a
				href={mailtoPartner}
				class="inline-flex items-center gap-2 rounded-sm border border-primary-700 bg-transparent px-4 py-2 font-mono text-xs uppercase tracking-wide text-primary-700 transition-colors duration-fast hover:bg-primary-50 dark:border-primary-300 dark:text-primary-300 dark:hover:bg-primary-900/30"
			>
				<ShareNodesSolid class="h-3.5 w-3.5" />
				<span>Partnership inquiry</span>
			</a>
		</div>
	</header>

	<!-- The pitch -->
	<section class="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
		<div class="flex items-center gap-2 sm:flex-col sm:items-start">
			<QuoteSolid class="h-5 w-5 text-tertiary-500" />
			<div class="font-mono text-xs uppercase tracking-wide text-muted">§01 The pitch</div>
		</div>
		<div class="space-y-4 text-base text-default">
			<p class="font-display text-lg text-primary-700 dark:text-primary-300">
				Family-tested places for when you need ideas.
			</p>
			<p>
				Tiny Tribe Adventures is a curated, parent-to-parent map of family-friendly places across
				Maryland and the broader DMV. We help families spend less time scrolling and more time
				exploring — pointing parents to the places actually worth the drive, with the practical
				details (parking, ages it works for, when to go) up front.
			</p>
		</div>
	</section>

	<!-- Stats -->
	<section class="border border-subtle bg-surface px-5 py-4">
		<div class="mb-3 font-mono text-xs uppercase tracking-wide text-muted">§02 By the numbers</div>
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			{#each stats as stat}
				<div class="border border-subtle bg-sunken px-3 py-2">
					<div class="font-mono text-lg font-bold text-primary-700 dark:text-primary-300">
						{stat.value}
					</div>
					<div class="font-mono text-xs uppercase tracking-wide text-muted">{stat.label}</div>
				</div>
			{/each}
		</div>
		<p class="mt-3 font-mono text-xs uppercase tracking-wide text-muted">
			Mobile-first · Continuously updated · Maryland-anchored, DMV-bound
		</p>
	</section>

	<!-- Founder story -->
	<section class="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
		<div class="flex items-center gap-2 sm:flex-col sm:items-start">
			<UsersGroupSolid class="h-5 w-5 text-tertiary-500" />
			<div class="font-mono text-xs uppercase tracking-wide text-muted">§03 Founder story</div>
		</div>
		<div class="space-y-4 text-base text-default">
			<p>
				Two families — <span class="font-semibold text-default">Zach &amp; Kerry</span> and
				<span class="font-semibold text-default">DJ &amp; Anna</span> — met randomly at a kid's birthday
				party and became fast friends. Many stars aligned for that meeting to happen, and that experience
				is what inspired Tiny Tribe Adventures.
			</p>
			<p>
				We built the site we wished existed when our own kids were small: a curated, parent-tested
				list of places to go — not an algorithmic feed, not a deals site, not a parenting blog. Just
				the next thing to do, vetted by parents, organized for the way families actually plan a
				Saturday.
			</p>
			<p class="text-muted">
				The bigger goal: help other families grow their own tribe along the way.
			</p>
		</div>
	</section>

	<!-- Audience -->
	<section class="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
		<div class="flex items-center gap-2 sm:flex-col sm:items-start">
			<UsersGroupSolid class="h-5 w-5 text-tertiary-500" />
			<div class="font-mono text-xs uppercase tracking-wide text-muted">§04 Audience</div>
		</div>
		<div class="space-y-3 text-base text-default">
			<ul class="space-y-2">
				{#each audience as line}
					<li class="flex gap-2">
						<span class="text-tertiary-500" aria-hidden="true">›</span>
						<span>{line}</span>
					</li>
				{/each}
			</ul>
		</div>
	</section>

	<!-- Partner with us -->
	<section class="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
		<div class="flex items-center gap-2 sm:flex-col sm:items-start">
			<ShareNodesSolid class="h-5 w-5 text-tertiary-500" />
			<div class="font-mono text-xs uppercase tracking-wide text-muted">§05 Partner with us</div>
		</div>
		<div class="space-y-5 text-base text-default">
			<p>
				If you run a museum, park, attraction, or family-friendly business in Maryland or the DMV,
				we're probably already sending families your way. Make it official and we'll go deeper.
			</p>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="border border-subtle bg-surface p-4">
					<div class="mb-2 font-mono text-xs uppercase tracking-wide text-muted">We offer</div>
					<ul class="space-y-1.5 text-sm">
						{#each partnerOffer as item}
							<li class="flex gap-2">
								<span class="text-tertiary-500" aria-hidden="true">+</span>
								<span>{item}</span>
							</li>
						{/each}
					</ul>
				</div>
				<div class="border border-subtle bg-surface p-4">
					<div class="mb-2 font-mono text-xs uppercase tracking-wide text-muted">We ask for</div>
					<ul class="space-y-1.5 text-sm">
						{#each partnerAsk as item}
							<li class="flex gap-2">
								<span class="text-tertiary-500" aria-hidden="true">+</span>
								<span>{item}</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>

			<a
				href={mailtoPartner}
				class="inline-flex items-center gap-2 rounded-sm bg-primary-700 px-4 py-2 font-mono text-xs uppercase tracking-wide text-white transition-colors duration-fast hover:bg-primary-600 dark:bg-primary-500 dark:text-primary-50 dark:hover:bg-primary-400"
			>
				<EnvelopeSolid class="h-3.5 w-3.5" />
				<span>Start a partnership conversation</span>
			</a>
		</div>
	</section>

	<!-- Press boilerplate -->
	<section class="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
		<div class="flex items-center gap-2 sm:flex-col sm:items-start">
			<NewspaperSolid class="h-5 w-5 text-tertiary-500" />
			<div class="font-mono text-xs uppercase tracking-wide text-muted">§06 Press boilerplate</div>
		</div>
		<div class="space-y-4 text-base text-default">
			<p class="text-muted">
				Copy and paste — no permission needed. Updated continuously, so check back before
				publication for the latest stats.
			</p>
			<blockquote
				class="border-l-2 border-tertiary-500 bg-sunken px-4 py-3 font-display text-base text-default"
			>
				Tiny Tribe Adventures (<a
					href="https://tinytribeadventures.com"
					class="underline decoration-tertiary-500 underline-offset-2 hover:text-primary-700 dark:hover:text-primary-300"
					>tinytribeadventures.com</a
				>) is a curated, parent-to-parent map of family-friendly places across Maryland and the DMV.
				Built by two families who met at a kid's birthday party, the site catalogs more than 50
				family-tested locations across 19 Maryland cities and is expanding into DC, Virginia, and
				Delaware. The project is mobile-first, free to use, and designed for parents planning next
				Saturday — not next vacation.
			</blockquote>
		</div>
	</section>

	<!-- Brand assets -->
	<section class="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
		<div class="flex items-center gap-2 sm:flex-col sm:items-start">
			<DownloadSolid class="h-5 w-5 text-tertiary-500" />
			<div class="font-mono text-xs uppercase tracking-wide text-muted">§07 Brand assets</div>
		</div>
		<div class="space-y-4 text-base text-default">
			<div class="grid gap-3 sm:grid-cols-3">
				<a
					href="/myth-map.svg"
					download
					class="group flex flex-col items-center gap-2 border border-subtle bg-surface p-4 transition-colors duration-fast hover:border-tertiary-500"
				>
					<img src="/myth-map.svg" alt="Tiny Tribe Adventures logo" class="h-16 w-auto" />
					<div class="font-mono text-xs uppercase tracking-wide text-muted">Logo · SVG</div>
				</a>
				<a
					href="/myth-map-small.svg"
					download
					class="group flex flex-col items-center gap-2 border border-subtle bg-surface p-4 transition-colors duration-fast hover:border-tertiary-500"
				>
					<img src="/myth-map-small.svg" alt="Tiny Tribe Adventures mark" class="h-16 w-auto" />
					<div class="font-mono text-xs uppercase tracking-wide text-muted">Mark · SVG</div>
				</a>
				<a
					href="/myth-map.png"
					download
					class="group flex flex-col items-center gap-2 border border-subtle bg-surface p-4 transition-colors duration-fast hover:border-tertiary-500"
				>
					<img src="/myth-map.png" alt="Tiny Tribe Adventures social card" class="h-16 w-auto" />
					<div class="font-mono text-xs uppercase tracking-wide text-muted">Social · PNG</div>
				</a>
			</div>
			<div class="border border-subtle bg-sunken px-4 py-3 font-mono text-xs text-muted">
				<div class="mb-1 uppercase tracking-wide">Color palette</div>
				<div class="flex flex-wrap gap-3">
					<span class="flex items-center gap-1.5">
						<span class="inline-block h-3 w-3 border border-subtle" style="background:#014421"
						></span>
						Forest Green #014421
					</span>
					<span class="flex items-center gap-1.5">
						<span class="inline-block h-3 w-3 border border-subtle" style="background:#D2B48C"
						></span>
						Sandstone #D2B48C
					</span>
					<span class="flex items-center gap-1.5">
						<span class="inline-block h-3 w-3 border border-subtle" style="background:#87CEEB"
						></span>
						Sky Blue #87CEEB
					</span>
					<span class="flex items-center gap-1.5">
						<span class="inline-block h-3 w-3 border border-subtle" style="background:#CD5700"
						></span>
						Rustic Orange #CD5700
					</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Contact -->
	<section class="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
		<div class="flex items-center gap-2 sm:flex-col sm:items-start">
			<EnvelopeSolid class="h-5 w-5 text-tertiary-500" />
			<div class="font-mono text-xs uppercase tracking-wide text-muted">§08 Contact</div>
		</div>
		<div class="space-y-2 text-base text-default">
			<p>
				<a
					href={`mailto:${contactEmail}`}
					class="font-mono text-primary-700 underline decoration-tertiary-500 underline-offset-2 hover:text-primary-600 dark:text-primary-300 dark:hover:text-primary-400"
				>
					{contactEmail}
				</a>
			</p>
			<p class="text-sm text-muted">
				We respond to press inquiries within two business days. Partnership inquiries usually get a
				same-day reply.
			</p>
		</div>
	</section>

	<!-- Footer marker -->
	<footer class="border-t border-subtle pt-6 text-center">
		<a
			href="/"
			class="inline-flex items-center gap-2 rounded-sm bg-primary-700 px-4 py-2 font-mono text-xs uppercase tracking-wide text-white transition-colors duration-fast hover:bg-primary-600 dark:bg-primary-500 dark:text-primary-50 dark:hover:bg-primary-400"
		>
			<MapPinAltSolid class="h-3.5 w-3.5" />
			<span>See the map</span>
		</a>
	</footer>
</div>
