<!-- src/routes/locations/states/[state]/counties/[county]/[place]/+page.svelte -->
<script>
	import { page } from '$app/stores';

	$: place = $page.params.place;
	// Fetch details for the specific place
</script>

<h1>{place}</h1>
<!-- Display details about the place -->
