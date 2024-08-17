import { supabase } from '$lib/supabaseClient';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	try {
		const { data: stateData, error } = await supabase.rpc('get_location_count_by_state');
		if (error) console.error(error);
		else console.log(stateData);

		return {
			stateData
		};
	} catch (error) {
		console.error('error', error);
	}
};
