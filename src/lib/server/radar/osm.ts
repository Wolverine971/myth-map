// src/lib/server/radar/osm.ts
import type { RadarEntity, RadarLayer } from '$lib/types/radar';
import { RADAR_USER_AGENT } from './config';
import { getRadarCache, RadarCacheTTL, setRadarCache } from './cache';
import { haversineMiles } from './geo';

type OsmElement = {
	type: 'node' | 'way' | 'relation';
	id: number;
	lat?: number;
	lon?: number;
	center?: { lat?: number; lon?: number };
	tags?: Record<string, string>;
};

type OverpassResponse = {
	elements?: OsmElement[];
};

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const OSM_LAYERS = new Set<RadarLayer>([
	'playground',
	'park',
	'splash_pad',
	'library',
	'museum',
	'attraction',
	'food_play',
	'restroom'
]);

export async function fetchOsmEntities(
	lat: number,
	lng: number,
	radiusKm: number,
	layers: RadarLayer[],
	signal: AbortSignal
): Promise<RadarEntity[]> {
	if (!layers.some((layer) => OSM_LAYERS.has(layer))) return [];

	const radiusMeters = Math.min(50000, Math.round(radiusKm * 1000));
	const cacheKey = `osm:${lat.toFixed(2)}:${lng.toFixed(2)}:${radiusMeters}:${layers.join('-')}`;
	const cached = getRadarCache<RadarEntity[]>(cacheKey);
	if (cached) return cached;

	const query = buildQuery(lat, lng, radiusMeters);
	const response = await fetch(OVERPASS_URL, {
		method: 'POST',
		signal,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
			'User-Agent': RADAR_USER_AGENT
		},
		body: new URLSearchParams({ data: query })
	});

	if (!response.ok) {
		throw new Error(`Overpass request failed with ${response.status}`);
	}

	const data = (await response.json()) as OverpassResponse;
	const freshAt = new Date().toISOString();
	const requested = new Set(layers);

	const entities = (data.elements ?? [])
		.map((element): RadarEntity | null => {
			const layer = inferLayer(element.tags ?? {});
			if (!requested.has(layer)) return null;

			const itemLat = element.lat ?? element.center?.lat;
			const itemLng = element.lon ?? element.center?.lon;
			if (itemLat == null || itemLng == null) return null;

			const tags = element.tags ?? {};
			const name = tags.name || fallbackName(layer);
			return {
				id: `osm:${element.type}/${element.id}`,
				source: 'osm',
				layer,
				name,
				lat: itemLat,
				lng: itemLng,
				indoor: inferIndoor(tags, layer),
				address: null,
				city: null,
				state: null,
				url: tags.website || tags.url || null,
				driveMinutes: null,
				distanceMiles: Number(haversineMiles(lat, lng, itemLat, itemLng).toFixed(2)),
				freshAt,
				score: 0,
				reasons: [],
				raw: tags
			};
		})
		.filter(Boolean) as RadarEntity[];

	setRadarCache(cacheKey, entities, RadarCacheTTL.osm);
	return entities;
}

function buildQuery(lat: number, lng: number, radiusMeters: number): string {
	const around = `(around:${radiusMeters},${lat.toFixed(5)},${lng.toFixed(5)})`;
	return `
[out:json][timeout:3];
(
  node${around}[leisure=playground];
  way${around}[leisure=playground];
  relation${around}[leisure=playground];
  node${around}[leisure=park];
  way${around}[leisure=park];
  relation${around}[leisure=park];
  node${around}[amenity=library];
  way${around}[amenity=library];
  relation${around}[amenity=library];
  node${around}[amenity=toilets];
  way${around}[amenity=toilets];
  relation${around}[amenity=toilets];
  node${around}[amenity=cafe];
  way${around}[amenity=cafe];
  relation${around}[amenity=cafe];
  node${around}[amenity=ice_cream];
  way${around}[amenity=ice_cream];
  relation${around}[amenity=ice_cream];
  node${around}[shop=ice_cream];
  way${around}[shop=ice_cream];
  relation${around}[shop=ice_cream];
  node${around}[shop=bakery];
  way${around}[shop=bakery];
  relation${around}[shop=bakery];
  node${around}[tourism=museum];
  way${around}[tourism=museum];
  relation${around}[tourism=museum];
  node${around}[tourism=attraction];
  way${around}[tourism=attraction];
  relation${around}[tourism=attraction];
  node${around}[tourism=theme_park];
  way${around}[tourism=theme_park];
  relation${around}[tourism=theme_park];
  node${around}[tourism=zoo];
  way${around}[tourism=zoo];
  relation${around}[tourism=zoo];
  node${around}[tourism=aquarium];
  way${around}[tourism=aquarium];
  relation${around}[tourism=aquarium];
  node${around}[tourism=picnic_site];
  way${around}[tourism=picnic_site];
  relation${around}[tourism=picnic_site];
  node${around}[leisure=splash_pad];
  way${around}[leisure=splash_pad];
  relation${around}[leisure=splash_pad];
  node${around}[playground=splash_pad];
  way${around}[playground=splash_pad];
  relation${around}[playground=splash_pad];
);
out center 80;
`;
}

function inferLayer(tags: Record<string, string>): RadarLayer {
	if (tags.leisure === 'splash_pad' || tags.playground === 'splash_pad') return 'splash_pad';
	if (tags.amenity === 'library') return 'library';
	if (tags.amenity === 'toilets') return 'restroom';
	if (tags.tourism === 'museum') return 'museum';
	if (
		tags.tourism === 'attraction' ||
		tags.tourism === 'theme_park' ||
		tags.tourism === 'zoo' ||
		tags.tourism === 'aquarium'
	) {
		return 'attraction';
	}
	if (
		tags.amenity === 'cafe' ||
		tags.amenity === 'ice_cream' ||
		tags.shop === 'ice_cream' ||
		tags.shop === 'bakery'
	) {
		return 'food_play';
	}
	if (tags.tourism === 'picnic_site') return 'park';
	if (tags.leisure === 'playground') return 'playground';
	if (tags.leisure === 'park') return 'park';
	return 'curated';
}

function inferIndoor(tags: Record<string, string>, layer: RadarLayer): boolean | null {
	if (tags.indoor === 'yes') return true;
	if (tags.indoor === 'no') return false;

	switch (layer) {
		case 'library':
		case 'museum':
		case 'food_play':
			return true;
		case 'restroom':
		case 'attraction':
			return null;
		default:
			return false;
	}
}

function fallbackName(layer: RadarLayer): string {
	switch (layer) {
		case 'playground':
			return 'Public playground';
		case 'park':
			return 'Public park';
		case 'splash_pad':
			return 'Splash pad';
		case 'library':
			return 'Public library';
		case 'museum':
			return 'Museum';
		case 'attraction':
			return 'Family attraction';
		case 'food_play':
			return 'Food stop';
		case 'restroom':
			return 'Public restroom';
		default:
			return 'Nearby place';
	}
}
