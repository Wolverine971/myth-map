<script lang="ts">
	import { getLocationIcon } from '../../../utils/locationPhotos';

	interface BlogContent {
		id: number;
		created_at: string;
		title: string;
		description: string | null;
		date: string | null;
		lastmod: string | null;
		loc: string;
		published: boolean;
		type: string | null;
		stageName: string | null;
		content: string | null;
		author: string | null;
		stagename: string | null;
		comment_count: number;
		location: LocationData;
	}

	interface LocationData {
		id: number;
		created_at: string;
		updated_at: string | null;
		name: string;
		address_line_1: string;
		address_line_2: string | null;
		city: string;
		state: string;
		zip_code: string;
		website: string | null;
		lat: number;
		lng: number;
	}

	export let blogContent: BlogContent;
	export let slug: string;

	const title = `${blogContent.title} - Family Friendly Location | Tiny Tribe Adventures`;
	const description =
		blogContent.description ||
		`Explore ${blogContent.title}, a family-friendly location in ${blogContent.location.city}, ${blogContent.location.state}. Find nearby activities, places to eat, and more with Tiny Tribe Adventures.`;

	const fullAddress = `${blogContent.location.address_line_1}${blogContent.location.address_line_2 ? `, ${blogContent.location.address_line_2}` : ''}, ${blogContent.location.city}, ${blogContent.location.state} ${blogContent.location.zip_code}`;

	const icon = getLocationIcon(blogContent.loc);
	const iconUrl = `https://tinytribeadventures.com/map/${icon}.png`;

	const jsonldString = {
		'@context': 'http://schema.org',
		'@type': 'TouristAttraction',
		name: blogContent.title,
		description: description,
		url: `https://tinytribeadventures.com/${slug}`,
		address: {
			'@type': 'PostalAddress',
			streetAddress: `${blogContent.location.address_line_1}${blogContent.location.address_line_2 ? ` ${blogContent.location.address_line_2}` : ''}`,
			addressLocality: blogContent.location.city,
			addressRegion: blogContent.location.state,
			postalCode: blogContent.location.zip_code,
			addressCountry: 'US'
		},
		geo: {
			'@type': 'GeoCoordinates',
			latitude: blogContent.location.lat,
			longitude: blogContent.location.lng
		},
		image: iconUrl,
		suitableForChildren: true,
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
		publisher: {
			'@type': 'Organization',
			name: 'Tiny Tribe Adventures',
			logo: {
				'@type': 'ImageObject',
				url: 'https://tinytribeadventures.com/map/mythmap.png'
			}
		},
		datePublished: blogContent.created_at,
		dateModified: blogContent.lastmod || blogContent.created_at
	};

	if (blogContent.location.website) {
		jsonldString['mainEntityOfPage'] = blogContent.location.website;
	}

	const jsonld = JSON.stringify(jsonldString);
</script>

<svelte:head>
	<title>{title}</title>
	<link rel="canonical" href={`https://tinytribeadventures.com/${slug}`} />
	<meta name="description" content={description} />
	<meta name="viewport" content="width=device-width,initial-scale=1" />

	<meta property="og:site_name" content="Tiny Tribe Adventures" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={`https://tinytribeadventures.com/${slug}`} />
	<meta property="og:image" content={iconUrl} />

	<meta name="twitter:description" content={description} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:creator" content="@djwayne3" />
	<meta name="twitter:title" content={title} />
	<meta property="twitter:url" content={`https://tinytribeadventures.com/${slug}`} />
	<meta name="twitter:image" content={iconUrl} />
	<meta name="twitter:image:alt" content={`Icon for ${blogContent.title}`} />

	{@html `<script type="application/ld+json">${jsonld}</script>`}
</svelte:head>
