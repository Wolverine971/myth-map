<script lang="ts">
	import type { PageData } from './$types';
	import type { SvelteComponent } from 'svelte';
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
	
	console.log(data)
	let loading = false;

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
		{/if}

		{#if data.nearbyLocations}
			<Heading tag="h2" class="mb-4" customSize="text-4xl font-extrabold md:text-5xl">Near By Family Friendly Activities</Heading>
			<div style="display: flex; flex-wrap: wrap">
				{#each data.nearbyLocations as location}
					
					<!-- <Card href="{`/blog/locations/${location.name.replace(/\s/g, '-')}`}" horizontal size="md" >
						<div>{location.name}</div>
					</Card> -->
					<LocationCard
							name={location.name}
							address={`${`${location.address_line_1}${location.address_line_2 ? ` ${location.address_line_2}` : ''}`}, ${location.city}, ${location.state} ${location.zip_code}`}
							website={location.website}
							tags={data?.locationTags ? data?.locationTags.filter((tag) => tag.locations.name === location.name) : []}
							size="sm"
						/>
				{/each}
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
