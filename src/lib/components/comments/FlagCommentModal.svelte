<!-- src/lib/components/comments/FlagCommentModal.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Modal, Button, Label, Textarea, Select } from 'flowbite-svelte';
	import type { CommentType } from '../types';

	export let showModal = false;
	export let comment: CommentType | null = null;

	const dispatch = createEventDispatcher();

	let selectedReason = '';
	let otherReason = '';

	const flagReasons = ['Spam', 'Harassment', 'Inappropriate content', 'Off-topic', 'Other'];

	function handleSubmit() {
		const reason = selectedReason === 'Other' ? otherReason : selectedReason;
		dispatch('flagged', { commentId: comment?.id, reason });
		showModal = false;
		selectedReason = '';
		otherReason = '';
	}
</script>

<Modal bind:open={showModal} size="md" autoclose={false} class="w-full">
	<h2 slot="header" class="text-xl font-bold">Flag Comment</h2>

	<form on:submit|preventDefault={handleSubmit}>
		<div class="mb-4">
			<Label for="flag-reason" class="mb-2">Reason for flagging</Label>
			<Select id="flag-reason" bind:value={selectedReason} items={flagReasons} />
		</div>

		{#if selectedReason === 'Other'}
			<div class="mb-4">
				<Label for="other-reason" class="mb-2">Please specify</Label>
				<Textarea id="other-reason" bind:value={otherReason} rows={3} />
			</div>
		{/if}

		<div class="flex justify-end gap-4">
			<Button color="alternative" on:click={() => (showModal = false)}>Cancel</Button>
			<Button type="submit" color="red">Flag Comment</Button>
		</div>
	</form>
</Modal>
