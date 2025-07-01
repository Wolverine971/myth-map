// src/routes/locations/states/[state]/+page.server.ts
import { findState } from '../../../../utils/geoDataLoader';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	try {
		const user = await event.locals.getUser();
		const state = findState(event.params?.state || { abr: 'MD' });

		const { data: stateLocationData, error: stateLocationDataError } = await event.locals.supabase
			.from('content_locations')
			.select(`*, location:locations(*)`)
			.eq('location.state', state.abr);

		if (stateLocationDataError) {
			console.log('stateLocationDataError', stateLocationDataError);
		}

		return {
			contentLocations: stateLocationData,
			user
		};
	} catch (error) {
		console.error('error', error);
	}
};
