<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import NavBar from '$lib/components/base/NavBar.svelte';
	import { preloadCriticalComponents } from '$lib/utils/lazyComponents';
	import { initializeOptimizations } from '$lib/utils/appOptimizations';
	import Toast from '$lib/components/shared/Toast.svelte';
	import '$lib/stores/themeStore'; // wires up sunset-aware theme system
	import '../app.css';
	import { onMount } from 'svelte';

	let innerWidth = 0;

	onMount(() => {
		initializeOptimizations();
		preloadCriticalComponents();
	});
</script>

<svelte:window bind:innerWidth />

<NavBar />

<main id="main-content">
	<slot />
</main>

<Toast />
