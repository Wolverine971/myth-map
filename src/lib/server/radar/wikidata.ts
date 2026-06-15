// src/lib/server/radar/wikidata.ts
import type { RadarEntity, RadarLayer } from '$lib/types/radar';
import { RADAR_USER_AGENT } from './config';
import { getRadarCache, RadarCacheTTL, setRadarCache } from './cache';
import { haversineMiles } from './geo';

type WikidataBinding = {
	item?: { value?: string };
	itemLabel?: { value?: string };
	coord?: { value?: string };
	dist?: { value?: string };
	class?: { value?: string };
	article?: { value?: string };
};

type WikidataResponse = {
	results?: {
		bindings?: WikidataBinding[];
	};
};

const WIKIDATA_URL = 'https://query.wikidata.org/sparql';
const WIKIDATA_LAYERS = new Set<RadarLayer>(['museum', 'attraction', 'park']);
const CLASS_TO_LAYER: Record<string, RadarLayer> = {
	Q33506: 'museum',
	Q570116: 'attraction',
	Q16560: 'attraction',
	Q43501: 'attraction',
	Q22698: 'park'
};

export async function fetchWikidataEntities(
	lat: number,
	lng: number,
	radiusKm: number,
	layers: RadarLayer[],
	signal: AbortSignal
): Promise<RadarEntity[]> {
	if (!layers.some((layer) => WIKIDATA_LAYERS.has(layer))) return [];

	const radius = Math.min(50, Math.max(1, Math.round(radiusKm)));
	const cacheKey = `wikidata:${lat.toFixed(2)}:${lng.toFixed(2)}:${radius}:${layers.join('-')}`;
	const cached = getRadarCache<RadarEntity[]>(cacheKey);
	if (cached) return cached;

	const query = buildQuery(lat, lng, radius);
	const url = new URL(WIKIDATA_URL);
	url.searchParams.set('format', 'json');
	url.searchParams.set('query', query);

	const response = await fetch(url, {
		signal,
		headers: {
			Accept: 'application/sparql-results+json, application/json',
			'User-Agent': RADAR_USER_AGENT
		}
	});

	if (!response.ok) {
		throw new Error(`Wikidata request failed with ${response.status}`);
	}

	const data = (await response.json()) as WikidataResponse;
	const requested = new Set(layers);
	const freshAt = new Date().toISOString();
	const deduped = new Map<string, RadarEntity>();

	for (const binding of data.results?.bindings ?? []) {
		const id = wikidataId(binding.item?.value);
		const coord = parseWktPoint(binding.coord?.value);
		if (!id || !coord) continue;

		const classId = wikidataId(binding.class?.value);
		const layer = (classId && CLASS_TO_LAYER[classId]) || 'attraction';
		if (!requested.has(layer)) continue;

		const distanceMiles = haversineMiles(lat, lng, coord.lat, coord.lng);
		const previous = deduped.get(id);
		if (previous && (previous.distanceMiles ?? Infinity) <= distanceMiles) continue;

		deduped.set(id, {
			id: `wikidata:${id}`,
			source: 'wikidata',
			layer,
			name: binding.itemLabel?.value || 'Notable nearby place',
			lat: coord.lat,
			lng: coord.lng,
			indoor: layer === 'museum' ? true : null,
			address: null,
			city: null,
			state: null,
			url: binding.article?.value || binding.item?.value || null,
			driveMinutes: null,
			distanceMiles: Number(distanceMiles.toFixed(2)),
			freshAt,
			score: 0,
			reasons: [],
			raw: binding
		});
	}

	const entities = [...deduped.values()];
	setRadarCache(cacheKey, entities, RadarCacheTTL.wikidata);
	return entities;
}

function buildQuery(lat: number, lng: number, radiusKm: number): string {
	return `
SELECT ?item ?itemLabel ?coord ?dist ?class ?article WHERE {
  VALUES ?class { wd:Q33506 wd:Q570116 wd:Q16560 wd:Q43501 wd:Q22698 }
  SERVICE wikibase:around {
    ?item wdt:P625 ?coord.
    bd:serviceParam wikibase:center "Point(${lng.toFixed(5)} ${lat.toFixed(5)})"^^geo:wktLiteral.
    bd:serviceParam wikibase:radius "${radiusKm}".
    bd:serviceParam wikibase:distance ?dist.
  }
  ?item wdt:P31/wdt:P279* ?class.
  OPTIONAL {
    ?article schema:about ?item;
      schema:isPartOf <https://en.wikipedia.org/>.
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?dist
LIMIT 50
`;
}

function wikidataId(value: string | undefined): string | null {
	if (!value) return null;
	const match = value.match(/\/(Q\d+)$/);
	return match?.[1] ?? null;
}

function parseWktPoint(value: string | undefined): { lat: number; lng: number } | null {
	if (!value) return null;
	const match = value.match(/Point\(([-\d.]+) ([-\d.]+)\)/);
	if (!match) return null;
	const lng = Number(match[1]);
	const lat = Number(match[2]);
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
	return { lat, lng };
}
