<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import BlogPageHead from '$lib/components/blog/BlogPageHead.svelte';
	import ArticleTitle from '$lib/components/blog/ArticleTitle.svelte';
	import ArticleSubTitle from '$lib/components/blog/ArticleSubTitle.svelte';
	import { marked } from 'marked';
	import { Button, Card, Heading } from 'flowbite-svelte';
	import { notifications } from '$lib/components/shared/notifications';
	import LocationCard from '$lib/components/locations/LocationCard.svelte';
	// import ArticleDescription from '$lib/components/blog/ArticleDescription.svelte';
	// import SuggestionsBlog from '$lib/components/blog/SuggestionsBlog.svelte';
	// import EmailSignup from '$lib/components/molecules/Email-Signup.svelte';
	export let data: PageData;
	const content = data.blog?.content ? marked(data.blog?.content) : '';

	let loading = false;
	const placesToEatMap = {};
	const activityMap = {};
	let placesToEat: any[] = [];
	let activities: any[] = [];

	onMount(() => {
		const filteredPlacesToEat = data.locationTags.filter((tag) => tag.tags.name === 'Food');
		filteredPlacesToEat.forEach((tag) => {
			placesToEatMap[tag.locations.name] = true;
		});

		data.locationTags.forEach((tag) => {
			if (!placesToEatMap[tag.locations.name]) {
				activityMap[tag.locations.name] = true;
			}
		});

		const tempPlacesToEat = [];
		data.nearbyLocations.forEach((location) => {
			if (placesToEatMap[location.name]) {
				tempPlacesToEat.push(location);
			}
		});
		const tempActivities = [];
		data.nearbyLocations.forEach((location) => {
			if (activityMap[location.name]) {
				tempActivities.push(location);
			}
		});
		placesToEat = tempPlacesToEat;
		activities = tempActivities;
		console.log(placesToEat);
		console.log(activities);
	});

	const findNearby = async () => {
		loading = true;

		let body = new FormData();
		body.append('lat', '39.272216'.toString());
		body.append('lng', '-76.731829'.toString());

		const { data, error: ingestError } = await (
			await fetch(`?/findNearby`, {
				method: 'POST',
				body
			})
		).json();

		if (data) {
			notifications.info('locations found', 3000);
		} else {
			notifications.warning('locations not found', 3000);
		}
		loading = false;
	};
</script>

{#if data.blog}
	<article itemscope itemtype="https://schema.org/BlogPosting" style="" class="blog">
		<div style="align-items: inherit;">
			<BlogPageHead data={data.blog} slug={`blog/${data?.blog?.loc}`} />
			<ArticleTitle title={data.blog?.title} />
			<ArticleSubTitle metaData={data.blog} />
		</div>

		<!-- <Button type="button" on:click={findNearby}>Find Nearby Locations</Button> -->
		{#if content}
			<div class="preview">{@html content}</div>
		{:else}
			<p style="margin: 5rem 0;">Information Needed</p>
		{/if}

		<hr />
		<br />
		{#if data.nearbyLocations}
			<Heading tag="h2" class="mb-4" customSize="text-4xl ">
				Near By Family Friendly Activities
			</Heading>

			{#if data.suggestions}
				<!-- todo suggestions -->
				<div style="display: flex; flex-direction: column; max-width: 50%; gap: 0.2rem;">
					<h3>Suggestions</h3>
					{#if data.suggestions.length === 0}
						<p>No suggestions found</p>
					{:else}
						{#each placesToEat as location}
							<LocationCard
								name={location.name}
								coords={{ lat: location.lat, lng: location.long }}
								address={`${`${location.address_line_1}${location.address_line_2 ? ` ${location.address_line_2}` : ''}`}, ${location.city}, ${location.state} ${location.zip_code}`}
								website={location.website}
								tags={data.locationTags.filter((tag) => tag.locations.name === location.name)}
							/>
						{/each}
					{/if}
				</div>
			{/if}

			<div style="display: flex; gap: 1rem">
				<div style="display: flex; flex-direction: column; max-width: 50%; gap: 0.2rem;">
					<h3>Places to Eat</h3>
					{#if placesToEat.length === 0}
						<p>No places to eat found</p>
					{:else}
						{#each placesToEat as location}
							<LocationCard
								name={location.name}
								coords={{ lat: location.lat, lng: location.long }}
								address={`${`${location.address_line_1}${location.address_line_2 ? ` ${location.address_line_2}` : ''}`}, ${location.city}, ${location.state} ${location.zip_code}`}
								website={location.website}
								tags={data.locationTags.filter((tag) => tag.locations.name === location.name)}
							/>
						{/each}
					{/if}
				</div>

				<div style="display: flex; flex-direction: column; max-width: 50%; gap: 0.2rem;">
					<h3>Activities</h3>
					{#if activities.length === 0}
						<p>No activities found</p>
					{:else}
						{#each activities as location}
							<LocationCard
								name={location.name}
								coords={{ lat: location.lat, lng: location.long }}
								address={`${`${location.address_line_1}${location.address_line_2 ? ` ${location.address_line_2}` : ''}`}, ${location.city}, ${location.state} ${location.zip_code}`}
								website={location.website}
								tags={data.locationTags.filter((tag) => tag.locations.name === location.name)}
							/>
						{/each}
					{/if}
				</div>
			</div>
		{/if}
	</article>
{/if}

<hr style="margin: 5rem;" />

<!-- <SuggestionsBlog posts={data?.posts} blogType={'enneagram'} /> -->

{#if !data?.session?.user}
	<div class="join">
		<!-- <EmailSignup /> -->
	</div>
{/if}

<style lang="scss">
	.preview {
		h1 {
			font-size: 2.5rem;
		}
		h2 {
			font-size: 2rem;
		}
	}
</style>
