<script lang="ts">
	import { Button, Input, Label, Modal } from 'flowbite-svelte';
	import { createEventDispatcher } from 'svelte';

	export let itineraryId: string;
	export let itineraryName: string;
	export let startDate: string;
	export let endDate: string;

	let emails: string[] = [''];
	let isModalOpen = false;
	let isLoading = false;
	let result: { success: boolean; message: string } | null = null;

	const dispatch = createEventDispatcher();

	function addEmailInput() {
		emails = [...emails, ''];
	}

	function removeEmailInput(index: number) {
		emails = emails.filter((_, i) => i !== index);
	}

	async function sendInvites() {
		isLoading = true;
		result = null;

		try {
			const response = await fetch(`/api/send-calendar-invites`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					itineraryId,
					itineraryName,
					startDate,
					endDate,
					emails: emails.filter((email) => email.trim() !== '')
				})
			});

			const data = await response.json();

			if (response.ok) {
				result = { success: true, message: 'Invites sent successfully!' };
			} else {
				result = { success: false, message: data.error || 'Failed to send invites.' };
			}
		} catch (error) {
			console.error('Error sending invites:', error);
			result = { success: false, message: 'An error occurred while sending invites.' };
		} finally {
			isLoading = false;
		}
	}

	function closeModal() {
		isModalOpen = false;
		if (result?.success) {
			dispatch('invitesSent');
		}
	}
</script>

<Button on:click={() => (isModalOpen = true)}>Send Calendar Invites</Button>

<Modal bind:open={isModalOpen} size="md" autoclose={false} class="w-full">
	<h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">Send Calendar Invites</h3>
	<form on:submit|preventDefault={sendInvites} class="space-y-4">
		{#each emails as email, index}
			<div class="flex items-center space-x-2">
				<Input type="email" placeholder="Enter email address" bind:value={emails[index]} required />
				{#if index > 0}
					<Button color="red" size="sm" on:click={() => removeEmailInput(index)}>Remove</Button>
				{/if}
			</div>
		{/each}
		<Button type="button" on:click={addEmailInput}>Add Another Email</Button>

		<div class="flex justify-end space-x-2">
			<Button color="alternative" on:click={closeModal}>Cancel</Button>
			<Button type="submit" disabled={isLoading}>
				{#if isLoading}
					Sending...
				{:else}
					Send Invites
				{/if}
			</Button>
		</div>
	</form>

	{#if result}
		<div class="mt-4 text-center">
			<p class={result.success ? 'text-green-600' : 'text-red-600'}>{result.message}</p>
		</div>
	{/if}
</Modal>
