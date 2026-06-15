// src/lib/server/radar/wikipedia.ts
import type { RadarEntity, RadarLayer } from '$lib/types/radar';
import { getRadarCache, RadarCacheTTL, setRadarCache } from './cache';
import { RADAR_USER_AGENT } from './config';
import { haversineMiles, kmToMiles } from './geo';

type WikipediaGeosearchPage = {
	pageid?: number;
	title?: string;
	lat?: number;
	lon?: number;
	dist?: number;
};

type WikipediaGeosearchResponse = {
	query?: {
		geosearch?: WikipediaGeosearchPage[];
	};
};

const WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php';
const WIKIPEDIA_LAYERS = new Set<RadarLayer>(['museum', 'attraction', 'park', 'library']);

export async function fetchWikipediaPlaces(
	lat: number,
	lng: number,
	radiusKm: number,
	layers: RadarLayer[],
	signal: AbortSignal
): Promise<RadarEntity[]> {
	if (!layers.some((layer) => WIKIPEDIA_LAYERS.has(layer))) return [];

	const radiusMeters = Math.min(10000, Math.max(1000, Math.round(radiusKm * 1000)));
	const cacheKey = `wikipedia:${lat.toFixed(2)}:${lng.toFixed(2)}:${radiusMeters}:${layers.join('-')}`;
	const cached = getRadarCache<RadarEntity[]>(cacheKey);
	if (cached) return cached;

	const url = new URL(WIKIPEDIA_API_URL);
	url.searchParams.set('action', 'query');
	url.searchParams.set('format', 'json');
	url.searchParams.set('list', 'geosearch');
	url.searchParams.set('gscoord', `${lat.toFixed(5)}|${lng.toFixed(5)}`);
	url.searchParams.set('gsradius', String(radiusMeters));
	url.searchParams.set('gslimit', '50');
	url.searchParams.set('origin', '*');

	const response = await fetch(url, {
		signal,
		headers: {
			Accept: 'application/json',
			'User-Agent': RADAR_USER_AGENT
		}
	});

	if (!response.ok) {
		throw new Error(`Wikipedia request failed with ${response.status}`);
	}

	const data = (await response.json()) as WikipediaGeosearchResponse;
	const requested = new Set(layers);
	const freshAt = new Date().toISOString();
	const entities = (data.query?.geosearch ?? [])
		.map((page): RadarEntity | null => {
			if (!page.pageid || !page.title || page.lat == null || page.lon == null) return null;

			const layer = inferLayer(page.title);
			if (!layer) return null;
			if (!requested.has(layer)) return null;

			const distanceMiles =
				typeof page.dist === 'number'
					? kmToMiles(page.dist / 1000)
					: haversineMiles(lat, lng, page.lat, page.lon);

			return {
				id: `wikipedia:${page.pageid}`,
				source: 'wikipedia',
				layer,
				name: page.title,
				lat: page.lat,
				lng: page.lon,
				indoor: inferIndoor(layer),
				address: null,
				city: null,
				state: null,
				url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/\s+/g, '_'))}`,
				driveMinutes: null,
				distanceMiles: Number(distanceMiles.toFixed(2)),
				freshAt,
				score: 0,
				reasons: [],
				raw: page
			};
		})
		.filter(isRadarEntity);

	setRadarCache(cacheKey, entities, RadarCacheTTL.wikipedia);
	return entities;
}

function inferLayer(title: string): RadarLayer | null {
	const fullTitle = title.toLowerCase();
	const haystack = fullTitle.replace(/\s*\(.+?\)\s*$/, '').trim();
	if (isLikelyNonDestination(fullTitle, haystack)) return null;

	if (haystack.includes('museum')) return 'museum';
	if (haystack.includes('library')) return 'library';
	if (
		haystack.includes('park') ||
		haystack.includes('garden') ||
		haystack.includes('trail') ||
		haystack.includes('preserve') ||
		haystack.includes('arboretum') ||
		haystack.includes('nature center')
	) {
		return 'park';
	}
	if (
		haystack.includes('aquarium') ||
		haystack.includes('zoo') ||
		haystack.includes('observatory') ||
		haystack.includes('planetarium') ||
		haystack.includes('science center') ||
		haystack.includes('art center') ||
		haystack.includes('arts center') ||
		haystack.includes('visitor center') ||
		haystack.includes('theater') ||
		haystack.includes('theatre') ||
		haystack.includes('railroad') ||
		haystack.includes('railway') ||
		haystack.includes('train') ||
		hasWord(haystack, 'farm') ||
		hasWord(haystack, 'mill') ||
		haystack.includes('historic') ||
		haystack.includes('monument') ||
		hasWord(haystack, 'market')
	) {
		return 'attraction';
	}
	return null;
}

function isLikelyNonDestination(fullTitle: string, haystack: string): boolean {
	return (
		/,\s*(maryland|virginia|delaware|washington,\s*d\.?c\.?)$/.test(fullTitle) ||
		/\b(road|route|academy|school|department|county|township|station|mall)\b/.test(haystack)
	);
}

function hasWord(haystack: string, word: string): boolean {
	return new RegExp(`\\b${word}\\b`).test(haystack);
}

function inferIndoor(layer: RadarLayer): boolean | null {
	if (layer === 'museum' || layer === 'library') return true;
	if (layer === 'park') return false;
	return null;
}

function isRadarEntity(entity: RadarEntity | null): entity is RadarEntity {
	return entity !== null;
}
