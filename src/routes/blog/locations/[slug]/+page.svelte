<script lang="ts">
	import type { PageData } from './$types';
	import type { SvelteComponent } from 'svelte';
	import BlogPageHead from '$lib/components/blog/BlogPageHead.svelte';
	import ArticleTitle from '$lib/components/blog/ArticleTitle.svelte';
	import ArticleSubTitle from '$lib/components/blog/ArticleSubTitle.svelte';
	import { marked } from 'marked';
	// import ArticleDescription from '$lib/components/blog/ArticleDescription.svelte';
	// import SuggestionsBlog from '$lib/components/blog/SuggestionsBlog.svelte';
	// import EmailSignup from '$lib/components/molecules/Email-Signup.svelte';
	export let data: PageData;
	const content = data.blog?.content ? marked(data.blog?.content) : '';
</script>

{#if data.blog}
	<article itemscope itemtype="https://schema.org/BlogPosting" style="" class="blog">
		<div style="align-items: inherit;">
			<BlogPageHead data={data.blog} slug={`blog/${data?.blog?.loc}`} />
			<ArticleTitle title={data.blog?.title} />
			<ArticleSubTitle metaData={data.blog} />
		</div>

		{#if content}
			<div class="preview">{@html content}</div>
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
