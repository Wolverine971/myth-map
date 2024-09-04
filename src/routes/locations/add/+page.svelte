<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { Button, Label, Input, Textarea } from 'flowbite-svelte';
	import type { PageData } from './$types';
	import { getAndUpdateLatLng } from '../../../utils/locations';
	import { notifications } from '$lib/components/shared/notifications';

	export let data: PageData;

	let { locations } = data;
	$: ({ locations } = data);
	let coordinates;
	let addressLine1 = '';
	let city = '';
	let state = '';
	let zipCode = '';
	let lat = '';
	let lng = '';

	let openingTimes = Array(7).fill('');
	const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	function formatOpeningTimes() {
		return openingTimes
			.map((time, index) => `${days[index]}: ${time}`)
			.filter((time) => time.split(': ')[1] !== '');
	}

	const getCoordinates = async () => {
		coordinates = await getAndUpdateLatLng({
			locationId: undefined,
			address: addressLine1,
			city: city,
			state: state,
			zip: zipCode
		});
		console.log(coordinates);
		lat = coordinates.lat;
		lng = coordinates.lng;
	};

	function handleEnhance() {
		return async ({ result, formData }) => {
			// Add opening times to form data
			const formattedOpeningTimes = formatOpeningTimes();
			if (formattedOpeningTimes.length > 0) {
				formData.append('openingTimes', JSON.stringify(formattedOpeningTimes));
			}

			if (result.type === 'success') {
				notifications.success('Location added successfully', 3000);
			} else {
				notifications.danger('Error adding location', 3000);
			}

			applyAction(result);
		};
	}
</script>

<div class="container mx-auto p-4">
	<h1 class="mb-6 text-3xl font-bold">Add Location</h1>

	<form
		method="POST"
		action="?/addLocation"
		use:enhance
		class="mb-8 space-y-4"
		use:enhance={handleEnhance}
	>
		<div>
			<Label for="name" class="mb-2">Name</Label>
			<Input type="text" id="name" name="name" required />
		</div>
		<div>
			<Label for="addressLine1" class="mb-2">Address Line 1</Label>
			<Input type="text" id="addressLine1" name="addressLine1" bind:value={addressLine1} required />
		</div>
		<div>
			<Label for="addressLine2" class="mb-2">Address Line 2</Label>
			<Input type="text" id="addressLine2" name="addressLine2" />
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<Label for="city" class="mb-2">City</Label>
				<Input type="text" id="city" name="city" bind:value={city} required />
			</div>
			<div>
				<Label for="state" class="mb-2">State</Label>
				<Input type="text" id="state" name="state" bind:value={state} required />
			</div>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<Label for="zipCode" class="mb-2">Zip Code</Label>
				<Input type="text" id="zipCode" name="zipCode" bind:value={zipCode} required />
			</div>
			<div>
				<Label for="phoneNumber" class="mb-2">Phone Number</Label>
				<Input type="tel" id="phoneNumber" name="phoneNumber" />
			</div>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<Label for="website" class="mb-2">Website</Label>
				<Input type="url" id="website" name="website" />
			</div>
			<div>
				<Label for="email" class="mb-2">Email</Label>
				<Input type="email" id="email" name="email" />
			</div>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<Button type="button" on:click={getCoordinates} outline>Get Coordinates</Button>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<Label for="lat" class="mb-2">Latitude</Label>
				<Input type="number" id="lat" name="lat" step="any" bind:value={lat} required />
			</div>
			<div>
				<Label for="lng" class="mb-2">Longitude</Label>
				<Input type="number" id="lng" name="lng" step="any" bind:value={lng} required />
			</div>
		</div>
		<div>
			<Label class="mb-2">Opening Times</Label>
			{#each days as day, index}
				<div class="mb-2 flex items-center space-x-2">
					<span class="w-10">{day}:</span>
					<Input type="text" bind:value={openingTimes[index]} placeholder="e.g. 8:00am-5:30pm" />
				</div>
			{/each}
		</div>
		<Button type="submit" class="w-full">Add Location</Button>
	</form>

	<h2 class="mb-4 text-2xl font-bold">Existing Locations</h2>
	<div class="space-y-4">
		{#each locations as location (location.id)}
			<div class="rounded-lg bg-white p-4 shadow">
				<h3 class="text-xl font-semibold">{location.name}</h3>
				<p>{location.address_line_1}, {location.city}, {location.state} {location.zip_code}</p>
				{#if location.content_locations && location.content_locations[0]}
					{#if location.content_locations[0].website}
						<p>
							Website: <a
								href={location.content_locations[0].website}
								target="_blank"
								rel="noopener noreferrer"
								class="text-blue-600 hover:underline"
							>
								{location.content_locations[0].website}
							</a>
						</p>
					{/if}
					{#if location.content_locations[0].phone_number}
						<p>Phone: {location.content_locations[0].phone_number}</p>
					{/if}
					{#if location.content_locations[0].email}
						<p>Email: {location.content_locations[0].email}</p>
					{/if}
					{#if location.content_locations[0].opening_times}
						<p>Opening Times:</p>
						<ul class="list-inside list-disc">
							{#each location.content_locations[0].opening_times as time}
								<li>{time}</li>
							{/each}
						</ul>
					{/if}
				{/if}
			</div>
		{/each}
	</div>
</div>
