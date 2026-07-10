// src/routes/locations/[state]/[city]/+page.server.ts
import { error } from '@sveltejs/kit';
import { entriesForCity, listEntries } from '$lib/server/content/loader';
import type { PageServerLoad } from './$types';

export const prerender = true;

export function entries() {
	const seen = new Set<string>();
	const out: Array<{ state: string; city: string }> = [];
	for (const e of listEntries()) {
		const key = `${e.stateSlug}/${e.citySlug}`;
		if (seen.has(key)) continue;
		seen.add(key);
		out.push({ state: e.stateSlug, city: e.citySlug });
	}
	return out;
}

export const load: PageServerLoad = async ({ params }) => {
	const entries = entriesForCity(params.state, params.city);
	if (!entries.length) throw error(404, 'City not found');
	const cityName = entries[0].frontmatter.city;
	const stateAbbr = entries[0].frontmatter.state;
	const items = entries.map((entry) => ({
		id: entry.id,
		stateSlug: entry.stateSlug,
		citySlug: entry.citySlug,
		slug: entry.slug,
		frontmatter: {
			name: entry.frontmatter.name,
			city: entry.frontmatter.city,
			state: entry.frontmatter.state,
			published: entry.frontmatter.published
		},
		location: {
			location: {
				address_line_1: entry.location.location.address_line_1,
				type: entry.location.location.type,
				indoor_outdoor: entry.location.location.indoor_outdoor,
				price: entry.location.location.price
			}
		}
	}));
	return {
		stateSlug: params.state,
		citySlug: params.city,
		cityName,
		stateAbbr,
		items
	};
};
