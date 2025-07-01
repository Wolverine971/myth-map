// src/routes/itineraries/+page.server.ts
import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = await event.locals.getUser();

	if (!user.id) {
		throw error(401, 'Unauthorized');
	}

	const { data: itineraries, error: fetchError } = await event.locals.supabase
		.from('itineraries')
		.select('*')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false });

	if (fetchError) {
		throw error(500, 'Error fetching itineraries');
	}

	return {
		itineraries,
		user
	};
};
