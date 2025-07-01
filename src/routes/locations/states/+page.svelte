<!-- src/routes/locations/states/+page.svelte -->
<script lang="ts">
	import { Heading, Card } from 'flowbite-svelte';

	import type { PageData } from './$types';

	import { findState } from '../../../utils/geoDataLoader';
	export let data: PageData;
	let innerWidth = 0;
	let size = 'lg';

	let stateData = data.stateData.map((state) => {
		return {
			name: findState(state.state)?.name,
			location_count: state.location_count,
			abr: state.state
		};
	});
</script>

<Heading tag="h1" class="mb-3" customSize="text-2xl font-extrabold  md:text-3xl">States</Heading>
<!-- Display list of states -->

{#each stateData as state}
	<Card horizontal {size} class="cardSize" padding="sm" href="/locations/states/maryland">
		<!-- <a href="https://www.flaticon.com/free-icons/maryland" title="maryland icons">Maryland icons created by Linseed Studio - Flaticon</a> -->
		<img src="/states/{state.name}.png" alt="" class="img-icon" />

		<div class="card-content">
			<h5 class="card-title">{state.name}</h5>
			<div class="card-actions">
				Location Count: {state.location_count}
			</div>
		</div>
	</Card>
{/each}

<style>
	@media (max-width: 500px) {
		.cardSize {
			padding: 0.5rem !important;
		}
	}
	.img-icon {
		object-fit: contain;
		width: 12rem;
	}
	.card-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 170px;
		margin-left: 0.5rem;
	}
	.card-title {
		margin-bottom: 0.5rem;
		font-size: 1.5rem;
		font-weight: bold;
		line-height: 1.2;
	}
	.card-address {
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
		line-height: 1.25;
	}
	.tag-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2rem;
		margin: 0.5rem 0;
	}
	.chip {
		background-color: #f1f1f1;
		border-radius: 10px;
		padding: 0.2rem 0.5rem;
		font-size: medium;
		pointer-events: none;
	}
	.small-chip {
		padding: 0.1rem 0.3rem;
		font-size: small;
	}
	.card-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}
	.distance-info {
		margin-top: 0.25rem;
		height: 43px;
	}
</style>
