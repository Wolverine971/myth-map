<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { writable } from 'svelte/store';
	import SearchHeader from '$lib/components/SearchHeader.svelte';
	import { fade } from 'svelte/transition';
	import { censusService } from '$lib/services/census';
	import TableDetail from '$lib/components/TableDetail.svelte';
	import BModal from '$lib/components/shared/BModal.svelte';

	// Create stores for reactive state
	const searchResults = writable([]);
	const featuredResults = writable(null);
	let searchQuery = '';
	let loading = false;
	let error = '';
	let selectedProgram = 'all';

	// Define programs with correct mapping
	const programs = [
		{ id: 'all', name: 'All Programs' },
		{ id: 'dec', name: 'Decennial Census', match: 'Decennial Census' },
		{ id: 'acs', name: 'American Community Survey', match: 'American Community Survey' },
		{ id: 'pop', name: 'Population Estimates', match: 'Population Estimates' }
	];

	let selectedTableId: string | null = null;

	let modalOpen = false;

	function handleCloseModal() {
		modalOpen = false;
	}

	function handleTableClick(tableId: string) {
		selectedTableId = tableId;
		modalOpen = true;
		console.log('Selected Table:', tableId); // Debug log
	}

	async function handleSearch(event: CustomEvent<string>) {
		const query = event.detail;
		console.log('Searching for:', query); // Debug log

		try {
			loading = true;
			error = '';

			const response = await censusService.search({
				q: query,
				size: 50
			});

			console.log('Raw API Response:', response); // Debug log

			// Update stores with new data
			searchResults.set(response.response?.tables?.tables || []);
			featuredResults.set(response.featuredresults);

			console.log('Updated searchResults:', $searchResults); // Debug log
		} catch (e) {
			error = 'Failed to fetch search results. Please try again.';
			console.error('Search error:', e);
		} finally {
			loading = false;
		}
	}

	// Reactive filtered results
	$: filteredResults = getFilteredResults($searchResults, selectedProgram);
	$: console.log('Selected Program:', selectedProgram); // Debug log
	$: console.log('Filtered Results:', filteredResults); // Debug log

	// Filtering function
	function getFilteredResults(results: any[], program: string) {
		console.log('Filtering results:', { results, program }); // Debug log

		if (!results || results.length === 0) return [];
		if (program === 'all') return results;

		const programMatch = programs.find((p) => p.id === program)?.match;
		if (!programMatch) return results;

		return results.filter((table) => table.program === programMatch);
	}
</script>

<div class="min-h-screen w-full bg-gray-50">
	<SearchHeader bind:value={searchQuery} {loading} {error} on:search={handleSearch} />

	<main class="mx-auto w-10 w-full max-w-6xl px-4 py-6">
		<!-- Featured Result -->
		{#if searchQuery && $featuredResults}
			<div class="mb-8" transition:fade>
				<div class="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm">
					<h2 class="mb-4 text-xl font-semibold">Featured Result</h2>
					<div class="grid gap-6 md:grid-cols-2">
						<div>
							<p class="text-3xl font-bold text-blue-700">
								{$featuredResults.estimate}
							</p>
							<p class="mt-1 text-gray-600">
								{$featuredResults.label}
							</p>
						</div>
						<div class="space-y-2">
							<p class="text-sm text-gray-600">
								Location: {$featuredResults.geoName}
							</p>
							<p class="text-sm text-gray-600">
								Source: {$featuredResults.dataSource}
							</p>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Program Filter -->
		{#if $searchResults.length > 0}
			<div class="mb-6">
				<div class="flex flex-wrap gap-2">
					{#each programs as program}
						<button
							class="rounded-full px-4 py-2 text-sm font-medium transition-colors
                {selectedProgram === program.id
								? 'bg-blue-100 text-blue-800'
								: 'bg-white text-gray-600 hover:bg-gray-100'}"
							on:click={() => {
								console.log('Changing program to:', program.id); // Debug log
								selectedProgram = program.id;
							}}
						>
							{program.name}
							<!-- Show count of results for each program -->
							{#if program.id !== 'all'}
								<span class="ml-2 text-xs">
									({getFilteredResults($searchResults, program.id).length})
								</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Results Display -->
		{#if loading}
			<div class="space-y-4">
				{#each Array(3) as _}
					<div class="animate-pulse rounded-lg bg-white p-6 shadow-sm">
						<div class="mb-4 h-4 w-3/4 rounded bg-gray-200"></div>
						<div class="h-4 w-1/2 rounded bg-gray-200"></div>
					</div>
				{/each}
			</div>
		{:else if filteredResults.length > 0}
			<div class="space-y-4">
				{#each filteredResults as table (table.table)}
					<div
						class="cursor-pointer rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md"
						on:click={() => handleTableClick(table.instances[0].id)}
						transition:fade
					>
						<div class="p-6">
							<div class="mb-4">
								<h3 class="text-lg font-medium">Table: {table.table}</h3>
								<p class="text-gray-600">Program: {table.program}</p>
							</div>

							<div class="space-y-4">
								{#each table.instances as instance}
									<div class="border-t pt-4">
										<h4 class="font-medium">{instance.description}</h4>
										<div class="mt-2 space-y-1">
											<p class="text-sm text-gray-600">ID: {instance.id}</p>
											<p class="text-sm text-gray-600">Dataset: {instance.dataset}</p>
											<div class="mt-2 flex gap-2">
												<span class="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
													{instance.vintage}
												</span>
												<span class="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800">
													{instance.type}
												</span>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else if searchQuery && !loading}
			<div class="py-12 text-center text-gray-500">No results found for the selected program</div>
		{:else}
			<div class="py-12 text-center text-gray-500">Enter a search term and click Search</div>
		{/if}
	</main>
</div>

{#if selectedTableId}
	<BModal open={modalOpen} title="Census Data Details" on:close={handleCloseModal}>
		<TableDetail tableId={selectedTableId} />
	</BModal>
{/if}

<style>
	:global(body) {
		@apply bg-gray-50;
	}
</style>
