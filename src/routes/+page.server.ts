// src/routes/+page.server.ts
import type { PageServerLoad } from './$types';

/** @type {import('./$types').PageLoad} */
export const load: PageServerLoad = async (event) => {
	const user = await event.locals.getUser();
	const { data: locations, error: locationsError } = await event.locals.supabase
		.from('content_locations')
		.select(`*, location:locations(*)`)
	if (locationsError) {
		console.error(locationsError);
	}

	const { data: tags, error: tagsError } = await event.locals.supabase.from('tags').select('*');
	if (tagsError) {
		console.error(tagsError);
	}

	const { data: locationTags, error: locationTagsError } = await event.locals.supabase
		.from('location_tags')
		.select('*, location:locations(*), tags(*)');
	if (locationTagsError) {
		console.error(locationTagsError);
	}
	return {
		locations: locations ?? [],
		locationTags: locationTags ?? [],
		tags: tags ?? [],
		user
	};
};

import { PUBLIC_MAP_KEY } from '$env/static/public';

import type { Actions } from './$types';

import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import { json } from '@sveltejs/kit';

const directionsClient = mbxDirections({ accessToken: PUBLIC_MAP_KEY });

export const actions: Actions = {
	getHowFarAwayIsLocation: async ({ request }) => {
		try {
			// const { origin, destination } = await request.json();

			const body = Object.fromEntries(await request.formData());
			const originlat = parseFloat(body.originlat as string);
			const originlng = parseFloat(body.originlng as string);
			// const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${PUBLIC_MAP_KEY}`;
			// const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json?access_token=${PUBLIC_MAP_KEY}`;
			const destinationlat = parseFloat(body.destinationlat as string);
			const destinationlng = parseFloat(body.destinationlng as string);

			const response = await directionsClient
				.getDirections({
					profile: 'driving',
					waypoints: [
						{ coordinates: [originlng, originlat] },
						{ coordinates: [destinationlng, destinationlat] }
					]
				})
				.send();

			const routes = response.body.routes;
			if (routes.length > 0) {
				const duration = routes[0].duration / 60; // Convert seconds to minutes
				// return json({ duration: Math.round(duration) })
				const durationMinutes = Math.round(routes[0].duration / 60);
				const distanceMeters = routes[0].distance;
				const distanceMiles = metersToMiles(distanceMeters);
				return {
					success: true,
					duration: durationMinutes,
					distance: distanceMiles,
					data: routes[0]
				};
			} else {
				return { success: false, error: 'No route found' };
			}
		} catch (error) {
			console.error('Error calculating directions:', error);
			return { success: false, error: 'Failed to calculate directions' };
		}
	}
};

const metersToMiles = (meters: number): number => {
	const miles = meters / 1609.344;
	return Number(miles.toFixed(2)); // Round to 2 decimal places
};
