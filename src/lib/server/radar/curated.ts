// src/lib/server/radar/curated.ts
import locationsData from '$lib/data/locations.json';
import { hrefForId } from '$lib/content/loader';
import type { RadarEntity, RadarLayer } from '$lib/types/radar';
import { boundingBox, haversineMiles, isInsideBoundingBox, kmToMiles } from './geo';

type RawLocation = {
	id: number;
	website?: string;
	location: {
		id?: number;
		name?: string;
		address_line_1?: string;
		address_line_2?: string;
		city?: string;
		state?: string;
		zip_code?: string;
		full_address?: string;
		website?: string;
		type?: string;
		indoor_outdoor?: string;
		lat?: number;
		lng?: number;
	};
};

type RawLocationTag = {
	location?: { name?: string };
	tags?: { name?: string };
};

const DATA = locationsData as {
	locations: RawLocation[];
	locationTags?: RawLocationTag[];
};

const TAGS_BY_LOCATION = new Map<string, string[]>();
for (const item of DATA.locationTags ?? []) {
	const name = item.location?.name;
	const tag = item.tags?.name;
	if (!name || !tag) continue;
	const tags = TAGS_BY_LOCATION.get(name) ?? [];
	tags.push(tag);
	TAGS_BY_LOCATION.set(name, tags);
}

export function getCuratedEntities(lat: number, lng: number, radiusKm: number): RadarEntity[] {
	const box = boundingBox(lat, lng, radiusKm);
	const radiusMiles = kmToMiles(radiusKm);
	const freshAt = new Date().toISOString();

	return DATA.locations
		.map((item): RadarEntity | null => {
			const loc = item.location;
			const itemLat = Number(loc.lat);
			const itemLng = Number(loc.lng);
			if (!Number.isFinite(itemLat) || !Number.isFinite(itemLng)) return null;
			if (!isInsideBoundingBox(itemLat, itemLng, box)) return null;

			const distanceMiles = haversineMiles(lat, lng, itemLat, itemLng);
			if (distanceMiles > radiusMiles) return null;

			const id = loc.id ?? item.id;
			const name = loc.name || 'Tiny Tribe location';
			const tags = TAGS_BY_LOCATION.get(name) ?? [];

			return {
				id: `tta:${id}`,
				source: 'tta',
				layer: inferLayer(name, loc.type, tags),
				name,
				lat: itemLat,
				lng: itemLng,
				indoor: normalizeIndoor(loc.indoor_outdoor),
				address: loc.full_address || buildAddress(loc),
				city: loc.city ?? null,
				state: loc.state ?? null,
				url: hrefForId(id) || item.website || loc.website || null,
				ageTags: tags.filter((tag) => /\b\d+\s*-\s*\d+\b/.test(tag)),
				driveMinutes: null,
				distanceMiles: Number(distanceMiles.toFixed(2)),
				freshAt,
				score: 0,
				reasons: []
			};
		})
		.filter(Boolean) as RadarEntity[];
}

function normalizeIndoor(value: string | undefined): boolean | null {
	const normalized = (value || '').toLowerCase();
	if (normalized.includes('indoor') && !normalized.includes('outdoor')) return true;
	if (normalized.includes('outdoor') && !normalized.includes('indoor')) return false;
	return null;
}

function inferLayer(name: string, type: string | undefined, tags: string[]): RadarLayer {
	const haystack = [name, type, ...tags].join(' ').toLowerCase();
	if (haystack.includes('splash') || haystack.includes('water play')) return 'splash_pad';
	if (haystack.includes('library')) return 'library';
	if (haystack.includes('museum')) return 'museum';
	if (haystack.includes('playground')) return 'playground';
	if (
		haystack.includes('park') ||
		haystack.includes('trail') ||
		haystack.includes('lake') ||
		haystack.includes('nature') ||
		haystack.includes('farm') ||
		haystack.includes('zoo')
	) {
		return 'park';
	}
	if (
		haystack.includes('aquarium') ||
		haystack.includes('science center') ||
		haystack.includes('mini golf') ||
		haystack.includes('trampoline') ||
		haystack.includes('climbing')
	) {
		return 'attraction';
	}
	if (
		haystack.includes('donut') ||
		haystack.includes('bakery') ||
		haystack.includes('ice cream') ||
		haystack.includes('brewery') ||
		haystack.includes('food')
	) {
		return 'food_play';
	}
	return 'curated';
}

function buildAddress(loc: RawLocation['location']): string | null {
	const street = [loc.address_line_1, loc.address_line_2].filter(Boolean).join(' ');
	const cityStateZip = [loc.city, [loc.state, loc.zip_code].filter(Boolean).join(' ')]
		.filter(Boolean)
		.join(', ');
	return [street, cityStateZip].filter(Boolean).join(', ') || null;
}
