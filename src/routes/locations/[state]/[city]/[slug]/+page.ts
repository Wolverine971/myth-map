// src/routes/locations/[state]/[city]/[slug]/+page.ts
import { error } from '@sveltejs/kit';
import { getEntry, nearbyEntries, pairedEntries, routeEntries } from '$lib/content/loader';
import type { PageLoad } from './$types';

export const prerender = true;

export function entries() {
	return routeEntries();
}

export const load: PageLoad = async ({ params }) => {
	const entry = getEntry(params.state, params.city, params.slug);
	if (!entry) throw error(404, 'Location not found');
	const nearby = nearbyEntries(entry, 3);
	const paired = pairedEntries(entry);
	return { entry, nearby, paired };
};
