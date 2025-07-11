// src/routes/sitemap.xml/+server.ts
import { supabase } from '$lib/supabaseClient';

// const SITE_URL = 'tinytribeadventures.com';

const getAllLocations = async () => {
	const { data: locations, error } = await supabase.from(`content_locations`)
		.select(`*, location:locations(*)`);

	if (error) {
		console.log(error);
	}
	// go through approval process
	// join locations and content_locations

	const citiesMap = {}

	const goodLocations = locations.map((location) => {
		citiesMap[location.location.city] = true;
		return {
			loc: escapeXmlUrl(`https://tinytribeadventures.com/locations/states/${location.location.state}/${location.location.city.replace(/ /g, '-')}/${location.loc}`),
			lastmod: location.updated_at,
			changefreq: 'weekly'
		};
	});
	const cities = Object.keys(citiesMap).map((city) => {
		return {
			loc: escapeXmlUrl(`https://tinytribeadventures.com/locations/states/MD/${city.replace(/ /g, '-')}`),
			lastmod: '2024-08-05',
			changefreq: 'weekly'
		};
	});
	return [...cities, ...goodLocations];

};

export async function GET() {
	const locations = await getAllLocations();

	return new Response(
		`
	<?xml version="1.0" encoding="UTF-8" ?>
	<urlset
	  xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
	  xmlns:xhtml="https://www.w3.org/1999/xhtml"
	  xmlns:mobile="https://www.google.com/schemas/sitemap-mobile/1.0"
	  xmlns:news="https://www.google.com/schemas/sitemap-news/0.9"
	  xmlns:image="https://www.google.com/schemas/sitemap-image/1.1"
	  xmlns:video="https://www.google.com/schemas/sitemap-video/1.1"
	>

	<url>
	    <loc>https://tinytribeadventures.com</loc>
	    <lastmod>2024-07-03</lastmod>
	    <changefreq>monthly</changefreq>
	    <priority>1.0</priority>
	</url>
	<url>
	    <loc>https://tinytribeadventures.com/locations</loc>
	    <lastmod>2024-08-05</lastmod>
	    <changefreq>monthly</changefreq>
	    <priority>1.0</priority>
	</url>
	<url>
	    <loc>https://tinytribeadventures.com/about</loc>
	    <lastmod>2024-04-05</lastmod>
	    <changefreq>monthly</changefreq>
	    <priority>0.7</priority>
	</url>
	<url>
	    <loc>https://tinytribeadventures.com/locations/states/MD</loc>
	    <lastmod>2024-09-10</lastmod>
	    <changefreq>monthly</changefreq>
	    <priority>0.7</priority>
	</url>

	

	${locations
				.map((post) => {
					return `<url>
			<loc>${post.loc}</loc>
			<lastmod>${post?.lastmod ? new Date(post?.lastmod).toISOString() : new Date().toISOString()}</lastmod>
			<changefreq>monthly</changefreq>
			<priority>0.7</priority>
			</url>`
				})
				.join('')}
	

	  
			

	</urlset>`.trim(),
		{
			headers: {
				'Content-Type': 'application/xml'
			}
		}
	);
}

// ${
// 	locations
// 		.map((post) => {
// 			return `<url>
// 			<loc>${post.loc}</loc>
// 			<lastmod>${post?.lastmod ? new Date(post?.lastmod).toISOString() : new Date().toISOString()}</lastmod>
// 			<changefreq>monthly</changefreq>
// 			<priority>0.7</priority>
// 			</url>`
// 		})
// 	.join('')
// }

function escapeXmlUrl(url) {
	const xmlEntities = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&apos;',
		',': '%2C' // URL encode commas
	};

	return url.replace(/[&<>"',]/g, function (char) {
		return xmlEntities[char] || char;
	});
}
