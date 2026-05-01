// src/routes/sitemap.xml/+server.ts
import { listEntries, statesAvailable, citiesInState, entriesForCity } from '$lib/content/loader';

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
	lastmod: string;
	changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
	priority: number;
};

function maxLastModified(dates: Array<string | undefined | null>): string {
	const valid = dates.filter((d): d is string => typeof d === 'string' && d.length > 0);
	if (!valid.length) return new Date().toISOString().split('T')[0];
	return valid.sort().reverse()[0];
}

export async function GET() {
	const today = new Date().toISOString().split('T')[0];
	const allEntries = listEntries();
	const publishedEntries = allEntries.filter((e) => e.frontmatter.published);

	const urls: SitemapUrl[] = [];

	// Static top-level pages
	urls.push(
		{ loc: SITE, lastmod: today, changefreq: 'weekly', priority: 1.0 },
		{ loc: `${SITE}/locations`, lastmod: today, changefreq: 'weekly', priority: 0.9 },
		{ loc: `${SITE}/about`, lastmod: today, changefreq: 'monthly', priority: 0.6 },
		{ loc: `${SITE}/contact`, lastmod: today, changefreq: 'yearly', priority: 0.4 },
		{ loc: `${SITE}/blog`, lastmod: today, changefreq: 'monthly', priority: 0.4 }
	);

	// State hub pages — lastmod = max last_modified of entries in that state
	for (const state of statesAvailable()) {
		const stateEntries = allEntries.filter((e) => e.stateSlug === state.slug);
		urls.push({
			loc: `${SITE}/locations/${state.slug}`,
			lastmod: maxLastModified(stateEntries.map((e) => e.frontmatter.last_modified)),
			changefreq: 'weekly',
			priority: 0.8
		});

		// City hub pages within this state
		for (const city of citiesInState(state.slug)) {
			const cityEntries = entriesForCity(state.slug, city.slug);
			urls.push({
				loc: `${SITE}/locations/${state.slug}/${city.slug}`,
				lastmod: maxLastModified(cityEntries.map((e) => e.frontmatter.last_modified)),
				changefreq: 'weekly',
				priority: 0.7
			});
		}
	}

	// Individual location detail pages — only publish ones we have actual content for
	for (const entry of publishedEntries) {
		urls.push({
			loc: `${SITE}/locations/${entry.stateSlug}/${entry.citySlug}/${entry.slug}`,
			lastmod: entry.frontmatter.last_modified || today,
			changefreq: 'monthly',
			priority: 0.6
		});
	}

	const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		(u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority.toFixed(1)}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
