// src/lib/server/radar/ticketmaster.ts
import { env } from '$env/dynamic/private';
import type { RadarEntity, RadarLayer } from '$lib/types/radar';
import { getRadarCache, RadarCacheTTL, setRadarCache } from './cache';
import { haversineMiles, kmToMiles } from './geo';

type TicketmasterEvent = {
	id?: string;
	name?: string;
	url?: string;
	dates?: {
		start?: {
			dateTime?: string;
			localDate?: string;
			localTime?: string;
		};
	};
	_embedded?: {
		venues?: Array<{
			name?: string;
			city?: { name?: string };
			state?: { stateCode?: string };
			address?: { line1?: string };
			location?: { latitude?: string; longitude?: string };
		}>;
	};
};

type TicketmasterResponse = {
	_embedded?: {
		events?: TicketmasterEvent[];
	};
};

export function hasTicketmasterKey(): boolean {
	return !!env.TICKETMASTER_API_KEY;
}

export async function fetchTicketmasterEvents(
	lat: number,
	lng: number,
	radiusKm: number,
	layers: RadarLayer[],
	signal: AbortSignal
): Promise<RadarEntity[]> {
	if (!layers.includes('event')) return [];
	const apiKey = env.TICKETMASTER_API_KEY;
	if (!apiKey) return [];

	const radiusMiles = Math.min(50, Math.max(5, Math.round(kmToMiles(radiusKm))));
	const cacheKey = `ticketmaster:${lat.toFixed(2)}:${lng.toFixed(2)}:${radiusMiles}`;
	const cached = getRadarCache<RadarEntity[]>(cacheKey);
	if (cached) return cached;

	const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
	url.searchParams.set('apikey', apiKey);
	url.searchParams.set('latlong', `${lat.toFixed(5)},${lng.toFixed(5)}`);
	url.searchParams.set('radius', String(radiusMiles));
	url.searchParams.set('unit', 'miles');
	url.searchParams.set('classificationName', 'family');
	url.searchParams.set('sort', 'date,asc');
	url.searchParams.set('size', '20');

	const response = await fetch(url, { signal });
	if (!response.ok) {
		throw new Error(`Ticketmaster request failed with ${response.status}`);
	}

	const data = (await response.json()) as TicketmasterResponse;
	const freshAt = new Date().toISOString();
	const entities = (data._embedded?.events ?? [])
		.map((event): RadarEntity | null => {
			const venue = event._embedded?.venues?.[0];
			const eventLat = Number(venue?.location?.latitude);
			const eventLng = Number(venue?.location?.longitude);
			if (!event.id || !event.name || !Number.isFinite(eventLat) || !Number.isFinite(eventLng)) {
				return null;
			}
			const distanceMiles = haversineMiles(lat, lng, eventLat, eventLng);
			const startsAt =
				event.dates?.start?.dateTime ||
				[event.dates?.start?.localDate, event.dates?.start?.localTime].filter(Boolean).join('T') ||
				null;

			return {
				id: `ticketmaster:${event.id}`,
				source: 'ticketmaster',
				layer: 'event',
				name: event.name,
				lat: eventLat,
				lng: eventLng,
				indoor: null,
				address: venue?.address?.line1 || venue?.name || null,
				city: venue?.city?.name || null,
				state: venue?.state?.stateCode || null,
				url: event.url || null,
				driveMinutes: null,
				distanceMiles: Number(distanceMiles.toFixed(2)),
				startsAt,
				freshAt,
				score: 0,
				reasons: [],
				raw: event
			};
		})
		.filter(Boolean) as RadarEntity[];

	setRadarCache(cacheKey, entities, RadarCacheTTL.ticketmaster);
	return entities;
}
