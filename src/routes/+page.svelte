<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import { derived, writable } from 'svelte/store';

	import { LazyMap, preloadCriticalComponents } from '$lib/utils/lazyComponents';
	import { filterService } from '$lib/services/filterService';

	const { componentStore: mapComponentStore, load: loadMap } = LazyMap;
	import LocationCard from '$lib/components/locations/LocationCard.svelte';
	import LocationFilters from '$lib/components/locations/LocationFilters.svelte';
	import GeoFilters from '$lib/components/locations/GeoFilters.svelte';
	import SkeletonCard from '$lib/components/shared/SkeletonCard.svelte';
	import ErrorState from '$lib/components/shared/ErrorState.svelte';
	import SEOHead from '$lib/components/shared/SEOHead.svelte';
	import SearchBar from '$lib/components/shared/SearchBar.svelte';
	import Pagination from '$lib/components/shared/Pagination.svelte';
	import { InfoCircleSolid, MapPinAltSolid } from 'flowbite-svelte-icons';
	import type { PageData } from './$types';
	import { currentLocation } from '$lib/stores/locationStore';
	import { dataManager } from '$lib/stores/dataManager';
	import { userPreferences } from '$lib/stores/userPreferencesStore';
	import { locationFocus } from '$lib/stores/locationFocusStore';

	export let data: PageData;

	const prefs = userPreferences.getPreferences();

	type ViewMode = 'list' | 'split' | 'map';

	function normalizeView(raw: string | undefined): ViewMode {
		if (raw === 'split' || raw === 'map' || raw === 'list') return raw;
		// Legacy 'gallery' → 'list'.
		return 'list';
	}

	let showFilterRestoreNotice = false;

	let initialFilterState = {
		selectedTags: prefs.preferredTags,
		selectedState: prefs.defaultState,
		selectedCity: prefs.defaultCity,
		searchQuery: ''
	};

	if (userPreferences.shouldRestoreFilters()) {
		const lastState = userPreferences.getLastFilterState();
		if (lastState) {
			initialFilterState = lastState;
			showFilterRestoreNotice = true;
		}
	}

	const selectedTags = writable<string[]>(initialFilterState.selectedTags);
	const selectedState = writable<{ name: string; abr: string } | null>(
		initialFilterState.selectedState
	);
	const selectedCity = writable<string | null>(initialFilterState.selectedCity);
	const searchQuery = writable<string>(initialFilterState.searchQuery);

	let userLocation: { lat: number; lng: number } | null = null;
	let innerWidth = 0;
	let isLoading = true;
	let hasError = false;
	let errorMessage = '';

	let currentPage = 1;
	let itemsPerPage = prefs.itemsPerPage;

	// Resolved view mode. Mobile/tablet collapse 'split' to 'list' so the card
	// column stays usable; the user's preference is preserved verbatim.
	let storedView: ViewMode = normalizeView(prefs.defaultView);
	$: isDesktop = innerWidth >= 1024;
	$: viewMode = !isDesktop && storedView === 'split' ? 'list' : storedView;

	const unsubscribeLocation = currentLocation.subscribe((value) => (userLocation = value));

	const filteredLocations = derived(
		[selectedTags, selectedState, selectedCity, searchQuery],
		([$selectedTags, $selectedState, $selectedCity, $searchQuery]) =>
			filterService.getFilteredLocations(
				data.locations,
				{
					selectedTags: $selectedTags,
					selectedState: $selectedState,
					selectedCity: $selectedCity,
					searchQuery: $searchQuery
				},
				data.locationTags
			)
	);

	const availableTags = derived([selectedState, selectedCity], ([$selectedState, $selectedCity]) =>
		filterService.getAvailableTags(data.locations, data.locationTags, $selectedState, $selectedCity)
	);

	$: shownLocations = $filteredLocations.filter(
		(l) => l?.location?.lat != null && l?.location?.lng != null
	);
	$: availableTagsMap = $availableTags;
	$: totalFilteredItems = shownLocations.length;
	$: totalPages = Math.max(1, Math.ceil(totalFilteredItems / itemsPerPage));
	$: if (currentPage > totalPages) currentPage = 1;
	$: paginatedLocations = shownLocations.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	$: stateAbbrs = (() => {
		const set = new Set<string>();
		for (const l of data.locations as Array<{ location?: { state?: string | null } }>) {
			const abr = l?.location?.state;
			if (abr) set.add(abr);
		}
		return [...set].sort();
	})();

	$: hasActiveFilters =
		$selectedTags.length > 0 || !!$selectedState || !!$selectedCity || !!$searchQuery;

	let filterPersistenceCleanup: (() => void) | null = null;

	onMount(() => {
		try {
			dataManager.cacheServerData({
				locations: data.locations,
				tags: data.tags,
				locationTags: data.locationTags
			});

			if (!data.locations) {
				throw new Error('Failed to load location data');
			}

			isLoading = false;

			// First-visit defaults: split on desktop, list on smaller screens.
			if (!prefs.defaultView || prefs.defaultView === 'gallery') {
				storedView = window.matchMedia('(min-width: 1024px)').matches ? 'split' : 'list';
			}

			if (storedView === 'map' || storedView === 'split') loadMap();

			userPreferences.updateActivityTime();
			filterPersistenceCleanup = setupFilterPersistence();
			preloadCriticalComponents();
		} catch (error) {
			console.error('Error loading page data:', error);
			hasError = true;
			errorMessage = error instanceof Error ? error.message : 'Failed to load data';
			isLoading = false;
		}

		return () => {
			filterPersistenceCleanup?.();
			unsubscribeLocation();
			locationFocus.clear();
		};
	});

	function handleTagFilterChange(event: CustomEvent) {
		selectedTags.set(event.detail);
		currentPage = 1;
		userPreferences.updatePreference('preferredTags', event.detail);
	}

	function handleGeoFilterChange(event: CustomEvent) {
		const { state, city } = event.detail;
		selectedState.set(state);
		selectedCity.set(city);
		currentPage = 1;
		userPreferences.updatePreferences({ defaultState: state, defaultCity: city });
		selectedTags.update((currentTags) => currentTags.filter((tag) => availableTagsMap[tag]));
	}

	async function setView(next: ViewMode) {
		storedView = next;
		userPreferences.updatePreference('defaultView', next);
		if (next === 'map' || next === 'split') {
			await loadMap();
		}
	}

	function clearAllFilters() {
		selectedTags.set([]);
		selectedState.set(null);
		selectedCity.set(null);
		searchQuery.set('');
		currentPage = 1;
		showFilterRestoreNotice = false;
		userPreferences.clearFilterState();
	}

	function handleSearch(event: CustomEvent) {
		const query = event.detail;
		searchQuery.set(query);
		currentPage = 1;
		if (query.trim()) {
			userPreferences.addSearchTerm(query.trim());
		}
	}

	function handlePageChange(event: CustomEvent) {
		currentPage = event.detail;
		document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
	}

	function retryLoadData() {
		hasError = false;
		errorMessage = '';
		isLoading = true;
		window.location.reload();
	}

	function setupFilterPersistence() {
		const unsubscribers = [
			selectedTags.subscribe(() => saveCurrentFilterState()),
			selectedState.subscribe(() => saveCurrentFilterState()),
			selectedCity.subscribe(() => saveCurrentFilterState()),
			searchQuery.subscribe(() => saveCurrentFilterState())
		];
		return () => unsubscribers.forEach((unsub) => unsub());
	}

	function saveCurrentFilterState() {
		userPreferences.saveFilterState({
			selectedTags: $selectedTags,
			selectedState: $selectedState,
			selectedCity: $selectedCity,
			searchQuery: $searchQuery
		});
		userPreferences.updateActivityTime();
	}

	// --- Cross-highlight: when a pin is clicked, scroll the matching card
	// into view (paginating to its page if needed). The card's `.is-selected`
	// CSS handles the visual flash.
	let cardListEl: HTMLElement;

	async function focusCardById(id: string | number) {
		const idx = shownLocations.findIndex((l) => {
			const lid = l?.location?.id ?? l?.id;
			return lid != null && lid === id;
		});
		if (idx === -1) return;
		const targetPage = Math.floor(idx / itemsPerPage) + 1;
		if (targetPage !== currentPage) currentPage = targetPage;
		await tick();
		const el = cardListEl?.querySelector<HTMLElement>(`[data-location-id="${id}"]`);
		el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}

	function handlePinClick(event: CustomEvent<{ id: string | number }>) {
		focusCardById(event.detail.id);
	}

	// Subscribe so a programmatic select (from anywhere) also scrolls.
	let lastSelected: string | number | null = null;
	$: if (
		$locationFocus.selected != null &&
		$locationFocus.selected !== lastSelected &&
		!isLoading
	) {
		lastSelected = $locationFocus.selected;
		focusCardById($locationFocus.selected);
	}
</script>

<SEOHead
	title="Tiny Tribe Adventures — Family-tested places for when you need ideas"
	description="A curated guide to family-friendly adventures in Maryland, Virginia, Delaware, and DC. Built parent-to-parent."
	canonical="/"
	keywords="family activities, kids activities, Maryland activities, Virginia family fun, Delaware attractions, DC family activities, playgrounds, museums"
	structuredData={{
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'Tiny Tribe Adventures',
		description: 'Family-tested places for when you need ideas.',
		url: 'https://tinytribeadventures.com'
	}}
/>

<svelte:window bind:innerWidth />

<div class="page-container--wide pb-12">
	<!-- ─── Field-manual header ──────────────────────────────────── -->
	<header class="mb-6 border-b border-subtle pb-6 md:mb-8 md:pb-8">
		<div class="data-label mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
			<span class="inline-flex items-center gap-1.5">
				<MapPinAltSolid class="h-3.5 w-3.5 text-tertiary-500" />
				Field guide
			</span>
			<span aria-hidden="true" class="text-subtle">·</span>
			<span>{stateAbbrs.join(' / ') || 'DC / MD / VA / DE'}</span>
			<span aria-hidden="true" class="text-subtle">·</span>
			<span>{data.locations.length} entries</span>
		</div>

		<h1
			class="font-display text-3xl font-extrabold tracking-tight text-primary-700 dark:text-primary-300 sm:text-4xl md:text-5xl"
		>
			Family-tested places for when you need ideas.
		</h1>

		<p class="mt-3 max-w-2xl text-base text-default sm:text-lg">
			A curated, parent-to-parent guide to weekend adventures across DC, Maryland, Virginia, and
			Delaware. Filter the list, pan the map, find your next Saturday.
		</p>

		<!-- Stat strip — same hairline-grid pattern as /locations -->
		<dl
			class="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-subtle bg-[var(--border-subtle)]"
		>
			<div class="bg-surface px-3 py-3 sm:px-4">
				<dt class="data-label">Locations</dt>
				<dd
					class="mt-1 font-display text-xl font-bold text-primary-700 dark:text-primary-300 sm:text-2xl"
				>
					{data.locations.length}
				</dd>
			</div>
			<div class="bg-surface px-3 py-3 sm:px-4">
				<dt class="data-label">States</dt>
				<dd
					class="mt-1 font-display text-xl font-bold text-primary-700 dark:text-primary-300 sm:text-2xl"
				>
					{stateAbbrs.length}
				</dd>
			</div>
			<div class="bg-surface px-3 py-3 sm:px-4">
				<dt class="data-label">Showing</dt>
				<dd
					class="mt-1 font-display text-xl font-bold text-primary-700 dark:text-primary-300 sm:text-2xl"
				>
					{totalFilteredItems}
				</dd>
			</div>
		</dl>
	</header>

	<!-- ─── Search ─────────────────────────────────────────────── -->
	<div class="mb-4">
		<SearchBar
			placeholder="Search by name, city, or activity type…"
			value={$searchQuery}
			on:search={handleSearch}
			size="md"
		/>
	</div>

	{#if showFilterRestoreNotice}
		<div
			class="mb-4 flex items-center justify-between rounded-sm border border-accent-200 bg-accent-50 px-4 py-3 text-accent-800 dark:border-accent-800 dark:bg-accent-900/20 dark:text-accent-300"
			transition:fade={{ duration: 150 }}
		>
			<div class="flex items-center gap-2">
				<InfoCircleSolid class="h-4 w-4" />
				<span class="text-sm">Your previous filters have been restored</span>
			</div>
			<button
				on:click={() => (showFilterRestoreNotice = false)}
				class="text-sm font-medium underline-offset-2 hover:underline"
			>
				Dismiss
			</button>
		</div>
	{/if}

	<!-- ─── Filter rail (always visible, regardless of view mode) ─── -->
	<div class="mb-4 space-y-3">
		<LocationFilters
			allTags={data.tags}
			selectableTagsMap={availableTagsMap}
			selectedTags={$selectedTags}
			on:filterChange={handleTagFilterChange}
		/>
		<GeoFilters
			on:filterChange={handleGeoFilterChange}
			{shownLocations}
			selectedState={$selectedState}
			selectedCity={$selectedCity}
		/>
	</div>

	<!-- ─── Status row + view toggle ────────────────────────────── -->
	<div
		class="mb-4 flex flex-col-reverse gap-3 border-y border-subtle py-3 sm:flex-row sm:items-center sm:justify-between"
	>
		<div class="data-label flex flex-wrap items-center gap-x-3 gap-y-1">
			{#if hasActiveFilters}
				<span>{totalFilteredItems} / {data.locations.length} locations</span>
				{#if totalPages > 1 && (viewMode === 'list' || viewMode === 'split')}
					<span aria-hidden="true" class="text-subtle">·</span>
					<span>Page {currentPage} of {totalPages}</span>
				{/if}
				<button
					on:click={clearAllFilters}
					class="ml-1 rounded-sm border border-subtle bg-surface px-2 py-0.5 text-default hover:border-strong hover:text-tertiary-700 dark:hover:text-tertiary-300"
				>
					Clear filters
				</button>
			{:else}
				<span>{totalFilteredItems} entries</span>
				{#if totalPages > 1 && (viewMode === 'list' || viewMode === 'split')}
					<span aria-hidden="true" class="text-subtle">·</span>
					<span>Page {currentPage} of {totalPages}</span>
				{/if}
			{/if}
		</div>

		<!-- Stamped segmented control -->
		<div
			class="view-toggle inline-flex self-start rounded-sm border border-subtle bg-surface p-0.5 sm:self-auto"
			role="tablist"
			aria-label="View mode"
		>
			<button
				type="button"
				role="tab"
				aria-selected={viewMode === 'list'}
				class:active={viewMode === 'list'}
				on:click={() => setView('list')}
			>
				List
			</button>
			{#if isDesktop}
				<button
					type="button"
					role="tab"
					aria-selected={viewMode === 'split'}
					class:active={viewMode === 'split'}
					on:click={() => setView('split')}
				>
					Split
				</button>
			{/if}
			<button
				type="button"
				role="tab"
				aria-selected={viewMode === 'map'}
				class:active={viewMode === 'map'}
				on:click={() => setView('map')}
			>
				Map
			</button>
		</div>
	</div>

	<!-- ─── Main content ────────────────────────────────────────── -->
	{#if hasError}
		<ErrorState
			error={errorMessage}
			title="Unable to load locations"
			onRetry={retryLoadData}
			variant="card"
		/>
	{:else if viewMode === 'map'}
		<section class="map-pane">
			{#if $mapComponentStore}
				<svelte:component
					this={$mapComponentStore}
					locations={data.locations}
					{shownLocations}
					currentLocation={userLocation}
					selectedState={$selectedState}
					selectedCity={$selectedCity}
					on:pinclick={handlePinClick}
				/>
			{:else}
				<div
					class="flex h-full w-full animate-pulse items-center justify-center rounded-sm border border-subtle bg-sunken"
				>
					<div class="text-center">
						<div class="mx-auto mb-3 h-10 w-10 rounded-sm bg-secondary-200"></div>
						<div class="mx-auto h-3 w-24 rounded-sm bg-secondary-200"></div>
					</div>
				</div>
			{/if}
		</section>
	{:else if viewMode === 'split'}
		<!-- Two-column field-guide spread: scrollable card column + sticky map -->
		<section class="split-pane">
			<div class="card-column" id="results-section" bind:this={cardListEl}>
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
					{#if isLoading}
						{#each Array(6) as _, i (i)}
							<SkeletonCard variant="card" />
						{/each}
					{:else}
						{#each paginatedLocations as content_location (content_location.location.id ?? content_location.location.name)}
							<LocationCard
								name={content_location.location.name}
								coords={{
									lat: Number(content_location.location.lat),
									lng: Number(content_location.location.lng)
								}}
								address={`${content_location.location.address_line_1 ?? ''}${content_location.location.address_line_2 ? ` ${content_location.location.address_line_2}` : ''}, ${content_location.location.city}, ${content_location.location.state} ${content_location.location.zip_code ?? ''}`}
								website={content_location.website ?? ''}
								tags={data.locationTags.filter(
									(tag) => tag.location.name === content_location.location.name
								)}
								contentLocation={content_location}
							/>
						{/each}
					{/if}
				</div>

				{#if !isLoading && totalFilteredItems === 0}
					<div class="mt-6 border border-dashed border-strong bg-sunken px-6 py-12 text-center">
						<div class="data-label mb-2">No locations in this grid square</div>
						<p class="mb-4 text-base text-default">Adjust your filters to find more places.</p>
						<button
							on:click={clearAllFilters}
							class="rounded-sm bg-primary-700 px-4 py-2 font-mono text-xs uppercase tracking-wide text-white transition-colors duration-fast hover:bg-primary-600 dark:bg-primary-500 dark:text-primary-50 dark:hover:bg-primary-400"
						>
							Clear filters
						</button>
					</div>
				{:else if !isLoading && totalPages > 1}
					<div class="mt-6">
						<Pagination
							{currentPage}
							{totalPages}
							totalItems={totalFilteredItems}
							{itemsPerPage}
							on:pageChange={handlePageChange}
						/>
					</div>
				{/if}
			</div>

			<aside class="map-column">
				<div class="map-sticky">
					{#if $mapComponentStore}
						<svelte:component
							this={$mapComponentStore}
							locations={data.locations}
							{shownLocations}
							currentLocation={userLocation}
							selectedState={$selectedState}
							selectedCity={$selectedCity}
							on:pinclick={handlePinClick}
						/>
					{:else}
						<div
							class="flex h-full w-full animate-pulse items-center justify-center rounded-sm border border-subtle bg-sunken"
						>
							<div class="text-center">
								<div class="mx-auto mb-3 h-10 w-10 rounded-sm bg-secondary-200"></div>
								<div class="mx-auto h-3 w-24 rounded-sm bg-secondary-200"></div>
							</div>
						</div>
					{/if}
				</div>
			</aside>
		</section>
	{:else}
		<!-- viewMode === 'list' -->
		<section id="results-section" class="space-y-6" bind:this={cardListEl}>
			<div
				class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
			>
				{#if isLoading}
					{#each Array(8) as _, i (i)}
						<SkeletonCard variant="card" />
					{/each}
				{:else}
					{#each paginatedLocations as content_location (content_location.location.id ?? content_location.location.name)}
						<LocationCard
							name={content_location.location.name}
							coords={{
								lat: Number(content_location.location.lat),
								lng: Number(content_location.location.lng)
							}}
							address={`${content_location.location.address_line_1 ?? ''}${content_location.location.address_line_2 ? ` ${content_location.location.address_line_2}` : ''}, ${content_location.location.city}, ${content_location.location.state} ${content_location.location.zip_code ?? ''}`}
							website={content_location.website ?? ''}
							tags={data.locationTags.filter(
								(tag) => tag.location.name === content_location.location.name
							)}
							contentLocation={content_location}
						/>
					{/each}
				{/if}
			</div>

			{#if !isLoading && totalFilteredItems === 0}
				<div class="border border-dashed border-strong bg-sunken px-6 py-12 text-center">
					<div class="data-label mb-2">No locations in this grid square</div>
					<p class="mb-4 text-base text-default">Adjust your filters to find more places.</p>
					<button
						on:click={clearAllFilters}
						class="rounded-sm bg-primary-700 px-4 py-2 font-mono text-xs uppercase tracking-wide text-white transition-colors duration-fast hover:bg-primary-600 dark:bg-primary-500 dark:text-primary-50 dark:hover:bg-primary-400"
					>
						Clear filters
					</button>
				</div>
			{:else if !isLoading && totalPages > 1}
				<Pagination
					{currentPage}
					{totalPages}
					totalItems={totalFilteredItems}
					{itemsPerPage}
					on:pageChange={handlePageChange}
				/>
			{/if}
		</section>
	{/if}
</div>

<style>
	/* ─── Stamped segmented view-mode toggle ─────────────────── */
	.view-toggle button {
		font-family: theme('fontFamily.mono');
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted);
		padding: 0.375rem 0.75rem;
		border-radius: 2px;
		background: transparent;
		transition:
			background-color 100ms cubic-bezier(0.22, 1, 0.36, 1),
			color 100ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.view-toggle button:hover {
		color: var(--text-default);
		background: var(--surface-sunken);
	}

	.view-toggle button.active {
		color: #fff;
		background: theme('colors.primary.700');
	}

	:global(.dark) .view-toggle button.active {
		background: theme('colors.primary.500');
		color: theme('colors.primary.50');
	}

	/* ─── Map-only pane ─────────────────────────────────────── */
	.map-pane {
		height: 60vh;
		min-height: 420px;
		max-height: 760px;
		border: 1px solid var(--border-subtle);
		border-radius: 4px;
		overflow: hidden;
	}

	@media (min-width: 768px) {
		.map-pane {
			height: 70vh;
		}
	}

	/* ─── Split layout (desktop only — sticky map, scrollable cards) ─ */
	.split-pane {
		display: grid;
		grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
		gap: 1.25rem;
		align-items: start;
	}

	@media (min-width: 1280px) {
		.split-pane {
			grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
			gap: 1.5rem;
		}
	}

	.card-column {
		min-width: 0;
	}

	.map-column {
		position: sticky;
		top: 1rem;
		min-width: 0;
		/* Fills remaining viewport height so the map feels like a full pane. */
		height: calc(100vh - 7rem);
		min-height: 480px;
		max-height: 880px;
	}

	.map-sticky {
		height: 100%;
		border: 1px solid var(--border-subtle);
		border-radius: 4px;
		overflow: hidden;
	}
</style>
