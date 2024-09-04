import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient'; // Assuming you have a Supabase client setup

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
		const name = formData.get('name') as string;
		const addressLine1 = formData.get('addressLine1') as string;
		const addressLine2 = formData.get('addressLine2') as string;
		const city = formData.get('city') as string;
		const state = formData.get('state') as string;
		const zipCode = formData.get('zipCode') as string;
		const lat = parseFloat(formData.get('lat') as string);
		const lng = parseFloat(formData.get('lng') as string);

		// New fields
		const openingTimes = JSON.parse(formData.get('openingTimes') as string);
		const phoneNumber = formData.get('phoneNumber') as string;
		const website = formData.get('website') as string;
		const email = formData.get('email') as string;

		if (!name || !addressLine1 || !city || !state || !zipCode || isNaN(lat) || isNaN(lng)) {
			return fail(400, { message: 'All required fields must be filled' });
		}

		try {
			const { data: location, error: locationError } = await supabase
				.from('locations')
				.insert({
					name,
					address_line_1: addressLine1,
					address_line_2: addressLine2,
					city,
					state,
					zip_code: zipCode,
					lat,
					lng
				})
				.select()
				.single();

			if (locationError) throw locationError;

			const { error: contentLocationError } = await supabase
				.from('content_locations')
				.insert({
					location_id: location.id,
					opening_times: openingTimes,
					phone_number: phoneNumber,
					title: name,
					loc: name.split(' ').join('-'),
					website,
					email
				});

			if (contentLocationError) throw contentLocationError;

			return { success: true, locationId: location.id };
		} catch (error) {
			console.error('Error adding location:', error);
			return fail(500, { message: 'Error adding location' });
		}
	}
};