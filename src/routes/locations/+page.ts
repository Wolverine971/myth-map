import { supabase } from '$lib/supabaseClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	try {
		const { data: existingLocationData, error: existingLocationDataError } = await supabase
			.from('content_locations').select(`*, location:locations(*)`);

		if (existingLocationDataError) {
			console.log('existingLocationDataError', existingLocationDataError);
		}



		return {
			contentLocations: existingLocationData
		};
	} catch (error) {
		console.error('error', error);
	}
};
