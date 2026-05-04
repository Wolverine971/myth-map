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

const inFlight = new Map<string, Promise<void>>();

function loadImage(map: MapboxMap, id: string): Promise<void> {
	if (map.hasImage(id)) return Promise.resolve();

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
			if (!map.hasImage(id)) map.addImage(id, image);
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
		void loadImage(map, e.id);
	});
}
