<!-- src/lib/components/base/Footer.svelte -->
<!--
	Minimal v1 footer. Compact on purpose — only links to routes that
	actually exist today (Home, Locations, About).

	Future sections to add as routes ship (do not add until they're real):
	  · §01 Explore — /map, /locations/states ("by state")
	  · §02 Project — /contact, /blog ("field notes")
	  · §03 Reference — /styleguide, /sitemap.xml
	  · §04 Coverage — full DC/MD/VA/DE card grid (currently inlined as one line)
	  · Newsletter / "join the tribe" signup
	  · Social links once we have any
-->
<script lang="ts">
	import { MapPinAltSolid } from 'flowbite-svelte-icons';

	const year = new Date().getFullYear();

	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/locations', label: 'Locations' },
		{ href: '/about', label: 'About' }
	];
</script>

<footer class="border-t border-subtle bg-sunken text-default" aria-labelledby="site-footer-heading">
	<h2 id="site-footer-heading" class="sr-only">Site footer</h2>

	<div class="mx-auto w-full max-w-[1350px] px-4 py-8 sm:px-6 lg:px-8">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<a href="/" class="inline-flex items-center gap-2">
				<img src="/myth-map-small.svg" class="h-8 w-auto" alt="" aria-hidden="true" />
				<span class="font-display text-base font-bold text-primary-700 dark:text-primary-300">
					Tiny Tribe Adventures
				</span>
			</a>

			<nav aria-label="Footer">
				<ul class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
					{#each links as link}
						<li>
							<a
								href={link.href}
								class="text-default transition-colors duration-fast hover:text-primary-700 dark:hover:text-primary-300"
							>
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		</div>

		<div
			class="mt-6 flex flex-col gap-2 border-t border-subtle pt-4 font-mono text-xs uppercase tracking-wide text-muted sm:flex-row sm:items-center sm:justify-between"
		>
			<div class="flex items-center gap-2">
				<MapPinAltSolid class="h-3.5 w-3.5 text-tertiary-500" />
				<span>DC · MD · VA · DE · {year}</span>
			</div>
			<div>Built parent-to-parent · A field guide to the DMV</div>
		</div>
	</div>
</footer>
