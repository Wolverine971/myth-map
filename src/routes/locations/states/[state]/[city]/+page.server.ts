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

		const { data: contentData, error: contentDataError } = await event.locals.supabase
			.from('content_locations')
			.select('*')

		if (contentDataError) {
			console.log('contentDataError', contentDataError);
		}

		const contentMap = {}
		for (const content of contentData) {
			contentMap[content.title] = content
		}

		const locations = stateLocationData.map((location) => {
			if (contentMap[location.name]) {
				return {

					...contentMap[location.name],
					location: location
				}
			}
		}).filter((location) => location)



		return {
			locations: locations,
			user
		};
	} catch (error) {
		console.error('error', error);
	}
};
