import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';

export const load: PageServerLoad = async (event) => {

	const user = await event.locals.getUser()

	if (!user.id) {
		throw error(401, 'Unauthorized');
	}

	const { data: itineraries, error: fetchError } = await supabase
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
