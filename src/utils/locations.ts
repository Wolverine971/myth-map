import { PUBLIC_MAP_KEY } from "$env/static/public";
import { supabase } from "$lib/supabaseClient";

export const getAndUpdateLatLng = async (locationId: string, address: string, city: string, state: string, zip: string) => {

    const censusData = await pingDataCensusGov(locationId, address, city, state, zip);
    if (censusData) {
        await saveLatLng({ id: locationId, ...censusData });
        return censusData;
    }
    const mapboxData = await pingDataMapbox(locationId, address, city, state, zip);
    if (mapboxData) {
        await saveLatLng({ id: locationId, ...mapboxData });
        return mapboxData;
    }

}



const pingDataCensusGov = async (locationId: string, address: string, city: string, state: string, zip: string): Promise<{ lat: number, lng: number } | null> => {

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

const pingDataMapbox = async (locationId: string, address: string, city: string, state: string, zip: string): Promise<{ lat: number, lng: number } | null> => {


    // const url = `https://geocoding.geo.census.gov/geocoder/locations/address?street=${address}${city}${state}${zip}&benchmark=Public_AR_Current&format=json`

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/address_line1=${address}&place=${city}&region=${state}&postcode=${zip}&country=US.json?access_token=${PUBLIC_MAP_KEY}`;
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