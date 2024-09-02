<script lang="ts">
	import { Card, Button, A, Input, Label, Avatar } from 'flowbite-svelte';
	import { UserCircleSolid } from 'flowbite-svelte-icons';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';

	export let data: PageData;

	let user = data.user;
	let editing = false;
	let username = user.username || '';
	let firstName = user.first_name || '';
	let lastName = user.last_name || '';

	const toggleEdit = () => {
		editing = !editing;
		if (!editing) {
			// Reset form values if cancelling edit
			username = user.username || '';
			firstName = user.first_name || '';
			lastName = user.last_name || '';
		}
	};

	const handleSubmit = () => {
		return async ({ result }: { result: { type: string; data: any } }) => {
			if (result.type === 'success') {
				user = { ...user, ...result.data.profile };
				editing = false;
			}
		};
	};
</script>

{#if user.admin}
	<div class="mx-auto flex w-full max-w-3xl p-4">
		<A href="/admin/users" outline>
			<Button outline>Manage Users</Button></A
		>
	</div>
{/if}
<div class="container mx-auto max-w-3xl p-4">
	<h1 class="mb-6 text-center text-3xl font-bold md:text-left">My Account</h1>

	<div class="grid gap-6 md:grid-cols-3">
		<Card class="md:col-span-1">
			<div class="flex flex-col items-center space-y-4">
				<Avatar size="xl" />
				<div class="text-center">
					<h2 class="text-2xl font-semibold">{user.first_name} {user.last_name}</h2>
					<p class="text-gray-500">{user.email}</p>
					<p class="text-gray-500">@{user.username}</p>
				</div>
			</div>
		</Card>

		<Card class="md:col-span-2">
			{#if editing}
				<form method="POST" action="?/updateProfile" use:enhance={handleSubmit}>
					<div class="mb-4">
						<Label for="username" class="mb-2">Username</Label>
						<Input id="username" name="username" bind:value={username} required />
					</div>
					<div class="mb-4">
						<Label for="firstName" class="mb-2">First Name</Label>
						<Input id="firstName" name="firstName" bind:value={firstName} />
					</div>
					<div class="mb-4">
						<Label for="lastName" class="mb-2">Last Name</Label>
						<Input id="lastName" name="lastName" bind:value={lastName} />
					</div>
					<div class="flex flex-col space-y-2 sm:flex-row sm:justify-end sm:space-x-4 sm:space-y-0">
						<Button type="submit">Save Changes</Button>
						<Button color="light" on:click={toggleEdit}>Cancel</Button>
					</div>
				</form>
			{:else}
				<div class="flex flex-col space-y-4">
					<div>
						<span class="font-semibold">Username:</span>
						{user.username || 'Not set'}
					</div>
					<div>
						<span class="font-semibold">First Name:</span>
						{user.first_name || 'Not set'}
					</div>
					<div>
						<span class="font-semibold">Last Name:</span>
						{user.last_name || 'Not set'}
					</div>
					<Button on:click={toggleEdit}>Edit Profile</Button>
				</div>
			{/if}
		</Card>

		<Card class="md:col-span-3">
			<div class="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
				<A href="/itineraries" class="w-full sm:w-auto">My Itineraries</A>
			</div>
		</Card>
	</div>
</div>
