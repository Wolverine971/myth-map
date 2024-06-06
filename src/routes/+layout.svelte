<script>
	import NavBar from '$lib/components/base/NavBar.svelte';
	import '../app.css';
</script>

<NavBar />

<hr />
<main style="display: flex; flex-direction:column;  justify-content: center; align-items:center;">
	<slot></slot>
</main>

<style></style>
