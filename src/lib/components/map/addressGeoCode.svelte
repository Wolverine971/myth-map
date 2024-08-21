<script lang="ts">
	import { Button, Card } from 'flowbite-svelte';
	import LocationCard from '$lib/components/locations/LocationCard.svelte';
	export let location;
	export let user
	let loading = false;

	const getlatLng = async (loc) => {
		loading = true;

		let body = new FormData();
		body.append('id', loc.id);
		body.append('address', loc.address_line_1);
		body.append('city', loc.city);
		body.append('state', loc.state);
		body.append('zip', loc.zip_code);

		const resp = await fetch('?/getlatLng', {
			method: 'POST',
			body
		});
	};
</script>

<Card size="md">
	<LocationCard
		name={location?.name}
		coords={{ lat: location.lat, lng: location.lng }}
		address={`${`${location.address_line_1}${location.address_line_2 ? ` ${location.address_line_2}` : ''}`}, ${location.city}, ${location.state} ${location.zip_code}`}
		website={location.website}
		tags={location?.tags?.name}
		{location}
		{user}
	/>

	{#if loading}
		<p>Loading...</p>
	{:else if !location?.lat && !location?.lng}
		<!-- <Button
			type="button"
			on:click={async () => {
				await getlatLng(location);
			}}>Get Lat/Lng</Button
		> -->
		<div class="my-1">
			<Button
				color="grey"
				size="md"
				block
				type="button"
				on:click={async () => {
					await getlatLng(location);
				}}>Get Lat/Lng</Button
			>
		</div>
	{/if}
</Card>
