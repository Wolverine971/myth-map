// src/lib/stores/locationStore.ts
import { writable } from 'svelte/store';

type Location = {
	lat: number;
	lng: number;
	longitude: number;
	latitude: number;
	accuracy: number;
	heading: number;
	zip_code: string;
} | null;

export const currentLocation = writable<Location>(null);
