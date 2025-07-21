<!-- src/lib/components/shared/PageTransition.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { getTransition, createPageTransition, getAccessibleTransition } from '$lib/utils/pageTransitions';
	import type { TransitionConfig } from '$lib/utils/pageTransitions';
	
	export let transitionConfig: TransitionConfig | null = null;
	export let key: string = '';
	
	let mounted = false;
	let transitioning = false;
	let prefersReducedMotion = false;
	let previousRoute = '';
	
	// Auto-generate key from route if not provided
	$: transitionKey = key || $page.route.id || $page.url.pathname;
	
	onMount(() => {
		mounted = true;
		
		// Check user's motion preferences
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		prefersReducedMotion = mediaQuery.matches;
		
		mediaQuery.addEventListener('change', (e) => {
			prefersReducedMotion = e.matches;
		});
	});
	
	// Handle navigation events
	beforeNavigate(() => {
		transitioning = true;
		previousRoute = $page.route.id || '';
	});
	
	afterNavigate(() => {
		transitioning = false;
		
		// Scroll to top after transition
		setTimeout(() => {
			window.scrollTo(0, 0);
		}, 100);
	});
	
	// Get the appropriate transition configuration
	$: finalTransitionConfig = (() => {
		if (!browser || !mounted) return { type: 'none' as const, duration: 0 };
		
		let config = transitionConfig;
		
		// Auto-generate transition if none provided
		if (!config) {
			config = createPageTransition(previousRoute, $page.route.id || '');
		}
		
		// Apply accessibility preferences
		return getAccessibleTransition(config, prefersReducedMotion);
	})();
	
	// Get the actual transition function
	$: transition = browser && mounted ? getTransition(finalTransitionConfig) : () => ({ duration: 0 });
</script>

<div class="page-wrapper">
	{#key transitionKey}
		{#if browser && mounted}
			<div 
				class="page-content"
				in:transition
				out:transition={{...finalTransitionConfig, duration: finalTransitionConfig.duration * 0.5}}
			>
				<slot />
			</div>
		{:else}
			<div class="page-content">
				<slot />
			</div>
		{/if}
	{/key}
</div>

<style>
	.page-wrapper {
		position: relative;
		min-height: 100vh;
	}
	
	.page-content {
		position: relative;
		width: 100%;
	}
	
	/* Ensure smooth transitions */
	:global(.page-content) {
		will-change: transform, opacity;
	}
	
	/* Loading state styles */
	:global(.page-transitioning) {
		pointer-events: none;
	}
</style>