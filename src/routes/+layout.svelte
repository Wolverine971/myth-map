<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import NavBar from '$lib/components/base/NavBar.svelte';
	import { preloadCriticalComponents } from '$lib/utils/lazyComponents';
	import { initializeOptimizations } from '$lib/utils/appOptimizations';
	import { injectAnimationCSS } from '$lib/utils/pageTransitions';
	import Toast from '$lib/components/shared/Toast.svelte';
	import '../app.css';
	import { onMount } from 'svelte';

	let innerWidth = 0;

	onMount(() => {
		initializeOptimizations();
		injectAnimationCSS();
		preloadCriticalComponents();
	});
</script>

<svelte:window bind:innerWidth />

<NavBar />

<main id="main-content">
	<slot />
</main>

<Toast />
