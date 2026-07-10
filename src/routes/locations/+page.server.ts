// src/routes/locations/+page.server.ts
import type { PageServerLoad } from './$types';
import { listEntries } from '$lib/server/content/loader';

export const prerender = true;

export const load: PageServerLoad = async () => {
	return {
		entries: listEntries().map((entry) => ({
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
					zip_code: entry.location.location.zip_code,
					lat: entry.location.location.lat,
					lng: entry.location.location.lng
				}
			}
		}))
	};
};
