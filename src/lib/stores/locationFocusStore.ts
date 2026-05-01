// src/lib/stores/locationFocusStore.ts
import { writable } from 'svelte/store';

export type LocationFocusKey = string | number;

interface LocationFocusState {
	hovered: LocationFocusKey | null;
	selected: LocationFocusKey | null;
}

const initial: LocationFocusState = { hovered: null, selected: null };

const store = writable<LocationFocusState>(initial);

export const locationFocus = {
	subscribe: store.subscribe,
	hover(id: LocationFocusKey | null) {
		store.update((s) => (s.hovered === id ? s : { ...s, hovered: id }));
	},
	select(id: LocationFocusKey | null) {
		store.update((s) => (s.selected === id ? s : { ...s, selected: id }));
	},
	clear() {
		store.set(initial);
	}
};

export function locationKey(loc: {
	id?: number | string | null;
	name?: string | null;
}): LocationFocusKey {
	if (loc.id != null) return loc.id;
	return loc.name ?? '';
}
