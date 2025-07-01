<!-- src/lib/components/blog/LocationPageHead.svelte -->
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
		image: iconUrl
	};

	if (blogContent.location.website) {
		jsonldString['mainEntityOfPage'] = blogContent.location.website;
	}

	const jsonld = JSON.stringify(jsonldString);

	// goalz
	// 	{
	//   "@context": "http://schema.org",
	//   "@type": ["TouristAttraction", "Park", "PlayAction"],
	//   "name": "Cedar Lane Park East Playground",
	//   "description": "Explore Cedar Lane Park East Playground, a family-friendly location in Columbia, MD. This playground offers fun activities for children and is part of the larger Cedar Lane Park. Find nearby activities, places to eat, and more with Tiny Tribe Adventures.",
	//   "url": "https://tinytribeadventures.com/locations/states/MD/Columbia/Cedar-Lane-Park-East-Playground",
	//   "address": {
	//     "@type": "PostalAddress",
	//     "streetAddress": "Cedar Lane Path",
	//     "addressLocality": "Columbia",
	//     "addressRegion": "MD",
	//     "postalCode": "21044",
	//     "addressCountry": "US"
	//   },
	//   "geo": {
	//     "@type": "GeoCoordinates",
	//     "latitude": 39.215411,
	//     "longitude": -76.8577
	//   },
	//   "image": {
	//     "@type": "ImageObject",
	//     "url": "https://tinytribeadventures.com/map/playground.png",
	//     "height": "512",
	//     "width": "512"
	//   },
	//   "isAccessibleForFree": true,
	//   "publicAccess": true,
	//   "amenityFeature": [
	//     {
	//       "@type": "LocationFeatureSpecification",
	//       "name": "Playground Equipment",
	//       "value": true
	//     },
	//     {
	//       "@type": "LocationFeatureSpecification",
	//       "name": "Picnic Area",
	//       "value": true
	//     }
	//   ],
	//   "tourBookingPage": "https://tinytribeadventures.com/book-tour",
	//   "suitableForChildren": true,
	//   "openingHoursSpecification": {
	//     "@type": "OpeningHoursSpecification",
	//     "dayOfWeek": [
	//       "Monday",
	//       "Tuesday",
	//       "Wednesday",
	//       "Thursday",
	//       "Friday",
	//       "Saturday",
	//       "Sunday"
	//     ],
	//     "opens": "06:00",
	//     "closes": "22:00"
	//   },
	//   "review": {
	//     "@type": "Review",
	//     "reviewRating": {
	//       "@type": "Rating",
	//       "ratingValue": "4.5",
	//       "bestRating": "5"
	//     },
	//     "author": {
	//       "@type": "Person",
	//       "name": "John Doe"
	//     },
	//     "reviewBody": "Great playground for kids! The equipment is well-maintained and there's plenty of space for running around."
	//   }
	// }
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
<!-- 
buzzsumo 
I already have a users table and I dont need to track user_id on campaigns the content
table needs to be flexible and able to store markdown and -->
