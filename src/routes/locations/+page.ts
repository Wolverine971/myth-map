import { supabase } from '$lib/supabaseClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		const { data: existingLocationData, error: existingLocationDataError } = await supabase
			.from('content_locations')
			.select('*');

		if (existingLocationDataError) {
			console.log('existingLocationDataError', existingLocationDataError);
		}

		const { data: LocationAddressData, error: LocationAddressDataError } = await supabase
			.from('locations')
			.select('*');

		if (LocationAddressDataError) {
			console.log('LocationAddressDataError', LocationAddressDataError);
		}
		const addressMap = {}

		LocationAddressData.forEach((location) => {

			addressMap[location.name] = location
		})

		return {
			locations: existingLocationData.map((location) => {
				return {
					...location,
					...(location.title && addressMap[location.title]) ? addressMap[location.title] : {
						address: 'No Address'
					}
				};
			})
		}
	} catch (error) {
		console.error('error', error);
	}
};
