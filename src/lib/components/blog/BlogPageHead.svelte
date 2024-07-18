<script lang="ts">
	export let data: App.BlogPost;
	export let slug: string;

	let title: string = data?.title;
	let description: string = data?.description;
	const formattedTitle = title ? `${title}` : 'Tiny Tribe Adventures';

	let jsonldString = {
		'@context': 'http://schema.org',
		'@type': 'Blog',
		name: title,
		url: `https://myth-map.vercel.app/${slug}`,
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
		// publisher: {
		// 	'@type': 'Organization',
		// 	sameAs: ['https://www.instagram.com/9takesdotcom/', 'https://twitter.com/9takesdotcom'],
		// 	logo: {
		// 		'@type': 'ImageObject',
		// 		url: 'https://myth-map.vercel.app/brand/darkRubix.png'
		// 	},
		// 	name: '9takes'
		// }
	};

	let jsonld = JSON.stringify(jsonldString);
</script>

<svelte:head>
	<title>{formattedTitle}</title>
	<link rel="canonical" href={`https://myth-map.vercel.app/${slug}`} />
	<meta name="description" content={description || title} />
	<meta name="viewport" content="width=device-width,initial-scale=1" />

	<meta property="og:site_name" content="Tiny Tribe Adventures" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={data?.description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={`https://myth-map.vercel.app/${slug}`} />
	<meta property="og:image" content={`https://myth-map.vercel.app/blogs/${data?.pic}.webp`} />

	<!-- <meta name="twitter:site" content="@9takesdotcom" /> -->
	<meta name="twitter:description" content={description || title} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:creator" content="@djwayne3" />
	<meta name="twitter:title" content={title} />
	<meta property="twitter:url" content={`https://myth-map.vercel.app/${slug}`} />
	<meta name="twitter:image" content={`https://myth-map.vercel.app/blogs/${data?.pic}.webp`} />
	{#if data?.pic}
		<meta name="twitter:image:alt" content={data?.pic?.split('-').join(' ')} />
	{/if}

	{@html `<script type="application/ld+json">${jsonld}</script>`}
</svelte:head>
