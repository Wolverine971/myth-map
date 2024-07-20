<script lang="ts">
	import { Card, Button, type SizeType } from 'flowbite-svelte';
	let hCard = false;
	export let name;
	export let address;
	export let website;
	export let tags;
	export let size: SizeType = 'md';

	const addressPart1 = address.split(',')[0];
	const addressPart2 = address.split(',').slice(1);
</script>

<!-- img={`/tag-images/${tags[0] || 'myth-map'}.png`} -->
<Card horizontal {size} reverse={hCard}>
	<div
		style="width: calc(100% - 10px); display: flex; flex-direction: column; height: 100%; min-height: 170px;"
	>
		<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
			{name}
		</h5>
		<p
			class="mb-3 font-normal leading-tight text-gray-700 dark:text-gray-400"
			style="margin-top: auto;"
		>
			{addressPart1}
			<br />
			{addressPart2}
		</p>
		<a href={website} target="_blank" rel="noopener noreferrer">
			<Button color="primary" size="md" block>Visit Website</Button>
		</a>
	</div>

	<div style="width: 50%; height: 100%;display: flex; flex-direction: column; gap: 0.5rem;">
		{#if tags?.length}
			<ul class="tag-list">
				{#each tags as tag}
					<li class="chip {size === 'sm' && 'small-chip'}">
						{tag?.tags.name}
					</li>
				{/each}
			</ul>
		{/if}
		<a
			href={`/blog/locations/${name.replace(/\s/g, '-')}`}
			style="margin-top: auto; margin-left: auto; border: 1px solid; border-radius: .5rem;"
		>
			<Button outline color="alternative" size="md" block>More Info</Button>
		</a>
	</div>
</Card>

<style>
	.tag-list {
		display: flex;
		align-items: baseline;
		gap: 0.2rem;
		margin-top: 0.2rem;
		flex-wrap: wrap;
	}
	.chip {
		background-color: #f1f1f1;
		border-radius: 10px;
		padding: 0.2rem 0.5rem;
		display: flex;
		font-size: medium;
		pointer-events: none;
	}
	.small-chip {
		padding: 0.1rem 0.3rem;
		font-size: small;
	}
	/* .chip:hover {
		background-color: #e1e1e1;
	} */
</style>
