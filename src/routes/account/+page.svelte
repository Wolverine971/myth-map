<script lang="ts">
	import { Card, Button, A } from 'flowbite-svelte';
	import { UserCircleSolid } from 'flowbite-svelte-icons';
	import type { PageData } from './$types';
	import { supabase } from '$lib/supabaseClient';
	import { goto } from '$app/navigation';

	export let data: PageData;

	let user = {
		name: 'John Doe',
		email: data?.user?.email || 'john@gmail.com'
	};

	const handleLogout = async () => {
		try {
			const body = new FormData();
			await fetch('?/logout', { method: 'POST', body });
			await goto('/login');
		} catch (error) {
			console.error('Logout error:', error);
			// Optionally, you can show an error message to the user here
		}
	}
</script>

<div class="container mx-auto p-4">
	<h1 class="mb-6 text-3xl font-bold">My Account</h1>

	<Card class="mb-6">
		<div class="flex items-center space-x-4">
			<UserCircleSolid class="h-12 w-12 text-gray-500" />
			<div>
				<h2 class="text-2xl font-semibold">{user.name}</h2>
				<p class="text-gray-500">{user.email}</p>
			</div>
		</div>
	</Card>

	<Card class="mb-6">
		<div class="flex items-center space-x-4">
			<A href="/itineraries">Itineraries</A>
		</div>
	</Card>

	<div class="mt-8">
		<Button color="red" on:click={handleLogout}>
			Logout
		</Button>
	</div>
</div>