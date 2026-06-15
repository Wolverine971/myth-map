// src/lib/server/radar/opensky.ts
import type { RadarEntity, RadarLayer } from '$lib/types/radar';
import { getRadarCache, RadarCacheTTL, setRadarCache } from './cache';
import { boundingBox, haversineMiles } from './geo';

type OpenSkyResponse = {
	time?: number;
	states?: Array<
		[
			string,
			string | null,
			string | null,
			number | null,
			number | null,
			number | null,
			number | null,
			number | null,
			boolean | null,
			number | null,
			number | null,
			number | null,
			number[] | null,
			number | null
		]
	>;
};

export async function fetchOpenSkyAircraft(
	lat: number,
	lng: number,
	radiusKm: number,
	layers: RadarLayer[],
	signal: AbortSignal
): Promise<RadarEntity[]> {
	if (!layers.includes('aircraft')) return [];

	const box = boundingBox(lat, lng, Math.min(radiusKm, 80));
	const cacheKey = `opensky:${lat.toFixed(2)}:${lng.toFixed(2)}:${layers.join('-')}`;
	const cached = getRadarCache<RadarEntity[]>(cacheKey);
	if (cached) return cached;

	const url = new URL('https://opensky-network.org/api/states/all');
	url.searchParams.set('lamin', box.minLat.toFixed(4));
	url.searchParams.set('lomin', box.minLng.toFixed(4));
	url.searchParams.set('lamax', box.maxLat.toFixed(4));
	url.searchParams.set('lomax', box.maxLng.toFixed(4));

	const response = await fetch(url, { signal });
	if (!response.ok) {
		throw new Error(`OpenSky request failed with ${response.status}`);
	}

	const data = (await response.json()) as OpenSkyResponse;
	const freshAt = new Date().toISOString();
	const entities = (data.states ?? [])
		.map((state): RadarEntity | null => {
			const [icao24, callsign, originCountry, , , aircraftLng, aircraftLat, baroAltitude] = state;
			if (aircraftLat == null || aircraftLng == null) return null;
			const distanceMiles = haversineMiles(lat, lng, aircraftLat, aircraftLng);
			const label = callsign?.trim() || icao24.toUpperCase();
			const altitude =
				typeof baroAltitude === 'number' ? `${Math.round(baroAltitude * 3.28084)} ft` : null;

			return {
				id: `opensky:${icao24}`,
				source: 'opensky',
				layer: 'aircraft',
				name: altitude ? `${label} at ${altitude}` : label,
				lat: aircraftLat,
				lng: aircraftLng,
				indoor: null,
				address: originCountry || null,
				city: null,
				state: null,
				url: `https://globe.adsbexchange.com/?icao=${icao24}`,
				driveMinutes: null,
				distanceMiles: Number(distanceMiles.toFixed(2)),
				freshAt,
				score: 0,
				reasons: [],
				raw: state
			};
		})
		.filter(isRadarEntity)
		.sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity))
		.slice(0, 20);

	setRadarCache(cacheKey, entities, RadarCacheTTL.opensky);
	return entities;
}

function isRadarEntity(entity: RadarEntity | null): entity is RadarEntity {
	return entity !== null;
}
