<!-- src/routes/styleguide/+page.svelte -->
<script lang="ts">
	import { themePref, effectiveTheme } from '$lib/stores/themeStore';
	import ThemeToggle from '$lib/components/base/ThemeToggle.svelte';
	import SearchBar from '$lib/components/shared/SearchBar.svelte';
	import Pagination from '$lib/components/shared/Pagination.svelte';
	import ErrorState from '$lib/components/shared/ErrorState.svelte';
	import SkeletonCard from '$lib/components/shared/SkeletonCard.svelte';
	import { MapPinAltSolid } from 'flowbite-svelte-icons';

	const ramps = [
		{ name: 'primary', label: 'Forest Green' },
		{ name: 'secondary', label: 'Sandstone' },
		{ name: 'accent', label: 'Sky Blue' },
		{ name: 'tertiary', label: 'Rustic Orange · route marker' },
		{ name: 'neutral', label: 'Slate Gray' },
		{ name: 'danger', label: 'Rust Red · semantic' }
	];
	const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

	const surfaces = [
		{ name: 'page', label: 'bg-page', desc: 'Page background — kraft cardstock' },
		{ name: 'surface', label: 'bg-surface', desc: 'Cards, inputs (white index card)' },
		{ name: 'elevated', label: 'bg-elevated', desc: 'Modals, popovers' },
		{ name: 'sunken', label: 'bg-sunken', desc: 'Recessed areas' }
	];

	const semantics = [
		{ role: 'success', class: 'text-primary-700', label: 'Forest Green 700' },
		{ role: 'warning', class: 'text-tertiary-500', label: 'Tertiary 500' },
		{ role: 'danger', class: 'text-danger-500', label: 'Danger 500 (rust-red)' },
		{ role: 'info', class: 'text-accent-700', label: 'Accent 700' }
	];

	const typeSizes = [
		{ token: 'text-5xl', sample: 'Hero / Display', cls: 'text-5xl font-display font-extrabold' },
		{ token: 'text-4xl', sample: 'h1 — Page Title', cls: 'text-4xl font-display font-extrabold' },
		{ token: 'text-3xl', sample: 'h2 — Section', cls: 'text-3xl font-display font-bold' },
		{ token: 'text-2xl', sample: 'h3 — Subsection', cls: 'text-2xl font-display font-bold' },
		{ token: 'text-xl', sample: 'h4', cls: 'text-xl font-display font-bold' },
		{ token: 'text-lg', sample: 'Lead paragraph or button label', cls: 'text-lg font-medium' },
		{
			token: 'text-base',
			sample: 'Body — the workhorse of the app. Inter at 16px is what 95% of words sit at.',
			cls: 'text-base'
		},
		{ token: 'text-sm', sample: 'Secondary UI / metadata', cls: 'text-sm' },
		{ token: 'text-xs', sample: 'Captions / labels', cls: 'text-xs' }
	];

	const spacing = [
		{ token: 'space-0.5', px: '2', tw: 'h-0.5' },
		{ token: 'space-1', px: '4', tw: 'h-1' },
		{ token: 'space-2', px: '8', tw: 'h-2' },
		{ token: 'space-3', px: '12', tw: 'h-3' },
		{ token: 'space-4', px: '16', tw: 'h-4' },
		{ token: 'space-6', px: '24', tw: 'h-6' },
		{ token: 'space-8', px: '32', tw: 'h-8' },
		{ token: 'space-12', px: '48', tw: 'h-12' },
		{ token: 'space-16', px: '64', tw: 'h-16' },
		{ token: 'space-24', px: '96', tw: 'h-24' }
	];

	const radii = [
		{ token: 'radius-none', tw: 'rounded-none', px: '0' },
		{ token: 'radius-sm', tw: 'rounded-sm', px: '2' },
		{ token: 'radius-md', tw: 'rounded-md', px: '4' },
		{ token: 'radius-lg', tw: 'rounded-lg', px: '8' },
		{ token: 'radius-full', tw: 'rounded-full', px: '∞ (avatars only)' }
	];

	const shadows = [
		{ token: 'shadow-none', tw: 'shadow-none', desc: 'Default for static surfaces' },
		{ token: 'shadow-sm', tw: 'shadow-sm', desc: 'Tiny lift, focused inputs' },
		{ token: 'shadow-md', tw: 'shadow-md', desc: 'Hover state on interactive cards' },
		{ token: 'shadow-lg', tw: 'shadow-lg', desc: 'Popovers, dropdowns' },
		{ token: 'shadow-xl', tw: 'shadow-xl', desc: 'Modals, sheets' }
	];

	const durations = [
		{ token: 'duration-fast', value: '100ms', desc: 'Hovers, color shifts' },
		{ token: 'duration-base', value: '180ms', desc: 'Most state changes' },
		{ token: 'duration-slow', value: '280ms', desc: 'Modals, drawers' }
	];

	let demoBox = false;
	let demoSlow = false;

	let pageDemo = 3;
</script>

<svelte:head>
	<title>Style Guide · Tiny Tribe Adventures</title>
</svelte:head>

<main class="min-h-screen">
	<div class="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
		<!-- Header -->
		<header class="mb-12 border-b border-subtle pb-8">
			<div
				class="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted"
			>
				<MapPinAltSolid class="h-3.5 w-3.5 text-tertiary-500" />
				<span>Field guide · §00 · Style kit</span>
			</div>
			<div class="flex items-end justify-between gap-4">
				<div>
					<h1 class="font-display text-4xl text-primary-700 dark:text-primary-300">
						Tiny Tribe Style Kit
					</h1>
					<p class="mt-2 text-base text-muted">
						The source of truth. If a token isn't on this page, it doesn't exist.
					</p>
				</div>
				<ThemeToggle />
			</div>
			<p class="mt-3 font-mono text-xs uppercase tracking-wide text-muted">
				Theme · {$themePref} · effective: {$effectiveTheme}
			</p>
		</header>

		<!-- 1. BRAND PALETTE -->
		<section class="mb-16">
			<h2 class="mb-1 font-display text-2xl text-default">§01 Brand palette</h2>
			<p class="mb-6 text-sm text-muted">
				Five families, full 50→900 ramps, plus the new <code class="font-mono">danger</code> semantic
				ramp.
			</p>

			<div class="space-y-6">
				{#each ramps as ramp}
					<div>
						<div class="mb-2 flex items-baseline gap-3">
							<span class="font-display text-lg font-bold capitalize text-default">{ramp.name}</span
							>
							<span class="font-mono text-xs uppercase tracking-wide text-muted">{ramp.label}</span>
						</div>
						<div class="grid grid-cols-5 gap-1 sm:grid-cols-10">
							{#each shades as shade}
								<div class="border border-subtle">
									<div class="h-12 bg-{ramp.name}-{shade}" title={`${ramp.name}-${shade}`}></div>
									<div class="px-1 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
										{shade}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- 2. SURFACE TOKENS -->
		<section class="mb-16">
			<h2 class="mb-1 font-display text-2xl text-default">§02 Surface tokens</h2>
			<p class="mb-6 text-sm text-muted">
				Theme-aware. Same token, different value in dark mode (Dusk topo map).
			</p>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each surfaces as s}
					<div class="border border-subtle p-4 bg-{s.name}">
						<div class="font-mono text-xs uppercase tracking-wide text-muted">{s.label}</div>
						<div class="mt-2 text-sm text-default">{s.desc}</div>
					</div>
				{/each}
			</div>

			<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<div class="mb-2 font-mono text-xs uppercase tracking-wide text-muted">Borders</div>
					<div class="space-y-2">
						<div class="border border-subtle p-3 text-sm text-default">border-subtle</div>
						<div class="border border-strong p-3 text-sm text-default">border-strong</div>
					</div>
				</div>
				<div>
					<div class="mb-2 font-mono text-xs uppercase tracking-wide text-muted">Text</div>
					<div class="space-y-1">
						<div class="text-base text-default">text-default — Slate ink</div>
						<div class="text-base text-muted">text-muted — secondary</div>
						<div class="text-base text-subtle">text-subtle — tertiary</div>
						<div class="bg-primary-700 p-2 text-base text-white">text-on-primary</div>
					</div>
				</div>
			</div>
		</section>

		<!-- 3. SEMANTIC -->
		<section class="mb-16">
			<h2 class="mb-1 font-display text-2xl text-default">§03 Semantic colors</h2>
			<p class="mb-6 text-sm text-muted">Reuse the brand palette + one new rust-red for danger.</p>
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{#each semantics as s}
					<div class="border border-subtle bg-surface p-4">
						<div class={`text-xl font-bold ${s.class}`}>{s.role}</div>
						<div class="mt-1 font-mono text-xs uppercase tracking-wide text-muted">{s.label}</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- 4. TYPOGRAPHY -->
		<section class="mb-16">
			<h2 class="mb-1 font-display text-2xl text-default">§04 Typography</h2>
			<p class="mb-6 text-sm text-muted">
				Bitter (display) · Inter (body) · JetBrains Mono (data labels). Self-hosted variable fonts.
			</p>

			<div class="space-y-6 border border-subtle bg-surface p-6">
				{#each typeSizes as t}
					<div
						class="flex flex-col gap-1 border-b border-subtle pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:gap-6"
					>
						<div class="w-32 flex-shrink-0 font-mono text-xs uppercase tracking-wide text-muted">
							{t.token}
						</div>
						<div class={`${t.cls} text-default`}>{t.sample}</div>
					</div>
				{/each}
			</div>

			<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div class="border border-subtle bg-surface p-4">
					<div class="mb-2 font-mono text-xs uppercase tracking-wide text-muted">font-display</div>
					<div class="font-display text-2xl text-default">Bitter Variable</div>
				</div>
				<div class="border border-subtle bg-surface p-4">
					<div class="mb-2 font-mono text-xs uppercase tracking-wide text-muted">font-sans</div>
					<div class="text-2xl text-default">Inter Variable</div>
				</div>
				<div class="border border-subtle bg-surface p-4">
					<div class="mb-2 font-mono text-xs uppercase tracking-wide text-muted">font-mono</div>
					<div class="font-mono text-2xl text-default">38.9072°N</div>
				</div>
			</div>
		</section>

		<!-- 5. SPACING -->
		<section class="mb-16">
			<h2 class="mb-1 font-display text-2xl text-default">§05 Spacing scale</h2>
			<p class="mb-6 text-sm text-muted">
				4px base. 10 allowed steps. Bias toward smaller — field manuals are dense.
			</p>
			<div class="space-y-2 border border-subtle bg-surface p-4">
				{#each spacing as s}
					<div class="flex items-center gap-4">
						<div class="w-24 flex-shrink-0 font-mono text-xs uppercase tracking-wide text-muted">
							{s.token}
						</div>
						<div class={`${s.tw} bg-tertiary-500`}></div>
						<div class="font-mono text-xs text-muted">{s.px}px</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- 6. RADIUS -->
		<section class="mb-16">
			<h2 class="mb-1 font-display text-2xl text-default">§06 Radius scale</h2>
			<p class="mb-6 text-sm text-muted">
				Stamped &amp; sharp. Field manuals don't have rounded corners.
			</p>
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-5">
				{#each radii as r}
					<div class="text-center">
						<div
							class={`mx-auto mb-2 h-20 w-20 border border-strong bg-secondary-200 ${r.tw}`}
						></div>
						<div class="font-mono text-xs uppercase tracking-wide text-muted">{r.token}</div>
						<div class="font-mono text-xs text-subtle">
							{r.px}{typeof r.px === 'number' ? 'px' : ''}
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- 7. SHADOW -->
		<section class="mb-16">
			<h2 class="mb-1 font-display text-2xl text-default">§07 Shadow system</h2>
			<p class="mb-6 text-sm text-muted">
				Mostly off. Borders do the work. Warm green-tinted only for hover &amp; floating UI.
			</p>
			<div class="grid grid-cols-2 gap-6 sm:grid-cols-5">
				{#each shadows as s}
					<div class="text-center">
						<div class={`mx-auto mb-3 h-20 w-20 border border-subtle bg-surface ${s.tw}`}></div>
						<div class="font-mono text-xs uppercase tracking-wide text-muted">{s.token}</div>
						<div class="mt-1 text-xs text-subtle">{s.desc}</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- 8. MOTION -->
		<section class="mb-16">
			<h2 class="mb-1 font-display text-2xl text-default">§08 Motion</h2>
			<p class="mb-6 text-sm text-muted">Quiet, fast, functional. Click each box to trigger.</p>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{#each durations as d}
					<button
						type="button"
						class="border border-subtle bg-surface p-6 text-left"
						on:click={() => {
							demoBox = !demoBox;
						}}
					>
						<div class="font-mono text-xs uppercase tracking-wide text-muted">{d.token}</div>
						<div class="mt-2 text-base text-default">{d.value}</div>
						<div class="mt-1 text-xs text-subtle">{d.desc}</div>
					</button>
				{/each}
			</div>
			<div class="mt-6 flex items-center gap-4">
				<button
					type="button"
					on:click={() => (demoBox = !demoBox)}
					class="rounded-sm border border-subtle bg-surface px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-default transition-colors duration-fast hover:border-strong"
				>
					Toggle demo
				</button>
				<div
					class="h-12 w-12 border border-strong bg-tertiary-500 transition-transform duration-base ease-out-soft"
					style="transform: translateX({demoBox ? '120px' : '0'})"
				></div>
			</div>
		</section>

		<!-- 9. COMPONENTS -->
		<section class="mb-16">
			<h2 class="mb-1 font-display text-2xl text-default">§09 Base components</h2>
			<p class="mb-6 text-sm text-muted">
				Every base component, both states, both themes (toggle above).
			</p>

			<!-- Buttons -->
			<div class="mb-8 border border-subtle bg-surface p-6">
				<h3 class="mb-4 font-display text-lg text-default">Buttons</h3>
				<div class="flex flex-wrap gap-3">
					<button
						class="rounded-sm bg-primary-700 px-4 py-2 font-mono text-xs uppercase tracking-wide text-white transition-colors duration-fast hover:bg-primary-600 dark:bg-primary-500 dark:text-primary-50 dark:hover:bg-primary-400"
					>
						Primary
					</button>
					<button
						class="rounded-sm bg-tertiary-500 px-4 py-2 font-mono text-xs uppercase tracking-wide text-white transition-colors duration-fast hover:bg-tertiary-600"
					>
						Tertiary · go
					</button>
					<button
						class="rounded-sm border border-subtle bg-surface px-4 py-2 font-mono text-xs uppercase tracking-wide text-default transition-colors duration-fast hover:border-strong"
					>
						Secondary
					</button>
					<button
						class="rounded-sm border border-danger-300 bg-surface px-4 py-2 font-mono text-xs uppercase tracking-wide text-danger-700 transition-colors duration-fast hover:border-danger-500 dark:text-danger-300"
					>
						Danger
					</button>
				</div>
			</div>

			<!-- Stamped tags -->
			<div class="mb-8 border border-subtle bg-surface p-6">
				<h3 class="mb-4 font-display text-lg text-default">Stamped tags</h3>
				<div class="flex flex-wrap gap-2">
					<span class="stamped-tag">Outdoor</span>
					<span class="stamped-tag">Park</span>
					<span class="stamped-tag">Free</span>
					<span class="stamped-tag">0–9 yr</span>
					<span
						class="inline-flex items-center rounded-sm bg-tertiary-500 px-2 py-0.5 font-mono text-xs uppercase tracking-wide text-white"
					>
						Route marker
					</span>
				</div>
			</div>

			<!-- Mono data labels -->
			<div class="mb-8 border border-subtle bg-surface p-6">
				<h3 class="mb-4 font-display text-lg text-default">Data labels</h3>
				<div class="flex flex-wrap gap-4">
					<span class="data-label">38.9072°N, 77.0369°W</span>
					<span class="data-label">0.4 mi NW</span>
					<span class="data-label">Open · 9a — 5p</span>
					<span class="data-label">4 yr+</span>
				</div>
			</div>

			<!-- Search -->
			<div class="mb-8 border border-subtle bg-surface p-6">
				<h3 class="mb-4 font-display text-lg text-default">SearchBar</h3>
				<SearchBar placeholder="Search by name, city, or activity…" />
			</div>

			<!-- Pagination -->
			<div class="mb-8 border border-subtle bg-surface p-6">
				<h3 class="mb-4 font-display text-lg text-default">Pagination</h3>
				<Pagination
					currentPage={pageDemo}
					totalPages={9}
					totalItems={180}
					itemsPerPage={20}
					on:pageChange={(e) => (pageDemo = e.detail)}
				/>
			</div>

			<!-- Skeleton -->
			<div class="mb-8 border border-subtle bg-surface p-6">
				<h3 class="mb-4 font-display text-lg text-default">Skeletons</h3>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
					<SkeletonCard variant="card" />
					<SkeletonCard variant="card" />
					<SkeletonCard variant="card" />
				</div>
			</div>

			<!-- Error states -->
			<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<h3 class="mb-3 font-display text-lg text-default">Error · card</h3>
					<ErrorState
						variant="card"
						error="Network connection failed"
						title="Lost the trail"
						showRetry={true}
					/>
				</div>
				<div>
					<h3 class="mb-3 font-display text-lg text-default">Error · inline</h3>
					<ErrorState
						variant="inline"
						error="Validation failed"
						title="Heads up"
						showRetry={true}
					/>
				</div>
			</div>

			<!-- Empty state -->
			<div class="mb-8">
				<h3 class="mb-3 font-display text-lg text-default">Empty state</h3>
				<div class="border border-dashed border-strong bg-sunken px-6 py-12 text-center">
					<div class="mb-2 font-mono text-xs uppercase tracking-wide text-muted">
						No locations in this grid square
					</div>
					<p class="mb-4 text-base text-default">Adjust your filters to find more places.</p>
					<button
						class="rounded-sm bg-primary-700 px-4 py-2 font-mono text-xs uppercase tracking-wide text-white transition-colors duration-fast hover:bg-primary-600 dark:bg-primary-500 dark:text-primary-50 dark:hover:bg-primary-400"
					>
						Clear filters
					</button>
				</div>
			</div>
		</section>

		<footer class="mt-12 border-t border-subtle pt-6">
			<div class="font-mono text-xs uppercase tracking-wide text-muted">
				End of guide · Source: docs/design-system.md
			</div>
		</footer>
	</div>
</main>
