// src/lib/types/radar.ts
export const RADAR_LAYERS = [
	'curated',
	'playground',
	'park',
	'splash_pad',
	'library',
	'museum',
	'attraction',
	'event',
	'food_play',
	'restroom',
	'aircraft'
] as const;

export const DEFAULT_RADAR_LAYERS = [
	'playground',
	'park',
	'splash_pad',
	'library',
	'museum',
	'attraction',
	'food_play',
	'restroom',
	'curated'
] as const satisfies readonly RadarLayer[];

export type RadarSource =
	| 'tta'
	| 'mapbox'
	| 'nws'
	| 'suncalc'
	| 'osm'
	| 'wikipedia'
	| 'wikidata'
	| 'ticketmaster'
	| 'opensky'
	| 'socrata';

export type RadarLayer = (typeof RADAR_LAYERS)[number];

export type RadarSourceState = 'ok' | 'cached' | 'timeout' | 'error' | 'skipped';

export interface RadarEntity {
	id: string;
	source: RadarSource;
	layer: RadarLayer;
	name: string;
	lat: number;
	lng: number;
	indoor: boolean | null;
	address?: string | null;
	city?: string | null;
	state?: string | null;
	url?: string | null;
	ageTags?: string[];
	driveMinutes?: 15 | 30 | 60 | null;
	distanceMiles?: number;
	startsAt?: string | null;
	endsAt?: string | null;
	freshAt: string;
	score: number;
	reasons: string[];
	raw?: unknown;
}

export interface RadarConditions {
	tempF: number | null;
	summary: string;
	isWet: boolean;
	isHot: boolean;
	isCold: boolean;
	daylightRemainingMin: number;
	sunsetAt: string | null;
	alerts: string[];
}

export interface RadarSourceStatus {
	source: RadarSource;
	status: RadarSourceState;
	durationMs?: number;
	message?: string;
}

export interface RadarResult {
	center: { lat: number; lng: number };
	minutes: number[];
	isochrones: GeoJSON.FeatureCollection;
	conditions: RadarConditions;
	entities: RadarEntity[];
	sourceStatus: RadarSourceStatus[];
	generatedAt: string;
	partial: boolean;
	cacheKey: string;
}

export interface RadarScanRequest {
	lat: number;
	lng: number;
	minutes: Array<15 | 30 | 60>;
	ages: number[];
	layers: RadarLayer[];
}

export function isRadarLayer(value: string): value is RadarLayer {
	return (RADAR_LAYERS as readonly string[]).includes(value);
}
