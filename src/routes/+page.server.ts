// src/routes/+page.server.ts
import type { PageServerLoad, Actions } from './$types';
import { PUBLIC_MAP_KEY } from '$env/static/public';
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import locationsData from '$lib/data/locations.json';

export const load: PageServerLoad = async () => {
	return {
		locations: locationsData.locations,
		locationTags: locationsData.locationTags,
		tags: locationsData.tags
	};
};

const directionsClient = mbxDirections({ accessToken: PUBLIC_MAP_KEY });

const metersToMiles = (meters: number): number => Number((meters / 1609.344).toFixed(2));

export const actions: Actions = {
	getHowFarAwayIsLocation: async ({ request }) => {
		try {
			const body = Object.fromEntries(await request.formData());
			const originlat = parseFloat(body.originlat as string);
			const originlng = parseFloat(body.originlng as string);
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
				return {
					success: true,
					duration: Math.round(routes[0].duration / 60),
					distance: metersToMiles(routes[0].distance),
					data: routes[0]
				};
			}
			return { success: false, error: 'No route found' };
		} catch (error) {
			console.error('Error calculating directions:', error);
			return { success: false, error: 'Failed to calculate directions' };
		}
	}
};
