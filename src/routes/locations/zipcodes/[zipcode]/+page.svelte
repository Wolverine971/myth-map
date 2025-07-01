<!-- src/routes/locations/zipcodes/[zipcode]/+page.svelte -->
<script>
	import { page } from '$app/stores';

	$: zipcode = $page.params.zipcode;
	// Fetch places for the zipcode
</script>

<h1>Locations in {zipcode}</h1>
<!-- Display list of places in the zipcode -->
