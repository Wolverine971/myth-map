import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';

export const load: PageServerLoad = async (event) => {



	const session = await event.locals.getSession()

	const { data: itineraries, error: fetchError } = await supabase
		.from('itineraries')
		.select('*')
		.order('created_at', { ascending: false });

	if (fetchError) {
		throw error(500, 'Error fetching itineraries');
	}

	return {
		itineraries,
		session
	};
};
