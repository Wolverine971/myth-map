import { findState } from '../../../../../utils/geoDataLoader';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	try {
		const user = await event.locals.getUser();
		const state = findState(event.params?.state.replace('-', ' ') || { abr: 'MD' });

		const city = event.params?.city.replace('-', ' ');

		const { data: stateLocationData, error: stateLocationDataError } = await event.locals.supabase
			.from('locations')
			.select('*')
			.eq('state', state.abr)
			.eq('city', city);

		if (stateLocationDataError) {
			console.log('stateLocationDataError', stateLocationDataError);
		}

		return {
			locations: stateLocationData,
			user
		};
	} catch (error) {
		console.error('error', error);
	}
};
