<!-- src/routes/locations/states/[state]/counties/[county]/+page.svelte -->
<script>
	import { page } from '$app/stores';

	$: ({ state, county } = $page.params);
	// Fetch places for the county
</script>

<h1>{county} County, {state}</h1>
<!-- Display list of places in the county -->
