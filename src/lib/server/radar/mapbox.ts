// src/lib/server/radar/mapbox.ts
import { PUBLIC_MAP_KEY } from '$env/static/public';
import { getRadarCache, RadarCacheTTL, setRadarCache } from './cache';
import { emptyFeatureCollection } from './geo';

export async function fetchIsochrones(
	lat: number,
	lng: number,
	minutes: number[],
	signal: AbortSignal
): Promise<GeoJSON.FeatureCollection> {
	if (!PUBLIC_MAP_KEY) {
		throw new Error('PUBLIC_MAP_KEY is required for radar isochrones');
	}

	const contours = [...minutes].sort((a, b) => a - b).join(',');
	const cacheKey = `mapbox:isochrone:${lat.toFixed(2)}:${lng.toFixed(2)}:${contours}`;
	const cached = getRadarCache<GeoJSON.FeatureCollection>(cacheKey);
	if (cached) return cached;

	const url = new URL(
		`https://api.mapbox.com/isochrone/v1/mapbox/driving/${lng.toFixed(6)},${lat.toFixed(6)}`
	);
	url.searchParams.set('contours_minutes', contours);
	url.searchParams.set('polygons', 'true');
	url.searchParams.set('denoise', '1');
	url.searchParams.set('generalize', '80');
	url.searchParams.set('access_token', PUBLIC_MAP_KEY);

	const response = await fetch(url, { signal });
	if (!response.ok) {
		throw new Error(`Mapbox isochrone failed with ${response.status}`);
	}

	const data = (await response.json()) as GeoJSON.FeatureCollection;
	const result = data?.type === 'FeatureCollection' ? data : emptyFeatureCollection();
	setRadarCache(cacheKey, result, RadarCacheTTL.isochrone);
	return result;
}
