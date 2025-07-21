<!-- src/lib/components/shared/SEOHead.svelte -->
<script lang="ts">
	export let title: string;
	export let description: string;
	export let canonical: string = '';
	export let ogImage: string = '/myth-map.png';
	export let ogImageAlt: string = 'Tiny Tribe Adventures';
	export let type: 'website' | 'article' = 'website';
	export let keywords: string = '';
	export let author: string = 'Tiny Tribe Adventures';
	export let publishedTime: string = '';
	export let modifiedTime: string = '';
	export let structuredData: object | null = null;
	
	// Base URL
	const baseUrl = 'https://tinytribeadventures.com';
	
	// Ensure absolute URLs
	$: absoluteCanonical = canonical ? 
		(canonical.startsWith('http') ? canonical : `${baseUrl}${canonical}`) : '';
	$: absoluteOgImage = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;
	
	// Clean title for page title
	$: pageTitle = title.includes('Tiny Tribe Adventures') ? title : `${title} | Tiny Tribe Adventures`;
	
	// Default keywords
	$: allKeywords = keywords ? 
		`${keywords}, family activities, kids activities, family fun, Maryland, Virginia, Delaware, DC` :
		'family activities, kids activities, family fun, Maryland, Virginia, Delaware, DC';
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>{pageTitle}</title>
	<meta name="title" content={pageTitle} />
	<meta name="description" content={description} />
	<meta name="keywords" content={allKeywords} />
	<meta name="author" content={author} />
	<meta name="robots" content="index, follow" />
	
	<!-- Canonical URL -->
	{#if absoluteCanonical}
		<link rel="canonical" href={absoluteCanonical} />
	{/if}
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content={type} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={absoluteOgImage} />
	<meta property="og:image:alt" content={ogImageAlt} />
	<meta property="og:site_name" content="Tiny Tribe Adventures" />
	{#if absoluteCanonical}
		<meta property="og:url" content={absoluteCanonical} />
	{/if}
	{#if publishedTime}
		<meta property="article:published_time" content={publishedTime} />
	{/if}
	{#if modifiedTime}
		<meta property="article:modified_time" content={modifiedTime} />
	{/if}
	
	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:title" content={title} />
	<meta property="twitter:description" content={description} />
	<meta property="twitter:image" content={absoluteOgImage} />
	<meta property="twitter:image:alt" content={ogImageAlt} />
	
	<!-- Additional Meta Tags -->
	<meta name="theme-color" content="#014421" />
	<meta name="msapplication-TileColor" content="#014421" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<meta name="apple-mobile-web-app-title" content="Tiny Tribe Adventures" />
	
	<!-- Structured Data -->
	{#if structuredData}
		{@html `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`}
	{/if}
</svelte:head>