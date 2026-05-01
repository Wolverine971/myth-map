// src/utils/userLocation.ts
import { currentLocation } from '$lib/stores/locationStore';

let watchId: number | null = null;

export const getCurrentLocation = async () => {
    if (!navigator?.geolocation) {
        console.log('Geolocation is not supported by your browser');
        return;
    }

    navigator.geolocation.getCurrentPosition(currentLocationSuccess, currentLocationError, {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 0
    });

    // Subscribe to ongoing position updates exactly once.
    if (watchId === null) {
        watchId = navigator.geolocation.watchPosition(currentLocationSuccess, currentLocationError, {
            enableHighAccuracy: true,
            maximumAge: 10000
        });
    }
};

export const stopWatchingLocation = () => {
    if (watchId !== null && navigator?.geolocation) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
};

const currentLocationSuccess = (pos: GeolocationPosition) => {
    const { latitude, longitude, accuracy, heading } = pos.coords;
    currentLocation.set({
        latitude,
        longitude,
        accuracy,
        heading: heading ?? 0,
        lat: latitude,
        lng: longitude,
        zip_code: ''
    });
};

const currentLocationError = (err: GeolocationPositionError) => {
    console.warn(`ERROR(${err.code}): ${err.message}`);
};
