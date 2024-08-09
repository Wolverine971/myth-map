import { supabase } from '$lib/supabaseClient';
import type { Actions, PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	if (params.place.includes('.')) {
		return
	}
	const { data: blogData, error: blogDataError } = await supabase
		.from('content_locations')
		.select('*')
		.eq('loc', params.place)
		.single();

	if (blogDataError) {
		console.error(blogDataError);
	}

	const { data: locationData, error: locationDataError } = await supabase
		.from('locations')
		.select('*')
		.eq('name', blogData?.title)
		.single();

	if (locationDataError || !locationData) {
		console.error(locationDataError);
	}

	const { data: nearByLocations, error: nearByLocationsError } = await supabase.rpc(
		'nearby_locations',
		{
			lat: locationData.lat,
			long: locationData.lng,
			location_limit: 11
		}
	);
	if (nearByLocationsError) {
		console.error(nearByLocationsError);
	}
	const filteredNearByLocations = nearByLocations.filter(
		(location) => location.name !== blogData?.title
	).map((location) => {
		return {
			...location,
			lng: location.long
		};
	});

	const { data: locationTags, error: locationTagsError } = await supabase
		.from('location_tags')
		.select('*, locations(*), tags(*)')
		.in(
			'location_id',
			filteredNearByLocations.map((location) => location.id)
		);
	if (locationTagsError) {
		console.error(locationTagsError);
	}

	return {
		blog: blogData,
		locationData,
		locationTags,
		nearbyLocations: filteredNearByLocations
	};
};

export const actions: Actions = {
	findNearby: async ({ request }) => {
		try {
			const body = Object.fromEntries(await request.formData());
			const lat = parseInt(body.lat as string);
			const lng = parseInt(body.lng as string);

			const { data, error } = await supabase.rpc('nearby_locations', {
				lat: lat || 40.807313,
				long: lng || -73.946713,
				location_limit: 10
			});

			console.log(data, error);
		} catch (e) {
			console.error(e);
		}
	}
};
