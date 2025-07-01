<!-- src/lib/components/blog/ArticleTitle.svelte -->
<script lang="ts">
	export let slug = '';
	export let title: string;
	export let size: 'sm' | 'md' | 'lg' | 'xl' = 'lg';
	
	const id = title
		?.toLowerCase()
		.replace(/[^a-zA-Z ]/g, '')
		.replace(/\s/g, '-');

	const href = slug ? `/blog/${slug}` : '#' + id;
	
	// Size classes for responsive design
	const sizeClasses = {
		sm: 'text-lg sm:text-xl font-semibold',
		md: 'text-xl sm:text-2xl font-bold',
		lg: 'text-2xl sm:text-3xl lg:text-4xl font-bold',
		xl: 'text-3xl sm:text-4xl lg:text-5xl font-bold'
	};
</script>

{#if slug}
	<h2 class="heading {sizeClasses[size]} text-gray-900 leading-tight" {id}>
		<a 
			{href} 
			class="hover:text-primary-700 transition-colors decoration-2 underline-offset-4 hover:underline"
		>
			{title}
		</a>
	</h2>
{:else}
	<h1 
		class="heading {sizeClasses[size]} text-gray-900 leading-tight" 
		{id} 
		itemprop="name"
	>
		{title}
	</h1>
{/if}

<style>
	.heading {
		margin: 0;
		text-wrap: balance;
		line-height: 1.2;
	}
	
	/* Better text rendering on all devices */
	.heading {
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		text-rendering: optimizeLegibility;
	}
	
	/* Ensure good touch targets on mobile */
	@media (max-width: 640px) {
		.heading a {
			display: block;
			padding: 0.25rem 0;
		}
	}
</style>