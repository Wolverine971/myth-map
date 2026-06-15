// src/lib/server/radar/normalize.ts
import type { RadarEntity } from '$lib/types/radar';
import { haversineMiles } from './geo';

const GENERIC_NAMES = new Set([
	'family attraction',
	'food stop',
	'museum',
	'nearby place',
	'public library',
	'public park',
	'public playground',
	'public restroom',
	'splash pad'
]);

export function dedupeRadarEntities(entities: RadarEntity[]): RadarEntity[] {
	const deduped: RadarEntity[] = [];

	for (const entity of entities) {
		const duplicateIndex = deduped.findIndex((existing) => isDuplicate(existing, entity));
		if (duplicateIndex === -1) {
			deduped.push(entity);
			continue;
		}

		deduped[duplicateIndex] = mergePreferredEntity(deduped[duplicateIndex], entity);
	}

	return deduped;
}

function isDuplicate(a: RadarEntity, b: RadarEntity): boolean {
	if (a.id && a.id === b.id) return true;
	if (a.layer !== b.layer) return false;

	const aName = normalizeName(a.name);
	const bName = normalizeName(b.name);
	if (!aName || !bName || aName !== bName || GENERIC_NAMES.has(aName)) return false;

	return haversineMiles(a.lat, a.lng, b.lat, b.lng) <= 0.35;
}

function mergePreferredEntity(a: RadarEntity, b: RadarEntity): RadarEntity {
	const winner = entityQuality(b) > entityQuality(a) ? b : a;
	const fallback = winner === a ? b : a;
	const nearestDistance = Math.min(
		winner.distanceMiles ?? Infinity,
		fallback.distanceMiles ?? Infinity
	);

	return {
		...winner,
		address: winner.address ?? fallback.address,
		city: winner.city ?? fallback.city,
		state: winner.state ?? fallback.state,
		url: winner.url ?? fallback.url,
		ageTags: winner.ageTags?.length ? winner.ageTags : fallback.ageTags,
		driveMinutes: winner.driveMinutes ?? fallback.driveMinutes,
		distanceMiles: Number.isFinite(nearestDistance) ? nearestDistance : undefined,
		startsAt: winner.startsAt ?? fallback.startsAt,
		endsAt: winner.endsAt ?? fallback.endsAt
	};
}

function entityQuality(entity: RadarEntity): number {
	let quality = sourcePriority(entity.source);
	if (entity.url) quality += 3;
	if (entity.address || entity.city) quality += 2;
	if (!GENERIC_NAMES.has(normalizeName(entity.name))) quality += 1;
	return quality;
}

function sourcePriority(source: RadarEntity['source']): number {
	switch (source) {
		case 'ticketmaster':
			return 6;
		case 'tta':
			return 5;
		case 'wikipedia':
		case 'wikidata':
			return 4;
		case 'osm':
			return 3;
		case 'opensky':
		case 'socrata':
			return 2;
		default:
			return 0;
	}
}

function normalizeName(name: string): string {
	return name
		.toLowerCase()
		.replace(/&/g, 'and')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim()
		.replace(/\s+/g, ' ');
}
