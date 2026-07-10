<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import NavBar from '$lib/components/base/NavBar.svelte';
	import Footer from '$lib/components/base/Footer.svelte';
	import Toast from '$lib/components/shared/Toast.svelte';
	import '$lib/stores/themeStore'; // wires up sunset-aware theme system
	import '../app.css';

	const organizationSchema = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'Tiny Tribe Adventures',
		url: 'https://tinytribeadventures.com',
		logo: 'https://tinytribeadventures.com/myth-map.png',
		description: 'Family-tested places for when you need ideas.'
	};

	$: organizationSchemaScript =
		`<script type="application/ld+json">${JSON.stringify(organizationSchema)}<` + '/script>';
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html organizationSchemaScript}
</svelte:head>

<div class="flex min-h-screen flex-col">
	<NavBar />

	<main id="main-content" class="flex-1">
		<slot />
	</main>

	<Footer />
</div>

<Toast />
