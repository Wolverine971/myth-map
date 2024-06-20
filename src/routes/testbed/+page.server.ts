import { supabase } from "$lib/supabaseClient";
import type { PageServerLoad } from './$types';

import type { Actions } from './$types';

import { getAndUpdateLatLng } from "../../utils/locations";

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


export const actions: Actions = {

    getlatLng: async ({ request }) => {
        const body = Object.fromEntries(await request.formData());
        const locationId = body.id as string;
        // const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${PUBLIC_MAP_KEY}`;
        // const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json?access_token=${PUBLIC_MAP_KEY}`;
        const address = body.address as string;
        const city = body.city as string;
        const state = body.state as string;
        const zip = body.zip as string;

        return await getAndUpdateLatLng(locationId, address, city, state, zip);

    },
}


