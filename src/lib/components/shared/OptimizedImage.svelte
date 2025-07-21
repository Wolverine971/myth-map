<!-- src/lib/components/shared/OptimizedImage.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	
	export let src: string;
	export let alt: string;
	export let fallbackSrc: string = '/map/mythmap.png';
	export let loading: 'lazy' | 'eager' = 'lazy';
	export let sizes: string = '100vw';
	export let aspectRatio: string = 'aspect-video';
	export let className: string = '';
	export let placeholder: 'blur' | 'skeleton' | 'none' = 'skeleton';
	export let objectFit: 'cover' | 'contain' | 'fill' = 'cover';
	
	let containerElement: HTMLDivElement;
	let imageElement: HTMLImageElement;
	let isLoaded = false;
	let hasError = false;
	let isIntersecting = false;
	let mounted = false;
	
	// Intersection Observer for lazy loading
	let observer: IntersectionObserver;
	
	onMount(() => {
		mounted = true;
		
		if (loading === 'lazy' && containerElement) {
			observer = new IntersectionObserver(
				(entries) => {
					entries.forEach(entry => {
						if (entry.isIntersecting) {
							isIntersecting = true;
							observer.unobserve(entry.target);
						}
					});
				},
				{ 
					threshold: 0.1,
					rootMargin: '100px'
				}
			);
			
			observer.observe(containerElement);
		} else {
			isIntersecting = true;
		}
		
		return () => {
			if (observer) {
				observer.disconnect();
			}
		};
	});
	
	// Use a reactive statement to setup observer after container is bound
	$: if (mounted && loading === 'lazy' && containerElement && !observer) {
		observer = new IntersectionObserver(
			(entries) => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						isIntersecting = true;
						observer.unobserve(entry.target);
					}
				});
			},
			{ 
				threshold: 0.1,
				rootMargin: '100px'
			}
		);
		
		observer.observe(containerElement);
	}
	
	function handleLoad() {
		isLoaded = true;
		console.log('Image loaded successfully:', src);
	}
	
	function handleError(event: any) {
		hasError = true;
		console.warn('Image failed to load:', src, 'Falling back to:', fallbackSrc);
		// Don't set isLoaded = true here, let the fallback image load
	}
	
	function handleFallbackLoad() {
		isLoaded = true;
		console.log('Fallback image loaded:', fallbackSrc);
	}
	
	// Generate srcset for responsive images if needed
	function generateSrcset(baseSrc: string): string {
		// For now, return the base src. In production, you'd generate multiple sizes
		return baseSrc;
	}
	
	$: shouldShowImage = loading === 'eager' || isIntersecting;
</script>

<div bind:this={containerElement} class="relative {aspectRatio} w-full overflow-hidden {className}">
	{#if !shouldShowImage}
		<!-- Skeleton placeholder when not in view -->
		<div class="absolute inset-0 animate-pulse bg-gray-200">
			<div class="absolute inset-0 flex items-center justify-center text-gray-400">
				<svg class="h-8 w-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
					<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
				</svg>
			</div>
		</div>
	{:else if !isLoaded && placeholder === 'skeleton'}
		<!-- Skeleton placeholder while loading -->
		<div class="absolute inset-0 animate-pulse bg-gray-200">
			{#if placeholder === 'blur'}
				<div class="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-300"></div>
			{/if}
		</div>
	{/if}
	
	{#if shouldShowImage}
		{#if hasError}
			<img
				bind:this={imageElement}
				src={fallbackSrc}
				{alt}
				class="absolute inset-0 h-full w-full object-{objectFit} transition-opacity duration-500 {isLoaded ? 'opacity-100' : 'opacity-0'}"
				loading={loading}
				decoding="async"
				on:load={handleFallbackLoad}
			/>
		{:else}
			<img
				bind:this={imageElement}
				src={src}
				{alt}
				{sizes}
				class="absolute inset-0 h-full w-full object-{objectFit} transition-opacity duration-500 {isLoaded ? 'opacity-100' : 'opacity-0'}"
				loading={loading}
				decoding="async"
				on:load={handleLoad}
				on:error={handleError}
			/>
		{/if}
	{/if}
	
	<!-- Loading overlay -->
	{#if shouldShowImage && !isLoaded && placeholder !== 'skeleton'}
		<div class="absolute inset-0 flex items-center justify-center bg-gray-100">
			<div class="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600"></div>
		</div>
	{/if}
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

	.animate-spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>