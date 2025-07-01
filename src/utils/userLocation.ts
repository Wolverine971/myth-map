// src/utils/userLocation.ts
import { currentLocation } from '$lib/stores/locationStore';

export const getCurrentLocation = async () => {
    const options = {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 0
    };

    if (!navigator?.geolocation) {
        console.log('Geolocation is not supported by your browser');
        return;
    }


    navigator.geolocation.getCurrentPosition(currentLocationSuccess, currentLocationError, options);

};

const currentLocationSuccess = async (pos) => {
    const crd = pos.coords;
    pos.coords.lat = crd.latitude
    pos.coords.lng = crd.longitude
    currentLocation.set(pos.coords);
    setInterval(getCurrentLocation, 10000);


};

const currentLocationError = (err) => {
    console.warn(`ERROR(${err.code}): ${err.message}`);
};
