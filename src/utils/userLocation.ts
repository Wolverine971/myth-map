
import { currentLocation } from '$lib/stores/locationStore';

export const getCurrentLocation = async () => {
    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(currentLocationSuccess, currentLocationError, options);


}

const currentLocationSuccess = (pos) => {
    const crd = pos.coords;
    currentLocation.set({ lat: crd.latitude, lng: crd.longitude });
};

const currentLocationError = (err) => {
    console.warn(`ERROR(${err.code}): ${err.message}`);
};