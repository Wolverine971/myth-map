// src/routes/sitemap.xml/+server.ts
import locationsData from '$lib/data/locations.json';

export const prerender = true;

const SITE = 'https://tinytribeadventures.com';

function escapeXml(s: string) {
	return s.replace(
		/[&<>"']/g,
		(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!
	);
}

export async function GET() {
	const today = new Date().toISOString().split('T')[0];
	const staticUrls = [
		{ loc: SITE, priority: 1.0 },
		{ loc: `${SITE}/locations`, priority: 0.9 },
		{ loc: `${SITE}/about`, priority: 0.7 },
		{ loc: `${SITE}/contact`, priority: 0.5 },
		{ loc: `${SITE}/blog`, priority: 0.5 }
	];

	const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls
	.map(
		(u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${u.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
