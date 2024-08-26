<!-- Comments.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from 'flowbite-svelte';
	import Comment from './Comment.svelte';
	import FlagCommentModal from './FlagCommentModal.svelte';
	import type { CommentType } from '../types';

	export let parentId: string;
	export let parentType: string;
	export let depth = 0;
	export let displayName: string = 'Comments';
	export let replyDisplayName: string = 'Reply';
	export let user;
	export let innerWidth;

	let comments: CommentType[] = [];
	let totalComments = 0;
	let page = 1;
	let loading = false;
	let showFlagModal = false;
	let selectedComment: CommentType | null = null;

	async function fetchComments() {
		loading = true;
		const response = await fetch(
			`/api/comments?parentId=${parentId}&parentType=${parentType}&page=${page}`
		);
		const data = await response.json();
		comments = [...comments, ...data?.comments];
		totalComments = data.total;
		loading = false;
	}

	function loadMoreComments() {
		page += 1;
		fetchComments();
	}

	function handleFlagComment(comment: CommentType) {
		selectedComment = comment;
		showFlagModal = true;
	}

	async function handleCommentFlagged(
		event: CustomEvent<{ reason: string; explanation?: string }>
	) {
		if (selectedComment) {
			const response = await fetch(`/api/comments/${selectedComment.id}/flag`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(event.detail)
			});
			if (response.ok) {
				// Optionally, update the UI to reflect that the comment has been flagged
			}
		}
		showFlagModal = false;
		selectedComment = null;
	}

	function handleNewComment(event: CustomEvent<CommentType>) {
		let newComment = {
			id: event.detail.id,
			user_id: event.detail.user_id,
			parent_type: parentType,
			content: event.detail.content,
			created_at: event.detail.created_at,
			updated_at: event.detail.updated_at,
			is_edited: false,
			is_deleted: false,
			parent_id: parentId,
			likes: [],
			_count: [
				{
					count: 0
				}
			],
			author: user,
			likes_count: 0,
			user_has_liked: false
		};
		comments = [event.detail, ...comments];
		console.log('comments', comments);
		totalComments += 1;
	}

	async function handleDeleteComment(event: CustomEvent<{ commentId: string }>) {
		const response = await fetch(`/api/comments/${event.detail.commentId}`, {
			method: 'DELETE'
		});
		if (response.ok) {
			comments = comments.filter((c) => c.id !== event.detail.commentId);
			totalComments -= 1;
		}
	}

	onMount(fetchComments);
</script>

<div class="comments-container" style="margin-left: {depth * 20}px;">
	{#if depth === 0}
		<h2 class="mb-4 text-xl font-bold">{displayName} ({totalComments})</h2>
	{/if}

	<Comment
		{parentId}
		{parentType}
		{depth}
		displayName={replyDisplayName}
		on:newComment={handleNewComment}
		{user}
	/>

	{#each comments as comment (comment.id)}
		<Comment
			{comment}
			depth={depth + 1}
			displayName={replyDisplayName}
			on:delete={handleDeleteComment}
			on:flag={() => handleFlagComment(comment)}
			on:newComment={handleNewComment}
			{user}
		/>
	{/each}

	{#if comments.length < totalComments}
		<Button on:click={loadMoreComments} disabled={loading}>
			{loading ? 'Loading...' : `Load More ${displayName}`}
		</Button>
	{/if}

	<FlagCommentModal
		bind:showModal={showFlagModal}
		comment={selectedComment}
		on:flagged={handleCommentFlagged}
	/>
</div>

<style>
	.comments-container {
		max-width: 800px;
		margin: 0 auto;
	}
</style>
