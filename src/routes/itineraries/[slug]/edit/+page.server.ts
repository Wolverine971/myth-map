// src/routes/itineraries/[slug]/edit/+page.server.ts
import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const params = event.params;
	const user = await event.locals.getUser();
	const { data: itinerary, error: fetchError } = await event.locals.supabase
		.from('itineraries')
		.select(
			`
            *,
            items:itinerary_items(
                *,
                location:locations(*)
            )
        `
		)
		.eq('id', params.slug)
		.single();

	if (fetchError) {
		throw error(404, 'Itinerary not found');
	}

	return {
		itinerary,
		user
	};
};
