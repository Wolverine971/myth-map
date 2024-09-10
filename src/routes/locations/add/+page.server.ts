import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const load: PageServerLoad = async () => {
	try {
		const { data: locations, error } = await supabase
			.from('locations')
			.select(`
                *,
                content_locations (
                    id,
                    opening_times,
                    phone_number,
                    website,
                    email,
					title
                )
            `)
			.order('created_at', { ascending: false });

		if (error) throw error;
		return { locations };
	} catch (error) {
		console.error('Error fetching locations:', error);
		return { locations: [] };
	}
};

export const actions: Actions = {
	addLocation: async ({ request }) => {
		const formData = await request.formData();
		const locationData = getLocationDataFromFormData(formData);

		try {
			const { data: location, error: locationError } = await supabase
				.from('locations')
				.insert(locationData)
				.select()
				.single();

			if (locationError) throw locationError;

			const contentLocationData = getContentLocationDataFromFormData(formData, location.id);
			const { error: contentLocationError } = await supabase
				.from('content_locations')
				.insert(contentLocationData);

			if (contentLocationError) throw contentLocationError;

			return { success: true, locationId: location.id };
		} catch (error) {
			console.error('Error adding location:', error);
			return fail(500, { message: 'Error adding location' });
		}
	},

	updateLocation: async ({ request, url }) => {
		const formData = await request.formData();
		const locationId = url.searchParams.get('id');

		if (!locationId) {
			return fail(400, { message: 'Location ID is required' });
		}

		const locationData = getLocationDataFromFormData(formData);

		try {
			const { error: locationError } = await supabase
				.from('locations')
				.update(locationData)
				.eq('id', locationId);

			if (locationError) throw locationError;

			const contentLocationData = getContentLocationDataFromFormData(formData, parseInt(locationId));
			const { error: contentLocationError } = await supabase
				.from('content_locations')
				.update(contentLocationData)
				.eq('location_id', locationId);

			if (contentLocationError) throw contentLocationError;

			return { success: true, locationId };
		} catch (error) {
			console.error('Error updating location:', error);
			return fail(500, { message: 'Error updating location' });
		}
	}
};

function getLocationDataFromFormData(formData: FormData) {
	return {
		name: formData.get('name') as string,
		address_line_1: formData.get('addressLine1') as string,
		address_line_2: formData.get('addressLine2') as string,
		city: formData.get('city') as string,
		state: formData.get('state') as string,
		zip_code: formData.get('zipCode') as string,
		lat: parseFloat(formData.get('lat') as string),
		lng: parseFloat(formData.get('lng') as string)
	};
}

function getContentLocationDataFromFormData(formData: FormData, locationId: number) {
	return {
		location_id: locationId,
		opening_times: formData.get('openingTimes') as string,
		phone_number: formData.get('phoneNumber') as string,
		title: formData.get('name') as string,
		loc: (formData.get('name') as string).split(' ').join('-'),
		website: formData.get('website') as string,
		email: formData.get('email') as string || null, // Set to null if empty
	};
}