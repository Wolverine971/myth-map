<script lang="ts">
	import { Button, Card, Badge, A } from 'flowbite-svelte';
	import EditBlogModal from '../blog/EditBlogModal.svelte';
	import { notifications } from '$lib/components/shared/notifications';

	export let blogContent: App.BlogPost;
	export let stage: string | null = null;

	const stagesContentRetrieval = ['Sent out for review', 'Reviewed', 'Socialized', 'Growing'];
	let showEditModal = false;

	const url = `/locations/states/${blogContent.location.state}/${blogContent.location.city}/${blogContent.loc}`;

	async function getInfo() {
		try {
			// Implement the update logic here
			console.log('Getting update for', blogContent.title);
			notifications.info('Content update requested', 3000);
		} catch (error) {
			console.error('Error getting update:', error);
			notifications.danger('Error getting update', 3000);
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString();
	}
</script>

<div>
	<!-- <h3 class="mb-2 text-xl font-semibold">{blogContent.title}</h3> -->
	<p class="mb-4 text-gray-600">{blogContent.description}</p>

	<div class="mb-4 flex flex-wrap gap-2">
		<Badge color="blue">Date: {formatDate(blogContent.date)}</Badge>
		<Badge color="green">Last Modified: {formatDate(blogContent.lastmod)}</Badge>

		<br />

		<A href={url} target="_blank">View Blog &#8594;</A>
	</div>

	<div class="mb-4 flex flex-wrap gap-2">
		<Button size="xs" on:click={() => (showEditModal = true)}>Edit Blog</Button>
		{#if stage && stagesContentRetrieval.includes(stage)}
			<Button size="xs" on:click={getInfo}>Get Update</Button>
		{/if}
	</div>

	<div class="text-sm text-gray-600">
		<p><strong>Author:</strong> {blogContent.author}</p>
		<p><strong>Location:</strong> {blogContent.location.city}, {blogContent.location.state}</p>
		<p><strong>Type:</strong> {blogContent.type || 'N/A'}</p>
		<p style="color:{!blogContent.opening_times ? 'red' : ''}"><strong>Opening Times</strong> {blogContent.opening_times}</p>
		<p style="color:{!blogContent.phone_number ? 'red' : ''}"><strong>Phone Number:</strong> {blogContent.phone_number}</p>
		<p style="color:{!blogContent.email ? 'red' : ''}"><strong>Email:</strong> {blogContent.email}</p>
		<p><strong>Comment Count:</strong>{blogContent.comment_count}</p>

	</div>
</div>

<EditBlogModal bind:show={showEditModal} blog={blogContent} />
