// src/routes/locations/[state]/[city]/+page.ts
import { error } from '@sveltejs/kit';
import { entriesForCity, listEntries } from '$lib/content/loader';
import type { PageLoad } from './$types';

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

export const load: PageLoad = async ({ params }) => {
	const items = entriesForCity(params.state, params.city);
	if (!items.length) throw error(404, 'City not found');
	const cityName = items[0].frontmatter.city;
	const stateAbbr = items[0].frontmatter.state;
	return {
		stateSlug: params.state,
		citySlug: params.city,
		cityName,
		stateAbbr,
		items
	};
};
