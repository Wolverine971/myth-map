import { supabase } from "$lib/supabaseClient";
import type { PageServerLoad } from './$types';

/** @type {import('./$types').PageLoad} */
export const load: PageServerLoad = async (event) => {
    const { data: locations, error: locationsError } = await supabase.from("locations").select("*");
    if (locationsError) {
        console.error(locationsError);
    }

    const { data: locationTags, error: locationTagsError } = await supabase.from("location_tags").select("*, locations(*), tags(*)");
    if (locationTagsError) {
        console.error(locationTagsError);
    }
    return {
        locations: locations ?? [],
        locationTags: locationTags ?? [],
    };
}