<script lang="ts">
	import { A, Button } from 'flowbite-svelte';
	import EditBlogModal from '../blog/EditBlogModal.svelte';

	export let blogContent = null;
	export let stage = null;

	const stages = [
		'Not written',
		'Written',
		'Sent out for review',
		'Reviewed',
		'Socialized',
		'Growing'
	];
	const stagesContentRetrievaL = ['Sent out for review', 'Reviewed', 'Socialized', 'Growing'];
	const getInfo = () => {
		console.log('Get Update');
	};
	let showModal = false;
	console.log(blogContent);
	console.log(location);
	const url = `/locations/states/${blogContent.location.state}/${blogContent.location.city}/${blogContent.loc}`;
</script>

<div class="panel">
	<p><strong>Description</strong>: {blogContent.description}</p>

	<p><strong>Date</strong>: {blogContent.date}</p>

	<p><strong>Last Modified</strong>: {blogContent.lastmod}</p>

	<Button type="button" on:click={() => (showModal = true)}>Edit Blog</Button>
	<EditBlogModal bind:show={showModal} blog={blogContent} />
	<A href={url}>Link</A>

	<details>
		<summary class="accordion">More</summary>
		<div class="panel">
			{#each Object.entries(blogContent) as [key, value]}
				{#if key !== 'title'}
					<p>
						<strong>{key.toLocaleUpperCase()}</strong>: {value}
					</p>
				{/if}
			{/each}
		</div>
	</details>

	{#if stage && stagesContentRetrievaL.includes(stage)}
		<button class="btn btn-primary" type="button" on:click={getInfo}>Get Update</button>
	{/if}
</div>

<style lang="scss">
	p {
		align-items: inherit;
		margin: 0;
		margin-bottom: calc(var(--spacing-unit) * 2);
	}
	@media (max-width: 500px) {
		p {
			margin: calc(var(--spacing-unit));
		}
	}
</style>
