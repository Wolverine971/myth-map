import { supabase } from "$lib/supabaseClient";
import type { PageServerLoad } from './$types';

/** @type {import('./$types').PageLoad} */
export const load: PageServerLoad = async (event) => {
    const { data: locationTags, error: locationTagsError } = await supabase.from("location_tags").select("*, locations(*), tags(*)");
    if (locationTagsError) {
        console.error(locationTagsError);
    }
    return {
        locationTags: locationTags ?? [],
    };
}