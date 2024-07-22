<script lang="ts">
	import { Card, Button, type SizeType } from 'flowbite-svelte';
	import { getLocationIcon } from '../../../utils/locationPhotos';
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
<!-- img="{`/map/${getLocationIcon(name)}.png`}" -->
<Card horizontal {size} reverse={hCard}>
	<img src={`/map/${getLocationIcon(name)}.png`} alt="" class="img-icon" />

	<div style="display: flex; flex-direction: column; min-height: 170px; margin-left: .5rem;">
		<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
			{name}
		</h5>
		<p class="mb-3 font-normal leading-tight text-gray-700 dark:text-gray-400" style="">
			{addressPart1}
			<br />
			{addressPart2}
		</p>

		{#if tags?.length}
			<ul class="tag-list">
				{#each tags as tag}
					<li class="chip {size === 'sm' && 'small-chip'}">
						{tag?.tags.name}
					</li>
				{/each}
			</ul>
		{/if}
		<div style="margin-top: auto;">
			<a href={website} target="_blank" rel="noopener noreferrer">
				<Button outline color="primary" size="md" block>Visit Website</Button>
			</a>
			<a
				href={`/blog/locations/${name.replace(/\s/g, '-')}`}
				style="margin-top: auto; margin-left: auto; "
			>
				<Button outline color="alternative" size="md" block>More Info</Button>
			</a>
		</div>
	</div>
</Card>

<!-- <div class="space-y-4">
  <Card img="/images/image-1.webp" href="/" horizontal size="md" reverse={hCard}>
    <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Noteworthy technology acquisitions 2021</h5>
    <p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.</p>
  </Card>
  <Toggle bind:checked={hCard} class="italic dark:text-gray-500">Reverse</Toggle>
</div> -->
<style>
	.img-icon {
		object-fit: contain !important;
		width: 12rem;
	}
	.object-cover {
		object-fit: contain;
	}
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
