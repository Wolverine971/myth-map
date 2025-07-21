<!-- src/lib/components/shared/LoadingSpinner.svelte -->
<script lang="ts">
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let color: 'primary' | 'secondary' | 'white' = 'primary';
	export let type: 'spinner' | 'dots' | 'pulse' | 'bars' = 'spinner';
	export let text: string = '';
	export let centered: boolean = false;
	
	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-8 w-8',
		lg: 'h-12 w-12'
	};
	
	const colorClasses = {
		primary: 'text-primary-600',
		secondary: 'text-secondary-600',
		white: 'text-white'
	};
	
	const textSizeClasses = {
		sm: 'text-sm',
		md: 'text-base',
		lg: 'text-lg'
	};
</script>

<div class="flex items-center gap-3 {centered ? 'justify-center' : ''}">
	{#if type === 'spinner'}
		<div class="animate-spin {sizeClasses[size]} {colorClasses[color]}">
			<svg fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
		</div>
	{:else if type === 'dots'}
		<div class="flex space-x-1">
			{#each Array(3) as _, i}
				<div 
					class="animate-bounce {sizeClasses[size] === 'h-4 w-4' ? 'h-2 w-2' : sizeClasses[size] === 'h-8 w-8' ? 'h-3 w-3' : 'h-4 w-4'} rounded-full bg-current {colorClasses[color]}"
					style="animation-delay: {i * 0.1}s"
				></div>
			{/each}
		</div>
	{:else if type === 'pulse'}
		<div class="animate-pulse {sizeClasses[size]} rounded-full bg-current {colorClasses[color]}"></div>
	{:else if type === 'bars'}
		<div class="flex space-x-1">
			{#each Array(4) as _, i}
				<div 
					class="animate-pulse {sizeClasses[size] === 'h-4 w-4' ? 'h-4 w-1' : sizeClasses[size] === 'h-8 w-8' ? 'h-8 w-2' : 'h-12 w-2'} rounded bg-current {colorClasses[color]}"
					style="animation-delay: {i * 0.15}s; animation-duration: 0.8s"
				></div>
			{/each}
		</div>
	{/if}
	
	{#if text}
		<span class="{textSizeClasses[size]} {colorClasses[color]} font-medium">
			{text}
		</span>
	{/if}
</div>

<style>
	@keyframes bounce {
		0%, 100% {
			transform: translateY(-25%);
			animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
		}
		50% {
			transform: translateY(0);
			animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
		}
	}
	
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
	
	.animate-bounce {
		animation: bounce 1s infinite;
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
	}
	
	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>