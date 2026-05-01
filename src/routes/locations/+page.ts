// src/routes/locations/+page.ts
import type { PageLoad } from './$types';
import locationsData from '$lib/data/locations.json';

export const prerender = true;

export const load: PageLoad = async () => {
	return { contentLocations: locationsData.locations };
};
