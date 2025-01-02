<!-- src/lib/components/TableDetail.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { censusService } from '$lib/services/census';
	import type { TableDataResponse, MetadataResponse } from '$lib/types/census';

	export let tableId: string;
	export let geographyId: string = '040XX00US24';

	let loading = true;
	let error = '';
	let tableData: TableDataResponse | null = null;
	let metadata: MetadataResponse | null = null;
	let structuredData: any = null;

	async function loadTableData() {
		try {
			loading = true;
			error = '';
			tableData = null;
			metadata = null;

			const [dataResponse, metadataResponse] = await Promise.all([
				censusService.getTableData(tableId, geographyId),
				censusService.getTableMetadata(tableId, geographyId)
			]);

			tableData = dataResponse;
			metadata = metadataResponse;

			// Structure the data
			structureData();
		} catch (e) {
			console.error('Error loading table data:', e);
			error = 'Failed to load table data. Please try again.';
		} finally {
			loading = false;
		}
	}

	function structureData() {
		if (!tableData?.response?.data || !metadata?.response?.metadataContent?.measures) return;

		const data = tableData.response.data;
		const measures = metadata.response.metadataContent.measures;

		// Group metrics by their category (using the label structure)
		const categories = new Map();

		data[0].forEach((metricId, index) => {
			const value = data[1][index];
			const measure = measures.find((m) => m.id === metricId);
			if (!measure) return;

			const label = measure.label;
			// Split label by '!!' to get category hierarchy
			const parts = label.split('!!');
			const category = parts[1] || 'General';
			const subcategory = parts[2] || 'Main';
			const metricName = parts[parts.length - 1];

			if (!categories.has(category)) {
				categories.set(category, new Map());
			}

			const categoryMap = categories.get(category);
			if (!categoryMap.has(subcategory)) {
				categoryMap.set(subcategory, []);
			}

			categoryMap.get(subcategory).push({
				id: metricId,
				name: metricName,
				value: formatValue(value),
				unit: measure.unit_type?.unit_type_label
			});
		});

		structuredData = categories;
	}

	function formatValue(value: any): string {
		if (value === null || value === undefined) return 'N/A';
		if (value === '(X)') return 'Not Applicable';
		if (value === 'N') return 'Too Few Samples';
		if (typeof value === 'number') {
			if (Number.isInteger(value)) {
				return value.toLocaleString();
			}
			return value.toLocaleString(undefined, {
				minimumFractionDigits: 1,
				maximumFractionDigits: 1
			});
		}
		return value.toString();
	}

	$: if (tableId) {
		loadTableData();
	}
</script>

<div class="space-y-6">
	{#if loading}
		<div class="flex items-center justify-center p-12">
			<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
		</div>
	{:else if error}
		<div class="rounded-lg bg-red-50 p-4 text-red-700">
			{error}
			<button class="mt-2 text-sm underline hover:no-underline" on:click={loadTableData}>
				Try Again
			</button>
		</div>
	{:else if tableData && metadata && structuredData}
		<!-- Info Section -->
		<div class="mb-6 rounded-lg bg-gray-50 p-4">
			<h3 class="font-medium text-gray-900">{metadata.response.metadataContent.title}</h3>
			<div class="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
				<div>
					<p>Dataset: {metadata.response.metadataContent.dataset.name}</p>
					<p>Vintage: {metadata.response.metadataContent.dataset.vintage}</p>
				</div>
				<div>
					<p>Geography: Maryland</p>
					<p>Table ID: {tableId}</p>
				</div>
			</div>
		</div>

		<!-- Data Tables -->
		{#each [...structuredData] as [category, subcategories]}
			<div class="mb-8">
				<h3 class="mb-4 text-lg font-semibold">{category}</h3>

				{#each [...subcategories] as [subcategory, metrics]}
					<div class="mb-6">
						{#if subcategory !== 'Main'}
							<h4 class="text-md mb-2 font-medium text-gray-700">{subcategory}</h4>
						{/if}

						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										{#each metrics as metric}
											<th
												class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
											>
												{metric.name}
												{#if metric.unit !== 'NUM' && metric.unit !== 'NAN'}
													<span class="text-gray-400">({metric.unit})</span>
												{/if}
											</th>
										{/each}
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-200 bg-white">
									<tr>
										{#each metrics as metric}
											<td class="px-6 py-4 font-mono text-sm text-gray-900">
												{metric.value}
											</td>
										{/each}
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				{/each}
			</div>
		{/each}

		<!-- Notes Section -->
		{#if metadata.response.metadataContent.notes?.length}
			<div class="mt-8 border-t pt-6">
				<h3 class="mb-4 font-medium text-gray-900">Notes</h3>
				<div class="space-y-4 text-sm text-gray-600">
					{#each metadata.response.metadataContent.notes as note}
						{#if !note.hidden}
							<div class="prose prose-sm max-w-none">
								{@html note.content}
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
