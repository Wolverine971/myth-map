<!-- src/lib/components/comments/Comment.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button, Badge, Textarea, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ThumbsUp, MessageCircle, MoreVertical } from 'lucide-svelte';
	import Comments from './Comments.svelte';
	import type { CommentType } from '../types';
	import { deserialize } from '$app/forms';

	export let comment: CommentType | null = null;
	export let parentId: string;
	export let parentType: string = 'comment';
	export let depth = 0;
	export let displayName: string = 'Reply';
	export let user;

	const dispatch = createEventDispatcher();

	let isExpanded = false;
	let showReplyForm = false;
	let isEditing = false;
	let newCommentContent = '';
	let editedContent = '';
	let showReplies = false;

	function toggleExpand() {
		isExpanded = !isExpanded;
	}

	function formatTimestamp(timestamp: string): string {
		// Implement relative time formatting here
		return new Date(timestamp).toLocaleString();
	}

	function handleReplyClick() {
		if (comment.comment_count > 0) {
			showReplies = !showReplies;
		}
		showReplyForm = !showReplyForm;
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
					parentType: parentType,
					content: newCommentContent
				})
			});
			if (response.ok) {
				const result: any = deserialize(await response.text());
				if (parentType === 'comment') {
					dispatch('replyAdded', result);
					comment.comment_count += 1;
					showReplies = true;
				} else {
					dispatch('newComment', result);
				}
				newCommentContent = '';
				showReplyForm = false;
				if (comment) {
					comment.comment_count += 1;
				}
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
			<div class="flex items-center space-x-4">
				<Button outline on:click={handleLike} class="flex items-center space-x-1 text-gray-500 ">
					<ThumbsUp size={16} class={comment.userHasLiked ? 'text-blue-500' : ''} />
					<span style="min-height: 20px">{comment.likes}</span>
				</Button>

				<Button
					outline
					on:click={handleReplyClick}
					class="flex items-center space-x-1 text-gray-500 "
				>
					<MessageCircle size={16} />
					<span style="min-height: 20px">
						{#if comment.comment_count > 0}
							{showReplies ? 'Hide' : 'Show'}
							{comment.comment_count}
							{comment.comment_count === 1 ? 'Reply' : 'Replies'}
						{:else}
							Reply
						{/if}
					</span>
				</Button>
			</div>

			<div class="relative">
				<Dropdown placement="bottom-end">
					<Button slot="trigger" color="light" class="!p-1">
						<MoreVertical size={16} />
					</Button>
					<DropdownItem on:click={handleFlag}>Flag comment</DropdownItem>
					{#if comment.canEdit}
						<DropdownItem on:click={handleEdit}>Edit</DropdownItem>
					{/if}
					{#if comment.canDelete}
						<DropdownItem on:click={handleDelete}>Delete</DropdownItem>
					{/if}
				</Dropdown>
			</div>
		</div>

		{#if showReplies}
			<Comments
				parentId={comment.id}
				parentType="comment"
				depth={depth + 1}
				{displayName}
				{user}
				{innerWidth}
			/>
		{/if}
	{/if}

	{#if showReplyForm || !comment}
		<div class="reply-form">
			<Textarea
				bind:value={newCommentContent}
				disabled={!user}
				rows={3}
				placeholder={user
					? `Write a ${displayName.toLowerCase()}...`
					: 'Register to write a comment...'}
			/>
			<Button on:click={handleSubmitComment} disabled={!user}>Submit {displayName}</Button>
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
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.reply-form {
		margin-top: 1rem;
	}
</style>
