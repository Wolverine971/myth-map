<!-- src/routes/contact/+page.svelte -->
<script lang="ts">
	import SEOHead from '$lib/components/shared/SEOHead.svelte';
	import { EnvelopeSolid, MapPinAltSolid, NewspaperSolid } from 'flowbite-svelte-icons';

	const contactEmail = 'djwayne35@gmail.com';
	const locationTipMailto = `mailto:${contactEmail}?subject=Location%20tip%20for%20Tiny%20Tribe%20Adventures`;
	const correctionMailto = `mailto:${contactEmail}?subject=Listing%20correction%20for%20Tiny%20Tribe%20Adventures`;
	const pressMailto = `mailto:${contactEmail}?subject=Press%20or%20partnership%20inquiry%20for%20Tiny%20Tribe%20Adventures`;

	const contactPaths = [
		{
			icon: MapPinAltSolid,
			label: 'Location tip',
			copy: 'Send a family-friendly spot we should add or revisit.',
			href: locationTipMailto
		},
		{
			icon: EnvelopeSolid,
			label: 'Listing correction',
			copy: 'Flag changed hours, moved entrances, pricing drift, or outdated details.',
			href: correctionMailto
		},
		{
			icon: NewspaperSolid,
			label: 'Press or partnership',
			copy: 'Reach us about coverage, collaborations, or venue partnerships.',
			href: pressMailto
		}
	];
</script>

<SEOHead
	title="Contact"
	description="Get in touch with Tiny Tribe Adventures — share a location tip, suggest a guide, or send a correction."
	canonical="/contact"
/>

<div class="page-container space-y-10 pb-16">
	<header class="border-b border-subtle pb-8">
		<div class="data-label mb-3">Field guide · Contact</div>
		<h1
			class="font-display text-4xl font-extrabold tracking-tight text-primary-700 dark:text-primary-300 md:text-5xl"
		>
			Contact
		</h1>
		<p class="mt-3 max-w-2xl text-base text-default">
			Have a location tip, correction, or partnership note? Send it to the Tiny Tribe inbox and
			include the city, age range, and any practical details parents would care about.
		</p>
	</header>

	<section class="grid gap-3 sm:grid-cols-3">
		{#each contactPaths as path}
			<a
				href={path.href}
				class="group flex h-full flex-col rounded-md border border-subtle bg-surface p-4 transition duration-fast hover:border-strong hover:shadow-md dark:hover:bg-elevated"
			>
				<div
					class="mb-3 flex h-9 w-9 items-center justify-center rounded-sm border border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-900 dark:text-primary-300"
				>
					<svelte:component this={path.icon} class="h-4 w-4" />
				</div>
				<h2
					class="font-display text-lg font-bold text-default transition-colors duration-fast group-hover:text-primary-700 dark:group-hover:text-primary-300"
				>
					{path.label}
				</h2>
				<p class="mt-2 flex-1 text-sm text-muted">{path.copy}</p>
				<div
					class="mt-4 font-mono text-xs uppercase tracking-wide text-tertiary-600 transition-colors duration-fast group-hover:text-tertiary-700 dark:text-tertiary-400 dark:group-hover:text-tertiary-300"
				>
					Email us →
				</div>
			</a>
		{/each}
	</section>

	<section class="border border-subtle bg-sunken px-5 py-4">
		<div class="data-label mb-2">Direct inbox</div>
		<a
			href={`mailto:${contactEmail}`}
			class="font-mono text-primary-700 underline decoration-tertiary-500 underline-offset-2 hover:text-primary-600 dark:text-primary-300 dark:hover:text-primary-400"
		>
			{contactEmail}
		</a>
		<p class="mt-3 text-sm text-muted">
			For corrections, include the location name and what changed. For new tips, a website link,
			address, and quick parent note are enough to start.
		</p>
	</section>
</div>
