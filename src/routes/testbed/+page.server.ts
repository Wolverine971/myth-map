import { supabase } from "$lib/supabaseClient";
import type { PageServerLoad } from './$types';

import { error } from '@sveltejs/kit';
import type { Actions } from './$types';

import { PUBLIC_MAP_KEY } from '$env/static/public';

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


export const actions: Actions = {

    getlatLng: async ({ request }) => {
        const body = Object.fromEntries(await request.formData());
        const locationId = body.id as string;
        // const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${PUBLIC_MAP_KEY}`;
        // const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json?access_token=${PUBLIC_MAP_KEY}`;
        const censusData = await pingDataCensusGov(body);
        if (censusData) {
            await saveLatLng({ id: locationId, ...censusData });
            return censusData;
        }
        const mapboxData = await pingDataMapbox(body);
        if (mapboxData) {
            await saveLatLng({ id: locationId, ...mapboxData });
            return mapboxData;
        }
    },
}


const pingDataCensusGov = async (body): Promise<{ lat: number, lng: number } | null> => {
    const address = body.address as string;
    const city = body.city as string;
    const state = body.state as string;
    const zip = body.zip as string;

    const url = `https://geocoding.geo.census.gov/geocoder/locations/address?street=${address}&city=${city}&state=${state}&zip=${zip}&benchmark=Public_AR_Current&format=json`
    const res = await fetch(url);
    const data = await res.json();
    if (data?.addressMatches?.length) {
        return {
            lat: data.addressMatches[0].coordinates.y,
            lng: data.addressMatches[0].coordinates.x
        }
    }

    return null;
}

const pingDataMapbox = async (body): Promise<{ lat: number, lng: number } | null> => {
    const address = body.address as string;
    const city = body.city as string;
    const state = body.state as string;
    const zip = body.zip as string;

    // const url = `https://geocoding.geo.census.gov/geocoder/locations/address?street=${address}${city}${state}${zip}&benchmark=Public_AR_Current&format=json`

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}${city}${state}${zip}.json?access_token=${PUBLIC_MAP_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data?.features.length) {
        return {
            lat: data?.features[0]?.center[1],
            lng: data?.features[0]?.center[0]
        }
    }

    return null;


}

const saveLatLng = async ({ id, lat, lng }: { id: string, lat: number, lng: number }) => {
    const { data, error } = await supabase.from('locations')
        .update({ lat: lat, lng: lng })
        .eq('id', id)
    if (error) {
        console.error(error);
    }
    return data;
}