<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { Button, Label, Input, Textarea, Modal } from 'flowbite-svelte';
	import type { PageData } from './$types';
	import { getAndUpdateLatLng } from '../../../utils/locations';
	import { notifications } from '$lib/components/shared/notifications';
	import { writable } from 'svelte/store';

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

	let name = '';
	let addressLine2 = '';
	let phoneNumber = '';
	let website = '';
	let email = '';

	let isEditing = false;
	let editingLocationId: number | null = null;

	const modalStore = writable(false);

	function formatOpeningTimes() {
		return days.map((day, index) => `${day}: ${openingTimes[index] || 'closed'}`).join(', ');
	}

	function parseOpeningTimes(times: string) {
		const parsedTimes = Array(7).fill('');
		const timeParts = times.split(', ');
		timeParts.forEach(part => {
			const [day, hours] = part.split(': ');
			const index = days.indexOf(day);
			if (index !== -1) {
				parsedTimes[index] = hours === 'closed' ? '' : hours;
			}
		});
		return parsedTimes;
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

	

	function resetForm() {
		name = '';
		addressLine1 = '';
		addressLine2 = '';
		city = '';
		state = '';
		zipCode = '';
		lat = '';
		lng = '';
		phoneNumber = '';
		website = '';
		email = '';
		openingTimes = Array(7).fill('');
		isEditing = false;
		editingLocationId = null;
	}

	function editLocation(location) {
		isEditing = true;
		editingLocationId = location.id;
		name = location.name;
		addressLine1 = location.address_line_1;
		addressLine2 = location.address_line_2 || '';
		city = location.city;
		state = location.state;
		zipCode = location.zip_code;
		lat = location.lat;
		lng = location.lng;
		phoneNumber = location.content_locations[0]?.phone_number || '';
		website = location.content_locations[0]?.website || '';
		email = location.content_locations[0]?.email || '';
		openingTimes = location.content_locations[0]?.opening_times 
			? parseOpeningTimes(location.content_locations[0].opening_times)
			: Array(7).fill('');
		modalStore.set(true);
	}
</script>

<div class="container mx-auto p-4">
	<h1 class="mb-6 text-3xl font-bold">Manage Locations</h1>

	<Button on:click={() => { resetForm(); modalStore.set(true); }}>Add New Location</Button>

	<Modal bind:open={$modalStore} size="xl">
		<form
			method="POST"
			action={isEditing ? `?/updateLocation&id=${editingLocationId}` : "?/addLocation"}
			
			use:enhance={({ formElement, formData, action, cancel, submitter }) => {
				const formattedOpeningTimes = formatOpeningTimes();
				formData.append('openingTimes', formattedOpeningTimes);
				
				return async ({ result }) => {
				if (result.type === 'success') {
					notifications.success(isEditing ? 'Location updated successfully' : 'Location added successfully', 3000);
					resetForm();
					modalStore.set(false);
				} else {
					notifications.danger(isEditing ? 'Error updating location' : 'Error adding location', 3000);
				}

				await applyAction(result);
			};
			}}
			class="space-y-4"
		>
			<h2 class="text-2xl font-bold mb-4">{isEditing ? 'Edit Location' : 'Add Location'}</h2>
			<div>
				<Label for="name" class="mb-2">Name</Label>
				<Input type="text" id="name" name="name" bind:value={name} required />
			</div>
			<div>
				<Label for="addressLine1" class="mb-2">Address Line 1</Label>
				<Input type="text" id="addressLine1" name="addressLine1" bind:value={addressLine1} required />
			</div>
			<div>
				<Label for="addressLine2" class="mb-2">Address Line 2</Label>
				<Input type="text" id="addressLine2" name="addressLine2" bind:value={addressLine2} />
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
					<Input type="tel" id="phoneNumber" name="phoneNumber" bind:value={phoneNumber} />
				</div>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<Label for="website" class="mb-2">Website</Label>
					<Input type="url" id="website" name="website" bind:value={website} />
				</div>
				<div>
					<Label for="email" class="mb-2">Email</Label>
					<Input type="email" id="email" name="email" bind:value={email} />
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
						<Input type="text" bind:value={openingTimes[index]} placeholder="e.g. 12:00 pm - 8:00 pm or leave empty for closed" />
					</div>
				{/each}
			</div>
			<Button type="submit" class="w-full">{isEditing ? 'Update Location' : 'Add Location'}</Button>
		</form>
	</Modal>

	<h2 class="mb-4 mt-8 text-2xl font-bold">Existing Locations</h2>
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
							{#each location.content_locations[0].opening_times.split(',') as time}
								<li>{time}</li>
							{/each}
						</ul>
					{/if}
				{/if}
				<Button on:click={() => editLocation(location)} class="mt-4">Edit</Button>
			</div>
		{/each}
	</div>
</div>