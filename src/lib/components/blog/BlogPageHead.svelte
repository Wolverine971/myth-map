<!-- src/lib/components/blog/BlogPageHead.svelte -->
<script lang="ts">
	import { getLocationIcon } from '../../../utils/locationPhotos';

	export let data: App.BlogPost;
	export let slug: string;

	let title: string = data?.title;
	let description: string = data?.description;
	const formattedTitle = title ? `${title}` : 'Tiny Tribe Adventures';

	let jsonldString = {
		'@context': 'http://schema.org',
		'@type': 'Blog',
		name: title,
		url: `https://tinytribeadventures.com/${slug}`,
		author: {
			'@type': 'Person',
			name: 'DJ Wayne',
			sameAs: [
				'https://www.instagram.com/djwayne3/',
				'https://www.youtube.com/@djwayne3',
				'https://www.linkedin.com/in/davidtwayne/',
				'https://twitter.com/djwayne3'
			]
		},
		description: description
	};

	let icon = data?.pic ? data?.pic : 'myth-map';
	if (data?.loc) {
		icon = getLocationIcon(data?.loc);
	}

	let jsonld = JSON.stringify(jsonldString);
</script>

<svelte:head>
	<title>{formattedTitle}</title>
	<link rel="canonical" href={`https://tinytribeadventures.com/${slug}`} />
	<meta name="description" content={description || title} />
	<meta name="viewport" content="width=device-width,initial-scale=1" />

	<meta property="og:site_name" content="Tiny Tribe Adventures" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description || title} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={`https://tinytribeadventures.com/${slug}`} />
	<meta property="og:image" content={`https://tinytribeadventures.com/map/${icon}.png`} />

	<meta name="twitter:description" content={description || title} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:creator" content="@djwayne3" />
	<meta name="twitter:title" content={title} />
	<meta property="twitter:url" content={`https://tinytribeadventures.com/${slug}`} />
	<meta name="twitter:image" content={`https://tinytribeadventures.com/map/${icon}.png`} />
	{#if data?.pic}
		<meta name="twitter:image:alt" content={data?.pic?.split('-').join(' ')} />
	{/if}

	{@html `<script type="application/ld+json">${jsonld}</script>`}
</svelte:head>
