import type { Actions, PageLoad } from './$types';

export const load: PageLoad = async (event: any) => {

	let user = await event.locals.getUser();

	if (user) {
		const { data: userProfileData, error: userProfileError } = await event.locals.supabase
			.from('user_profiles')
			.select('*')
			.eq('id', user.id)
			.single();

		if (userProfileError) {
			console.error(userProfileError);
		} else {
			user = {
				...userProfileData
			};
		}
	}

	const { data: blogData, error: blogDataError } = await event.locals.supabase
		.from('content_locations')
		.select(`*, location:locations(*)`)
		.eq('loc', event.params.place)
		.single();

	if (blogDataError) {
		console.error(blogDataError);
	}



	const { data: nearByLocations, error: nearByLocationsError } = await event.locals.supabase.rpc(
		'nearby_locations',
		{
			lat: blogData.location.lat,
			long: blogData.location.lng,
			location_limit: 11
		}
	);
	if (nearByLocationsError) {
		console.error(nearByLocationsError);
	}
	const filteredNearByLocations = nearByLocations
		.filter((location) => location.name !== blogData?.title)
		.map((location) => {
			return {
				...location,
				lng: location.long
			};
		});

	const { data: locationTags, error: locationTagsError } = await event.locals.supabase
		.from('location_tags')
		.select('*, location:locations(*), tags(*)')
		.in(
			'location_id',
			filteredNearByLocations.map((location) => location?.id)
		);
	if (locationTagsError) {
		console.error(locationTagsError);
	}

	return {
		locationData: blogData,
		locationTags,
		nearbyLocations: filteredNearByLocations,
		user
	};
};

export const actions: Actions = {
	findNearby: async ({ request, locals }) => {
		try {
			const body = Object.fromEntries(await request.formData());
			const lat = parseInt(body.lat as string);
			const lng = parseInt(body.lng as string);

			const { data, error } = await locals.supabase.rpc('nearby_locations', {
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
