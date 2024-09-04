import type { PageServerLoad } from './$types';

import { PUBLIC_MAP_KEY } from '$env/static/public';

import type { Actions } from './$types';

import { getAndUpdateLatLng } from '../../utils/locations';

import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import { json } from '@sveltejs/kit';

const directionsClient = mbxDirections({ accessToken: PUBLIC_MAP_KEY });

/** @type {import('./$types').PageLoad} */
export const load: PageServerLoad = async (event) => {
	const user = await event.locals.getUser();
	const { data: locations, error: locationsError } = await event.locals.supabase
		.from('locations')
		.select('*');
	if (locationsError) {
		console.error(locationsError);
	}
	const { data: locationTags, error: locationTagsError } = await event.locals.supabase
		.from('location_tags')
		.select('*, locations(*), tags(*)');
	if (locationTagsError) {
		console.error(locationTagsError);
	}
	return {
		locations: locations ?? [],
		locationTags: locationTags ?? [],
		user
	};
};

export const actions: Actions = {
	getlatLng: async ({ request }) => {
		const body = Object.fromEntries(await request.formData());
		const locationId = body.id as string;
		// const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${PUBLIC_MAP_KEY}`;
		// const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json?access_token=${PUBLIC_MAP_KEY}`;
		const address = body.address as string;
		const city = body.city as string;
		const state = body.state as string;
		const zip = body.zip as string;

		return await getAndUpdateLatLng({
			locationId: locationId,
			address: address,
			city: city,
			state: state,
			zip: zip
		});
	},

	getHowFarAwayIsLocation: async ({ request }) => {
		try {
			const { origin, destination } = await request.json();

			const response = await directionsClient
				.getDirections({
					profile: 'driving',
					waypoints: [{ coordinates: origin }, { coordinates: destination }]
				})
				.send();

			const routes = response.body.routes;
			if (routes.length > 0) {
				const duration = routes[0].duration / 60; // Convert seconds to minutes
				return json({ duration: Math.round(duration) });
			} else {
				return json({ error: 'No route found' }, { status: 404 });
			}
		} catch (error) {
			console.error('Error calculating directions:', error);
			return json({ error: 'Failed to calculate directions' }, { status: 500 });
		}
	}
};
