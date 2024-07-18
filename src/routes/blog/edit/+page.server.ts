import type { PageLoad } from './$types';
import { supabase } from '$lib/supabaseClient';
import { error, type Actions } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {

    const { data: existingLocationData, error: existingLocationDataError } = await supabase.from('content_locations')
        .select('*')

    if (existingLocationDataError) {
        console.log('existingLocationDataError', existingLocationDataError)
    }

    return {
        locationBlogs: existingLocationData
    };
};


export const actions: Actions = {
    save: async ({ request }) => {
        try {
            const body = Object.fromEntries(await request.formData());

            const loc = body.loc as string;
            const markdown = body.markdown as string;
            const description = body.description as string;

            console.log('loc', loc)

            const { data: locationData, error: locationDataError } = await supabase
                .from('content_locations')
                .select('*')
                .eq('loc', loc)
                .single();




            if (locationDataError) {
                console.log('locationDataError', locationDataError)
            }

            if (locationData) {
                const { data: updatedLocationData, error: updatedLocationDataError } = await supabase
                    .from('content_locations')
                    .update({
                        content: markdown,
                        description: description
                    })
                    .eq('loc', loc)
                    .single();
                if (updatedLocationDataError) {
                    console.log('updatedLocationDataError', updatedLocationDataError)
                }
            }
            console.log('locationData', locationData)
            return { success: true };
        } catch (e) {
            throw error(404, {
                message: `Failed to ingest, ${JSON.stringify(e)}`
            });
        }

    }
};
