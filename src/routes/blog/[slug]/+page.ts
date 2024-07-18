import type { PageLoad } from './$types';
import { supabase } from '$lib/supabaseClient';


export const load: PageLoad = async ({ params }) => {

	const { data: updatedLocationData, error: updatedLocationDataError } = await supabase
		.from('content_locations')
		.select('*')
		.eq('loc', params.slug)
		.single();



	return {
		blog: updatedLocationData,
	};
};
