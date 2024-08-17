import { supabase } from '$lib/supabaseClient';
import { findState } from '../../../../utils/geoDataLoader';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	try {
		const state = findState(event.params?.state || { abr: 'MD' });

		const { data: stateLocationData, error: stateLocationDataError } = await supabase
			.from('locations')
			.select('*')
			.eq('state', state.abr);

		if (stateLocationDataError) {
			console.log('stateLocationDataError', stateLocationDataError);
		}

		return {
			locations: stateLocationData
		};
	} catch (error) {
		console.error('error', error);
	}
};
