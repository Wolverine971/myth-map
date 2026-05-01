// src/routes/locations/+page.ts
import type { PageLoad } from './$types';
import { listEntries } from '$lib/content/loader';

export const prerender = true;

export const load: PageLoad = async () => {
	return { entries: listEntries() };
};
