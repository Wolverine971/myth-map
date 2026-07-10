// src/lib/components/map/map-icons.ts
// Alias the Mapbox `Map` type so it doesn't shadow the JS built-in Map constructor.
import type { Map as MapboxMap } from 'mapbox-gl';

const ICON_NAMES = [
	'playground',
	'park1',
	'mythmap',
	'donut-shop',
	'library',
	'museum',
	'farm',
	'hiking-trail',
	'nasa',
	'ice-cream-truck',
	'mini-golf',
	'bakery',
	'brewery',
	'trampoline-park',
	'climbing-gym',
	'lake',
	'nature-preserve',
	'community-center',
	'art-studio',
	'aquarium',
	'splash-pad',
	'train',
	'park-with-trails',
	'park-with-zoo',
	'aircraft-observation'
] as const;

// Mapbox layer references icon IDs like "playground1"; the asset on disk is /map/playground.png.
const FILENAME_BY_ID = new Map<string, string>(
	ICON_NAMES.map((name) => [`${name}1`, `/map/${name}.png`])
);

const inFlightByMap = new WeakMap<MapboxMap, Map<string, Promise<void>>>();
const placeholdersByMap = new WeakMap<MapboxMap, Set<string>>();

// `styleimagemissing` is synchronous, while `map.loadImage()` is not. Register
// a same-sized transparent image immediately so Mapbox can finish the frame
// without logging a missing-image warning, then replace it when the PNG lands.
// Every map icon in static/map is 256 × 256.
const TRANSPARENT_PLACEHOLDER = {
	width: 256,
	height: 256,
	data: new Uint8Array(256 * 256 * 4)
};

function inFlightFor(map: MapboxMap): Map<string, Promise<void>> {
	let requests = inFlightByMap.get(map);
	if (!requests) {
		requests = new Map();
		inFlightByMap.set(map, requests);
	}
	return requests;
}

function placeholdersFor(map: MapboxMap): Set<string> {
	let placeholders = placeholdersByMap.get(map);
	if (!placeholders) {
		placeholders = new Set();
		placeholdersByMap.set(map, placeholders);
	}
	return placeholders;
}

function addPlaceholder(map: MapboxMap, id: string) {
	if (map.hasImage(id) || !FILENAME_BY_ID.has(id)) return;
	map.addImage(id, TRANSPARENT_PLACEHOLDER);
	placeholdersFor(map).add(id);
}

function loadImage(map: MapboxMap, id: string): Promise<void> {
	const placeholders = placeholdersFor(map);
	if (map.hasImage(id) && !placeholders.has(id)) return Promise.resolve();

	const inFlight = inFlightFor(map);
	const existing = inFlight.get(id);
	if (existing) return existing;

	const url = FILENAME_BY_ID.get(id);
	if (!url) {
		console.warn(`No file mapping registered for map icon "${id}"`);
		return Promise.resolve();
	}

	const promise = new Promise<void>((resolve) => {
		map.loadImage(url, (error, image) => {
			inFlight.delete(id);
			if (error || !image) {
				console.error(`Failed to load map icon ${id} (${url}):`, error);
				resolve();
				return;
			}
			if (map.hasImage(id)) map.updateImage(id, image);
			else map.addImage(id, image);
			placeholders.delete(id);
			resolve();
		});
	});

	inFlight.set(id, promise);
	return promise;
}

/**
 * Wire up lazy icon loading: Mapbox fires `styleimagemissing` when a symbol
 * layer references an icon that hasn't been registered yet. We load on demand
 * instead of front-loading every PNG at startup.
 */
export function attachLazyIconLoader(map: MapboxMap) {
	map.on('styleimagemissing', (e) => {
		addPlaceholder(map, e.id);
		void loadImage(map, e.id);
	});
}
