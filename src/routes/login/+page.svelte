<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Input, Label } from 'flowbite-svelte';
	// import { getContextClient } from '@supabase/auth-helpers-sveltekit';
	import { invalidate } from '$app/navigation';

	import { supabase } from '$lib/supabaseClient';
	let email = '';
	let password = '';
	let errorMessage = '';

	// const supabase = getContextClient();



	// const { data, error: err } = await locals.sb.auth.signInWithPassword({
	// 		email: body.email as string,
	// 		password: body.password as string
	// 	});

	async function handleLogin() {
		try {
			const { data, error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) throw error;

			// Invalidate the session to trigger a re-fetch
			// await invalidate('supabase:auth');

			goto('/'); // Redirect to dashboard after successful login
		} catch (error) {
			console.error('Error logging in:', error);
			errorMessage = error.message;
		}
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center ">
	<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
		<h2 class="mb-6 text-center text-2xl font-bold">Login</h2>
		<form action="?/login" method="POST" class="space-y-4">
			<div>
				<Label for="email" class="mb-2">Email</Label>
				<Input type="email" name="email" id="email" placeholder="Enter your email" bind:value={email} required />
			</div>
			<div>
				<Label for="password" class="mb-2">Password</Label>
				<Input
				name="password" 
					type="password"
					id="password"
					placeholder="Enter your password"
					bind:value={password}
					required
				/>
			</div>
			{#if errorMessage}
				<p class="text-red-500">{errorMessage}</p>
			{/if}
			<Button type="submit" class="w-full">Login</Button>
		</form>
		<p class="mt-4 text-center">
			Don't have an account? <a href="/register" class="text-blue-600 hover:underline">Register</a>
		</p>
	</div>
</div>
