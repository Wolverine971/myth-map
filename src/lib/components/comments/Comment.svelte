<!-- Comment.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button, Badge, Textarea } from 'flowbite-svelte';
	import Comments from './Comments.svelte';
	import type { CommentType } from '../types';
	import { deserialize } from '$app/forms';

	export let comment: CommentType | null = null;
	export let parentId: string;
	export let parentType: string;
	export let depth = 0;
	export let displayName: string = 'Reply';
	export let user;

	const dispatch = createEventDispatcher();

	let isExpanded = false;
	let showReplyForm = false;
	let isEditing = false;
	let newCommentContent = '';
	let editedContent = '';

	function toggleExpand() {
		isExpanded = !isExpanded;
	}

	function formatTimestamp(timestamp: string): string {
		// Implement relative time formatting here
		return new Date(timestamp).toLocaleString();
	}

	function handleReply() {
		showReplyForm = true;
	}

	async function handleLike() {
		if (comment) {
			const method = comment.userHasLiked ? 'DELETE' : 'POST';
			const response = await fetch(`/api/comments/${comment.id}/like`, { method });
			if (response.ok) {
				comment.likes += comment.userHasLiked ? -1 : 1;
				comment.userHasLiked = !comment.userHasLiked;
			}
		}
	}

	function handleEdit() {
		if (comment) {
			isEditing = true;
			editedContent = comment.content;
		}
	}

	async function handleUpdateComment() {
		if (comment && editedContent.trim() !== comment.content) {
			const response = await fetch(`/api/comments/${comment.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: editedContent })
			});
			if (response.ok) {
				const updatedComment = await response.json();
				comment = { ...comment, ...updatedComment };
			}
		}
		isEditing = false;
	}

	function handleFlag() {
		if (comment) {
			dispatch('flag', { commentId: comment.id });
		}
	}

	async function handleSubmitComment() {
		if (newCommentContent.trim()) {
			const response = await fetch('/api/comments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					parentId: comment ? comment.id : parentId,
					parentType: comment ? 'comment' : parentType,
					content: newCommentContent
				})
			});
			if (response.ok) {
				const result: any = deserialize(await response.text());
				dispatch('newComment', result);
				newCommentContent = '';
				showReplyForm = false;
			}
		}
	}

	function handleDelete() {
		if (comment) {
			dispatch('delete', { commentId: comment.id });
		}
	}
</script>

<div class="comment">
	{#if comment}
		<div class="comment-header">
			<span class="font-bold">{comment.author.username}</span>
			<span class="text-sm text-gray-500">{formatTimestamp(comment.created_at)}</span>
			{#if comment.isEdited}
				<Badge color="gray">Edited</Badge>
			{/if}
		</div>

		<div class="comment-content">
			{#if isEditing}
				<Textarea bind:value={editedContent} rows={3} />
				<Button on:click={handleUpdateComment}>Save</Button>
				<Button color="light" on:click={() => (isEditing = false)}>Cancel</Button>
			{:else if comment.content.length > 200 && !isExpanded}
				{comment.content.slice(0, 200)}...
				<button on:click={toggleExpand} class="text-blue-500">Read more</button>
			{:else}
				{comment.content}
			{/if}
		</div>

		<div class="comment-actions">
			<Button size="xs" on:click={handleLike}>
				{comment.userHasLiked ? 'Unlike' : 'Like'} ({comment.likes})
			</Button>
			<Button size="xs" on:click={handleReply}>{displayName}</Button>
			{#if comment.canEdit}
				<Button size="xs" on:click={handleEdit}>Edit</Button>
			{/if}
			{#if comment.canDelete}
				<Button size="xs" color="red" on:click={handleDelete}>Delete</Button>
			{/if}
			<Button size="xs" color="light" on:click={handleFlag}>Flag</Button>
		</div>

		{#if comment.hasReplies}
			<Comments parentId={comment.id} parentType="comment" depth={depth + 1} {displayName} {user} />
		{/if}
	{/if}

	{#if showReplyForm || !comment}
		<div class="reply-form">
			<Textarea
				bind:value={newCommentContent}
				rows={3}
				placeholder={`Write a ${displayName.toLowerCase()}...`}
			/>
			<Button on:click={handleSubmitComment}>Submit {displayName}</Button>
		</div>
	{/if}
</div>

<style>
	.comment {
		border-left: 2px solid #e2e8f0;
		padding-left: 1rem;
		margin-bottom: 1rem;
	}

	.comment-header {
		margin-bottom: 0.5rem;
	}

	.comment-content {
		margin-bottom: 0.5rem;
	}

	.comment-actions {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.reply-form {
		margin-top: 1rem;
	}
</style>
