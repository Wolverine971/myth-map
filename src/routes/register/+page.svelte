<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { Button, Input, Label } from 'flowbite-svelte';

	let email = '';
	let password = '';
	let confirmPassword = '';
	let errorMessage = '';

	function handleEnhance() {
		return async ({ result }) => {
			if (result.type === 'success') {
				// rerun all `load` functions, following the successful update
				await invalidateAll();
			}

			applyAction(result);
		};
	}

	function validateForm() {
		if (password !== confirmPassword) {
			errorMessage = "Passwords don't match";
			return false;
		}
		errorMessage = '';
		return true;
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-gray-100">
	<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
		<h2 class="mb-6 text-center text-2xl font-bold">Register</h2>
		<form
			action="?/register"
			method="POST"
			class="space-y-4"
			use:enhance={handleEnhance}
			on:submit|preventDefault={() => validateForm() && void 0}
		>
			<div>
				<Label for="email" class="mb-2">Email</Label>
				<Input
					type="email"
					id="email"
					name="email"
					placeholder="Enter your email"
					bind:value={email}
					required
				/>
			</div>
			<div>
				<Label for="password" class="mb-2">Password</Label>
				<Input
					type="password"
					id="password"
					name="password"
					placeholder="Enter your password"
					bind:value={password}
					required
				/>
			</div>
			<div>
				<Label for="confirm-password" class="mb-2">Confirm Password</Label>
				<Input
					type="password"
					id="confirm-password"
					placeholder="Confirm your password"
					bind:value={confirmPassword}
					required
				/>
			</div>
			{#if errorMessage}
				<p class="text-red-500">{errorMessage}</p>
			{/if}
			<Button type="submit" class="w-full">Register</Button>
		</form>
		<p class="mt-4 text-center">
			Already have an account? <a href="/login" class="text-blue-600 hover:underline">Login</a>
		</p>
	</div>
</div>
