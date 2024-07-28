import { writable } from 'svelte/store';

type Location = {
    lat: number;
    lng: number;
} | null;

export const currentLocation = writable<Location>(null);