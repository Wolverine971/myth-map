// src/lib/server/radar/geo.ts
import type { RadarEntity } from '$lib/types/radar';

const EARTH_RADIUS_MILES = 3958.7613;
const KM_PER_MILE = 1.609344;

export type BoundingBox = {
	minLat: number;
	maxLat: number;
	minLng: number;
	maxLng: number;
};

export function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return EARTH_RADIUS_MILES * c;
}

export function kmToMiles(km: number): number {
	return km / KM_PER_MILE;
}

export function boundingBox(lat: number, lng: number, radiusKm: number): BoundingBox {
	const latDelta = radiusKm / 111.32;
	const lngDelta = radiusKm / (111.32 * Math.max(0.2, Math.cos(toRad(lat))));
	return {
		minLat: lat - latDelta,
		maxLat: lat + latDelta,
		minLng: lng - lngDelta,
		maxLng: lng + lngDelta
	};
}

export function isInsideBoundingBox(lat: number, lng: number, box: BoundingBox): boolean {
	return lat >= box.minLat && lat <= box.maxLat && lng >= box.minLng && lng <= box.maxLng;
}

export function assignDriveMinutes(
	entity: RadarEntity,
	isochrones: GeoJSON.FeatureCollection,
	minutes: number[]
): 15 | 30 | 60 | null {
	const sorted = [...minutes].sort((a, b) => a - b);
	for (const minute of sorted) {
		const feature = isochrones.features.find((candidate) => {
			const contour = Number(candidate.properties?.contour);
			return contour === minute && pointInGeometry(entity.lng, entity.lat, candidate.geometry);
		});
		if (feature && (minute === 15 || minute === 30 || minute === 60)) return minute;
	}
	return null;
}

export function emptyFeatureCollection(): GeoJSON.FeatureCollection {
	return { type: 'FeatureCollection', features: [] };
}

function pointInGeometry(lng: number, lat: number, geometry: GeoJSON.Geometry): boolean {
	if (geometry.type === 'Polygon') {
		return pointInPolygon(lng, lat, geometry.coordinates);
	}
	if (geometry.type === 'MultiPolygon') {
		return geometry.coordinates.some((polygon) => pointInPolygon(lng, lat, polygon));
	}
	return false;
}

function pointInPolygon(lng: number, lat: number, rings: GeoJSON.Position[][]): boolean {
	const [outer, ...holes] = rings;
	if (!outer || !pointInRing(lng, lat, outer)) return false;
	return !holes.some((ring) => pointInRing(lng, lat, ring));
}

function pointInRing(lng: number, lat: number, ring: GeoJSON.Position[]): boolean {
	let inside = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const xi = Number(ring[i][0]);
		const yi = Number(ring[i][1]);
		const xj = Number(ring[j][0]);
		const yj = Number(ring[j][1]);
		const intersects = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
		if (intersects) inside = !inside;
	}
	return inside;
}

function toRad(degrees: number): number {
	return (degrees * Math.PI) / 180;
}
