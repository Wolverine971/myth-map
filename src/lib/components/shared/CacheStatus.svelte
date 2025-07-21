<!-- src/lib/components/shared/CacheStatus.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { cacheManager } from '$lib/stores/cacheStore';
	import { dataManager } from '$lib/stores/dataManager';
	import { RefreshOutline, CheckCircleSolid, ClockOutline, ExclamationTriangleOutline } from 'flowbite-svelte-icons';
	
	export let showDetails = false;
	export let size: 'sm' | 'md' | 'lg' = 'sm';
	
	let cacheStats = { totalItems: 0, validItems: 0, expiredItems: 0, memoryUsage: 0, averageAge: 0 };
	let dataFreshness = { isFresh: false, age: null, nextRefresh: null };
	let isRefreshing = false;
	
	const sizeClasses = {
		sm: 'text-xs',
		md: 'text-sm',
		lg: 'text-base'
	};
	
	const iconSizeClasses = {
		sm: 'h-3 w-3',
		md: 'h-4 w-4',
		lg: 'h-5 w-5'
	};
	
	async function refreshData() {
		isRefreshing = true;
		try {
			await dataManager.refreshData();
		} catch (error) {
			console.error('Failed to refresh data:', error);
		} finally {
			isRefreshing = false;
		}
	}
	
	function updateStats() {
		cacheStats = cacheManager.getStats();
		dataFreshness = dataManager.getDataFreshness();
	}
	
	function formatAge(milliseconds: number): string {
		const minutes = Math.floor(milliseconds / 60000);
		const hours = Math.floor(minutes / 60);
		
		if (hours > 0) {
			return `${hours}h ${minutes % 60}m ago`;
		} else if (minutes > 0) {
			return `${minutes}m ago`;
		} else {
			return 'Just now';
		}
	}
	
	function formatMemoryUsage(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
	
	onMount(() => {
		updateStats();
		
		// Update stats every 30 seconds
		const interval = setInterval(updateStats, 30000);
		
		return () => clearInterval(interval);
	});
	
	$: statusIcon = (() => {
		if (isRefreshing) return 'loading';
		if (!dataFreshness.isFresh) return 'error';
		if (cacheStats.expiredItems > 0) return 'warning';
		return 'success';
	})();
	
	$: statusColor = (() => {
		switch (statusIcon) {
			case 'loading': return 'text-blue-500';
			case 'error': return 'text-red-500';
			case 'warning': return 'text-yellow-500';
			case 'success': return 'text-green-500';
			default: return 'text-gray-500';
		}
	})();
</script>

<div class="flex items-center gap-2 {sizeClasses[size]}">
	<!-- Status Icon -->
	<div class="flex items-center {statusColor}">
		{#if isRefreshing}
			<RefreshOutline class="animate-spin {iconSizeClasses[size]}" />
		{:else if statusIcon === 'success'}
			<CheckCircleSolid class="{iconSizeClasses[size]}" />
		{:else if statusIcon === 'warning'}
			<ClockOutline class="{iconSizeClasses[size]}" />
		{:else if statusIcon === 'error'}
			<ExclamationTriangleOutline class="{iconSizeClasses[size]}" />
		{/if}
	</div>
	
	{#if showDetails}
		<div class="flex flex-col gap-1">
			<!-- Status Summary -->
			<div class="flex items-center gap-3 {sizeClasses[size]}">
				<span class="text-gray-600">
					Cache: {cacheStats.validItems} items
				</span>
				
				{#if cacheStats.expiredItems > 0}
					<span class="text-yellow-600">
						{cacheStats.expiredItems} expired
					</span>
				{/if}
				
				<span class="text-gray-500">
					{formatMemoryUsage(cacheStats.memoryUsage)}
				</span>
			</div>
			
			<!-- Data Freshness -->
			{#if dataFreshness.isFresh}
				<div class="flex items-center gap-2 text-green-600 {sizeClasses[size]}">
					<span>Data fresh</span>
					{#if dataFreshness.age !== null}
						<span class="text-gray-500">• Updated {formatAge(dataFreshness.age)}</span>
					{/if}
				</div>
			{:else}
				<div class="flex items-center gap-2 text-red-600 {sizeClasses[size]}">
					<span>Data needs refresh</span>
					<button 
						on:click={refreshData}
						class="text-blue-600 hover:text-blue-800 underline"
						disabled={isRefreshing}
					>
						{isRefreshing ? 'Refreshing...' : 'Refresh now'}
					</button>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Simple status text -->
		<span class="text-gray-600">
			{#if isRefreshing}
				Refreshing...
			{:else if statusIcon === 'success'}
				Data cached
			{:else if statusIcon === 'warning'}
				Cache stale
			{:else if statusIcon === 'error'}
				No cache
			{/if}
		</span>
	{/if}
</div>

{#if showDetails && size !== 'sm'}
	<!-- Advanced cache actions -->
	<div class="mt-2 flex gap-2">
		<button
			on:click={refreshData}
			disabled={isRefreshing}
			class="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50"
		>
			Refresh Data
		</button>
		
		<button
			on:click={() => cacheManager.clearExpired()}
			class="px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
		>
			Clean Cache
		</button>
		
		<button
			on:click={() => cacheManager.clear()}
			class="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100"
		>
			Clear All
		</button>
	</div>
{/if}