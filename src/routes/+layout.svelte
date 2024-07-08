<script>
	import NavBar from '$lib/components/base/NavBar.svelte';
	import '../app.css';
	let innerWidth = 0;
</script>

<svelte:window bind:innerWidth />
<NavBar {innerWidth} />

<hr />
<main style="display: flex; flex-direction:column;  justify-content: center; align-items:center;">
	<slot></slot>
</main>

<style></style>
