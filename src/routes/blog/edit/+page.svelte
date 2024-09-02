<script lang="ts">
	import type { PageData } from './$types';
	import { Select, Label } from 'flowbite-svelte';
	import EditBlogModal from '$lib/components/blog/EditBlogModal.svelte';

	export let data: PageData;
	let showModal = false;
	let selectedBlog = null;
	const blogs: any[] = data?.locationBlogs
		? data?.locationBlogs.map((blog) => {
				if (blog) {
					blog.name = blog?.title;
					blog.value = blog || '';
				}
				return blog;
			})
		: [];

	const itemChanged = () => {
		if (selectedBlog) {
			showModal = true;
		}
	};
</script>

<div class="container mx-auto p-4">
	<h1 class="mb-4 text-2xl font-bold">Edit Blogs</h1>

	{#if blogs.length}
		<Label class="mb-4">
			Select a blog to edit
			<Select class="mt-2" items={blogs} bind:value={selectedBlog} on:change={itemChanged} />
		</Label>
	{:else}
		<p>No blogs available.</p>
	{/if}

	<EditBlogModal bind:show={showModal} blog={selectedBlog} />
</div>
