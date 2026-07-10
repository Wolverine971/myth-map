// src/routes/locations/[state]/[city]/[slug]/+page.server.ts
import { error } from '@sveltejs/kit';
import {
	getEntry,
	nearbyEntries,
	pairedEntries,
	routeEntries,
	type LocationEntry
} from '$lib/server/content/loader';
import type { PageServerLoad } from './$types';

export const prerender = true;

export function entries() {
	return routeEntries();
}

function relatedEntry(entry: LocationEntry) {
	return {
		id: entry.id,
		stateSlug: entry.stateSlug,
		citySlug: entry.citySlug,
		slug: entry.slug,
		frontmatter: {
			name: entry.frontmatter.name,
			city: entry.frontmatter.city,
			state: entry.frontmatter.state
		}
	};
}

export const load: PageServerLoad = async ({ params }) => {
	const entry = getEntry(params.state, params.city, params.slug);
	if (!entry) throw error(404, 'Location not found');
	const { body: _body, ...pageEntry } = entry;
	const nearby = nearbyEntries(entry, 3).map((item) => ({
		...relatedEntry(item),
		distanceMiles: item.distanceMiles
	}));
	const paired = pairedEntries(entry).map((item) => relatedEntry(item));
	return { entry: pageEntry, nearby, paired };
};
