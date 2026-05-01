// src/routes/locations/[state]/+page.ts
import { error } from '@sveltejs/kit';
import { citiesInState, statesAvailable } from '$lib/content/loader';
import type { PageLoad } from './$types';

export const prerender = true;

export function entries() {
	return statesAvailable().map((s) => ({ state: s.slug }));
}

export const load: PageLoad = async ({ params }) => {
	const cities = citiesInState(params.state);
	if (!cities.length) throw error(404, 'State not found');
	const total = cities.reduce((sum, c) => sum + c.count, 0);
	return {
		stateSlug: params.state,
		stateAbbr: params.state.toUpperCase(),
		cities,
		total
	};
};
