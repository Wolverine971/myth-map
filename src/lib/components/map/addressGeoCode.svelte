<script lang="ts">
	import { Button, Card } from 'flowbite-svelte';
	import LocationCard from '$lib/components/locations/LocationCard.svelte';
	export let location;
	const url = 'https://myth-map.vercel.app/';
	let loading = false;
	const getlatLng = async (location) => {
		loading = true;

		console.log(location);

		let body = new FormData();
		body.append('id', location.id);
		body.append('address', location.address_line_1);
		body.append('city', location.city);
		body.append('state', location.state);
		body.append('zip', location.zip_code);

		const resp = await fetch('?/getlatLng', {
			method: 'POST',
			body
		});
	};
</script>

<Card horizontal size="md">
	<LocationCard
		name={location.locations.name}
		address={`${`${location.locations.address_line_1}${location.locations.address_line_2 ? ` ${location.locations.address_line_2}` : ''}`}, ${location.locations.city}, ${location.locations.state} ${location.locations.zip_code}`}
		website={location.locations.website}
		tag={location.tags.name}
	/>

	{#if loading}
		<p>Loading...</p>
	{:else if !location?.locations?.lat && !location?.locations?.lng}
		<Button
			type="button"
			on:click={async () => {
				await getlatLng(location.locations);
			}}>Get Lat/Lng</Button
		>
		<Button
			color="primary"
			size="md"
			block
			type="button"
			on:click={async () => {
				await getlatLng(location.locations);
			}}>Get Lat/Lng</Button
		>
	{/if}
</Card>
