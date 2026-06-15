// src/lib/server/radar/config.ts
import { env } from '$env/dynamic/private';
import {
	DEFAULT_RADAR_LAYERS,
	isRadarLayer,
	type RadarLayer,
	type RadarScanRequest
} from '$lib/types/radar';

export const RADAR_SOURCE_TIMEOUT_MS = 2500;
export const RADAR_MAX_RADIUS_KM = 80;
export const RADAR_RESULT_LIMIT = 60;
export const RADAR_USER_AGENT =
	env.RADAR_USER_AGENT || 'Tiny Tribe Adventures radar (https://tinytribeadventures.com)';

const DEFAULT_MINUTES: Array<15 | 30 | 60> = [15, 30, 60];
const ALLOWED_MINUTES = new Set([15, 30, 60]);

export function parseRadarRequest(url: URL): RadarScanRequest {
	const lat = parseCoordinate(url.searchParams.get('lat'), 'lat', -90, 90);
	const lng = parseCoordinate(url.searchParams.get('lng'), 'lng', -180, 180);

	return {
		lat,
		lng,
		minutes: parseMinutes(url.searchParams.get('minutes')),
		ages: parseAges(url.searchParams.get('ages')),
		layers: parseLayers(url.searchParams.get('layers'))
	};
}

export function radiusKmForMinutes(minutes: number[]): number {
	const maxMinutes = Math.max(...minutes, 15);
	return Math.min(RADAR_MAX_RADIUS_KM, Math.max(8, maxMinutes * 1.35));
}

export function buildRadarCacheKey(request: RadarScanRequest): string {
	const latTile = roundForTile(request.lat);
	const lngTile = roundForTile(request.lng);
	return [
		'radar',
		latTile,
		lngTile,
		request.minutes.join('-'),
		request.ages.join('-') || 'all',
		request.layers.join('-')
	].join(':');
}

function parseCoordinate(raw: string | null, label: string, min: number, max: number): number {
	if (raw == null || raw.trim() === '') {
		throw new Error(`Invalid ${label}`);
	}
	const value = Number(raw);
	if (!Number.isFinite(value) || value < min || value > max) {
		throw new Error(`Invalid ${label}`);
	}
	return value;
}

function parseMinutes(raw: string | null): Array<15 | 30 | 60> {
	if (!raw) return DEFAULT_MINUTES;
	const out = raw
		.split(',')
		.map((part) => Number(part.trim()))
		.filter((value) => ALLOWED_MINUTES.has(value)) as Array<15 | 30 | 60>;

	if (out.length === 0) return DEFAULT_MINUTES;
	return [...new Set(out)].slice(0, 3);
}

function parseAges(raw: string | null): number[] {
	if (!raw) return [];
	return raw
		.split(',')
		.map((part) => Number(part.trim()))
		.filter((value) => Number.isInteger(value) && value >= 0 && value <= 17);
}

function parseLayers(raw: string | null): RadarLayer[] {
	if (!raw) return [...DEFAULT_RADAR_LAYERS];
	const out = raw
		.split(',')
		.map((part) => part.trim())
		.filter(isRadarLayer);
	return out.length ? [...new Set(out)] : [...DEFAULT_RADAR_LAYERS];
}

function roundForTile(value: number): string {
	return (Math.round(value * 50) / 50).toFixed(2);
}
