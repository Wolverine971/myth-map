<script lang="ts">
	import { Modal, Button, Input, Label } from 'flowbite-svelte';
	import { marked } from 'marked';
	import { notifications } from '../shared/notifications';

	export let show = false;
	export let blog: any = null;

	let markdown = '';
	let description = '';
	let initialLoad = false;

	console.log('fix this blog edit modal');
	$: if (blog) {
		console.log(blog);
		if (!initialLoad) {
			markdown = blog.content || '';
			description = blog.description || '';
			initialLoad = true;
		}
	}

	// onMount(() => {
	//     markdown = blog.content || '';
	// 	description = blog.description || '';
	// });
	const save = async () => {
		let body = new FormData();
		body.append('markdown', markdown);
		body.append('loc', blog.loc);
		body.append('description', description);

		const res = await fetch('/blog/edit?/save', {
			method: 'POST',
			body
		});

		if (res.ok) {
			notifications.info('Blog saved', 3000);
			show = false;
			initialLoad = false;
		} else {
			notifications.danger('Error saving blog', 3000);
		}
	};
</script>

<Modal bind:open={show} size="xl">
	<h2 slot="header">{blog?.title}</h2>
	<div class="space-y-4">
		<Label class="space-y-2">
			<span>Description</span>
			<Input type="text" bind:value={description} placeholder="Description" />
		</Label>
		<Label class="space-y-2">
			<span>Content</span>
			<textarea
				bind:value={markdown}
				placeholder="Enter markdown here"
				class="h-64 w-full rounded border p-2"
			/>
		</Label>
		<div class="preview rounded border p-4">
			{@html marked(markdown)}
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button type="button" on:click={save}>Save</Button>
		<Button color="alternative" type="button" on:click={() => (show = false)}>Close</Button>
	</svelte:fragment>
</Modal>

<style>
	.preview {
		max-height: 300px;
		overflow-y: auto;
	}
</style>
