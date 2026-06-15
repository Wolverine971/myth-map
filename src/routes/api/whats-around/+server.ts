// src/routes/api/whats-around/+server.ts
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { RadarEntity, RadarResult, RadarSource, RadarSourceStatus } from '$lib/types/radar';
import {
	buildRadarCacheKey,
	parseRadarRequest,
	radiusKmForMinutes,
	RADAR_SOURCE_TIMEOUT_MS
} from '$lib/server/radar/config';
import { getRadarCache, RadarCacheTTL, setRadarCache } from '$lib/server/radar/cache';
import { getCuratedEntities } from '$lib/server/radar/curated';
import { getDaylight } from '$lib/server/radar/daylight';
import { assignDriveMinutes, emptyFeatureCollection } from '$lib/server/radar/geo';
import { fetchIsochrones } from '$lib/server/radar/mapbox';
import { fetchWeather } from '$lib/server/radar/nws';
import { fetchOsmEntities } from '$lib/server/radar/osm';
import { fetchOpenSkyAircraft } from '$lib/server/radar/opensky';
import { dedupeRadarEntities } from '$lib/server/radar/normalize';
import { rankEntities } from '$lib/server/radar/rank';
import { fetchTicketmasterEvents, hasTicketmasterKey } from '$lib/server/radar/ticketmaster';
import { fetchWikipediaPlaces } from '$lib/server/radar/wikipedia';
import { fetchWikidataEntities } from '$lib/server/radar/wikidata';

type SourceRun<T> = {
	data: T | null;
	status: RadarSourceStatus;
};

export const GET: RequestHandler = async ({ url }) => {
	let request;
	try {
		request = parseRadarRequest(url);
	} catch (err) {
		throw error(400, err instanceof Error ? err.message : 'Invalid radar request');
	}

	const cacheKey = buildRadarCacheKey(request);
	const cached = getRadarCache<RadarResult>(cacheKey);
	if (cached) {
		return json({
			...cached,
			sourceStatus: cached.sourceStatus.map((status) =>
				status.status === 'skipped' ? status : { ...status, status: 'cached' }
			)
		});
	}

	const radiusKm = radiusKmForMinutes(request.minutes);
	const shouldFetchOsm = request.layers.some((layer) =>
		[
			'playground',
			'park',
			'splash_pad',
			'library',
			'museum',
			'attraction',
			'food_play',
			'restroom'
		].includes(layer)
	);
	const shouldFetchWikidata = request.layers.some((layer) =>
		['museum', 'attraction', 'park'].includes(layer)
	);
	const shouldFetchWikipedia = request.layers.some((layer) =>
		['museum', 'attraction', 'park', 'library'].includes(layer)
	);
	const shouldFetchTicketmaster = request.layers.includes('event');
	const shouldFetchOpenSky = request.layers.includes('aircraft');

	const [
		isochronesRun,
		weatherRun,
		daylightRun,
		curatedRun,
		osmRun,
		wikipediaRun,
		wikidataRun,
		ticketmasterRun,
		openskyRun
	] = await Promise.all([
		runSource('mapbox', (signal) =>
			fetchIsochrones(request.lat, request.lng, request.minutes, signal)
		),
		runSource('nws', (signal) => fetchWeather(request.lat, request.lng, signal)),
		runSource('suncalc', async () => getDaylight(request.lat, request.lng), 250),
		runSource('tta', async () => getCuratedEntities(request.lat, request.lng, radiusKm), 250),
		shouldFetchOsm
			? runSource(
					'osm',
					(signal) => fetchOsmEntities(request.lat, request.lng, radiusKm, request.layers, signal),
					4500
				)
			: skippedArraySource('osm'),
		shouldFetchWikipedia
			? runSource('wikipedia', (signal) =>
					fetchWikipediaPlaces(request.lat, request.lng, radiusKm, request.layers, signal)
				)
			: skippedArraySource('wikipedia'),
		shouldFetchWikidata
			? runSource(
					'wikidata',
					(signal) =>
						fetchWikidataEntities(request.lat, request.lng, radiusKm, request.layers, signal),
					4500
				)
			: skippedArraySource('wikidata'),
		shouldFetchTicketmaster && hasTicketmasterKey()
			? runSource('ticketmaster', (signal) =>
					fetchTicketmasterEvents(request.lat, request.lng, radiusKm, request.layers, signal)
				)
			: skippedArraySource(
					'ticketmaster',
					shouldFetchTicketmaster ? 'TICKETMASTER_API_KEY not configured' : undefined
				),
		shouldFetchOpenSky
			? runSource('opensky', (signal) =>
					fetchOpenSkyAircraft(request.lat, request.lng, radiusKm, request.layers, signal)
				)
			: skippedArraySource('opensky')
	]);

	const isochrones = isochronesRun.data ?? emptyFeatureCollection();
	const daylight = daylightRun.data ?? { daylightRemainingMin: 0, sunsetAt: null };
	const weather = weatherRun.data ?? {
		tempF: null,
		summary: 'Conditions unavailable',
		isWet: false,
		isHot: false,
		isCold: false,
		alerts: []
	};

	const conditions = {
		...weather,
		...daylight
	};

	const enabledLayers = new Set(request.layers);
	const normalized = dedupeRadarEntities([
		...(curatedRun.data ?? []),
		...(osmRun.data ?? []),
		...(wikipediaRun.data ?? []),
		...(wikidataRun.data ?? []),
		...(ticketmasterRun.data ?? []),
		...(openskyRun.data ?? [])
	])
		.filter((entity) => enabledLayers.has(entity.layer))
		.map((entity) => ({
			...entity,
			driveMinutes: assignDriveMinutes(entity, isochrones, request.minutes)
		}));

	const sourceStatus = [
		isochronesRun.status,
		weatherRun.status,
		daylightRun.status,
		curatedRun.status,
		osmRun.status,
		wikipediaRun.status,
		wikidataRun.status,
		ticketmasterRun.status,
		openskyRun.status
	];

	const result: RadarResult = {
		center: { lat: request.lat, lng: request.lng },
		minutes: request.minutes,
		isochrones,
		conditions,
		entities: rankEntities(normalized, conditions, request.ages),
		sourceStatus,
		generatedAt: new Date().toISOString(),
		partial: sourceStatus.some(
			(status) => status.status === 'timeout' || status.status === 'error'
		),
		cacheKey
	};

	setRadarCache(cacheKey, result, RadarCacheTTL.result);
	return json(result);
};

function skippedArraySource(
	source: RadarSource,
	message?: string
): Promise<SourceRun<RadarEntity[]>> {
	return Promise.resolve({
		data: [],
		status: {
			source,
			status: 'skipped',
			...(message ? { message } : {})
		}
	});
}

async function runSource<T>(
	source: RadarSource,
	task: (signal: AbortSignal) => Promise<T>,
	timeoutMs = RADAR_SOURCE_TIMEOUT_MS
): Promise<SourceRun<T>> {
	const started = Date.now();
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const data = await task(controller.signal);
		return {
			data,
			status: { source, status: 'ok', durationMs: Date.now() - started }
		};
	} catch (err) {
		const timedOut =
			controller.signal.aborted ||
			(err instanceof Error && (err.name === 'AbortError' || /abort/i.test(err.message)));
		return {
			data: null,
			status: {
				source,
				status: timedOut ? 'timeout' : 'error',
				durationMs: Date.now() - started,
				message: err instanceof Error ? err.message : 'Source failed'
			}
		};
	} finally {
		clearTimeout(timeout);
	}
}
