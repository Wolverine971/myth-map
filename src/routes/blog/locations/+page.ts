
import { supabase } from '$lib/supabaseClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    try {
        const { data: existingLocationData, error: existingLocationDataError } = await supabase.from('content_locations')
            .select('*')

        if (existingLocationDataError) {
            console.log('existingLocationDataError', existingLocationDataError)
        }

        return {
            blogs: existingLocationData
        };

    } catch (error) {
        console.error('error', error);

    }
};