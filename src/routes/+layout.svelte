<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import NavBar from '$lib/components/base/NavBar.svelte';
	import Footer from '$lib/components/base/Footer.svelte';
	import { preloadCriticalComponents } from '$lib/utils/lazyComponents';
	import { initializeOptimizations } from '$lib/utils/appOptimizations';
	import Toast from '$lib/components/shared/Toast.svelte';
	import '$lib/stores/themeStore'; // wires up sunset-aware theme system
	import '../app.css';
	import { onMount } from 'svelte';

	let innerWidth = 0;

	const organizationSchema = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'Tiny Tribe Adventures',
		url: 'https://tinytribeadventures.com',
		logo: 'https://tinytribeadventures.com/myth-map.png',
		description: 'Family-tested places for when you need ideas.'
	};

	onMount(() => {
		initializeOptimizations();
		preloadCriticalComponents();
	});
</script>

<svelte:head>
	{@html `<script type="application/ld+json">${JSON.stringify(organizationSchema)}</script>`}
</svelte:head>

<svelte:window bind:innerWidth />

<div class="flex min-h-screen flex-col">
	<NavBar />

	<main id="main-content" class="flex-1">
		<slot />
	</main>

	<Footer />
</div>

<Toast />
