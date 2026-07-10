// src/routes/sitemap.xml/+server.ts
import {
	listEntries,
	statesAvailable,
	citiesInState,
	entriesForCity
} from '$lib/server/content/loader';

export const prerender = true;

const SITE = 'https://tinytribeadventures.com';

function escapeXml(s: string) {
	return s.replace(
		/[&<>"']/g,
		(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!
	);
}

type SitemapUrl = {
	loc: string;
	lastmod?: string;
};

function maxLastModified(dates: Array<string | undefined | null>): string | undefined {
	const valid = dates.filter(
		(d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)
	);
	if (!valid.length) return undefined;
	return valid.sort().reverse()[0];
}

export async function GET() {
	const allEntries = listEntries();
	const publishedEntries = allEntries.filter((e) => e.frontmatter.published);
	const catalogLastModified = maxLastModified(allEntries.map((e) => e.frontmatter.last_modified));
	const publishedLastModified = maxLastModified(
		publishedEntries.map((e) => e.frontmatter.last_modified)
	);

	const urls: SitemapUrl[] = [];

	// Static top-level pages
	urls.push(
		{ loc: SITE, lastmod: catalogLastModified },
		{ loc: `${SITE}/locations`, lastmod: catalogLastModified },
		{ loc: `${SITE}/blog`, lastmod: publishedLastModified },
		{ loc: `${SITE}/about` },
		{ loc: `${SITE}/press` },
		{ loc: `${SITE}/contact` }
	);

	// State hub pages — lastmod = max last_modified of entries in that state
	for (const state of statesAvailable()) {
		const stateEntries = allEntries.filter((e) => e.stateSlug === state.slug);
		urls.push({
			loc: `${SITE}/locations/${state.slug}`,
			lastmod: maxLastModified(stateEntries.map((e) => e.frontmatter.last_modified))
		});

		// City hub pages within this state
		for (const city of citiesInState(state.slug)) {
			const cityEntries = entriesForCity(state.slug, city.slug);
			urls.push({
				loc: `${SITE}/locations/${state.slug}/${city.slug}`,
				lastmod: maxLastModified(cityEntries.map((e) => e.frontmatter.last_modified))
			});
		}
	}

	// Individual location detail pages — only publish ones we have actual content for
	for (const entry of publishedEntries) {
		urls.push({
			loc: `${SITE}/locations/${entry.stateSlug}/${entry.citySlug}/${entry.slug}`,
			lastmod: maxLastModified([entry.frontmatter.last_modified])
		});
	}

	const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		(u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ''}  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Cache-Control': 'public, max-age=0, s-maxage=3600',
			'Content-Type': 'application/xml; charset=utf-8'
		}
	});
}
