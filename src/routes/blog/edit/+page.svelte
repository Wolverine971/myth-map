<script lang="ts">
	import type { PageData } from './$types';
	import { Select, Label, Button, Input } from 'flowbite-svelte';
	import { marked } from 'marked';

	export let data: PageData;
	let markdown = '';
	let description = '';
	let selected = null;
	// const blogs = [];
	const blogs: any[] = data?.locationBlogs
		? data?.locationBlogs.map((blog) => {
				if (blog) {
					blog.name = blog?.title;
					blog.value = blog || '';
				}
				return blog;
			})
		: [];

	const save = async () => {
		// console.log(markdown);
		// console.log(selected);

		let body = new FormData();
		body.append('markdown', markdown);
		body.append('loc', selected.loc);
		body.append('description', description);

		const res = await fetch('?/save', {
			method: 'POST',
			body
		});

		if (res.ok) {
			alert('Saved');
		} else {
			alert('Error');
		}
	};
	const itemChanged = (e) => {
		markdown = selected?.content || '';
		description = selected?.description || '';
	};
</script>

{#if blogs.length}
	<Label>
		Select an option
		<Select class="mt-2" items={blogs} bind:value={selected} on:change={itemChanged} />
	</Label>
{/if}

{#if selected}
	<div>{selected?.title}</div>

	<!-- <input type="text" bind:value={description} placeholder="Description" class=""/> -->
	<Input type="text" id="description" bind:value={description} placeholder="Description" />

	<textarea bind:value={markdown} placeholder="Enter markdown here" />

	<!-- Convert the markdown to HTML and display it -->
	<div class="preview">{@html marked(markdown)}</div>
	<Button type="button" on:click={save}>Save</Button>
{/if}

<style lang="scss">
	textarea,
	.preview {
		box-sizing: border-box;
		display: block;
		width: 100%;
	}

	textarea {
		font-family: monospace, Roboto;
		height: 500px;
		border: none;
		margin: 0;
		padding: 1rem;
	}

	.preview {
		height: 75%;
		padding: 2rem;
		border-top: solid 2px #888;
	}
</style>
