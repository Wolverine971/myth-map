<!-- src/lib/components/shared/SimpleImage.svelte -->
<script lang="ts">
	export let src: string;
	export let alt: string;
	export let fallbackSrc: string = '/map/mythmap.png';
	export let aspectRatio: string = 'aspect-video';
	export let className: string = '';
	export let objectFit: 'cover' | 'contain' | 'fill' = 'cover';
	
	let isLoaded = false;
	let hasError = false;
	
	function handleLoad() {
		isLoaded = true;
		console.log('SimpleImage loaded successfully:', src);
	}
	
	function handleError(event: any) {
		hasError = true;
		console.warn('SimpleImage failed to load:', src, 'Falling back to:', fallbackSrc);
	}
</script>

<div class="relative {aspectRatio} w-full overflow-hidden {className}">
	{#if !isLoaded}
		<!-- Loading placeholder -->
		<div class="absolute inset-0 animate-pulse bg-gray-200">
			<div class="absolute inset-0 flex items-center justify-center text-gray-400">
				<svg class="h-8 w-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
					<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
				</svg>
			</div>
		</div>
	{/if}
	
	<img
		src={hasError ? fallbackSrc : src}
		{alt}
		class="absolute inset-0 h-full w-full object-{objectFit} transition-opacity duration-300 {isLoaded ? 'opacity-100' : 'opacity-0'}"
		on:load={handleLoad}
		on:error={handleError}
	/>
</div>

<style>
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>