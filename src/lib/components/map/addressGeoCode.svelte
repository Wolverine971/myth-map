<script lang="ts">
	import { Button, Card } from 'flowbite-svelte';
	import LocationCard from '$lib/components/locations/LocationCard.svelte';
	export let location;
	const url = 'https://myth-map.vercel.app/';
	let loading = false;
	const getlatLng = async (loc) => {
		loading = true;

		console.log(loc);

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
	console.log(location);
</script>

<Card size="md">
	<LocationCard
		name={location?.name}
		address={`${`${location.address_line_1}${location.address_line_2 ? ` ${location.address_line_2}` : ''}`}, ${location.city}, ${location.state} ${location.zip_code}`}
		website={location.website}
		tag={location?.tags?.name}
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
