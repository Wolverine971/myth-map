// src/lib/components/map/map-features.ts
import type { RadarEntity } from '$lib/types/radar';
import { getLocationIcon } from '../../../utils/locationPhotos.js';

export function buildFeatureCollection(locations: any[]): GeoJSON.FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: locations
			.filter((l) => l?.location?.lat != null && l?.location?.lng != null)
			.map((contentLocation, i) => ({
				type: 'Feature',
				properties: {
					latitude: contentLocation.location.lat,
					longitude: contentLocation.location.lng,
					address_line_1: contentLocation.location.address_line_1 || '',
					city: contentLocation.location.city || '',
					state: contentLocation.location.state || '',
					zip_code: contentLocation.location.zip_code || '',
					website: contentLocation.website || '',
					name: contentLocation.location.name || 'Unknown Location',
					id: contentLocation.location.id ?? i,
					icon: `${getLocationIcon(contentLocation.location.name || 'default')}1`
				},
				geometry: {
					type: 'Point',
					coordinates: [Number(contentLocation.location.lng), Number(contentLocation.location.lat)]
				}
			}))
	};
}

export function buildRadarFeatureCollection(entities: RadarEntity[]): GeoJSON.FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: entities
			.filter((entity) => entity.lat != null && entity.lng != null)
			.map((entity) => ({
				type: 'Feature',
				properties: {
					id: entity.id,
					name: entity.name,
					source: entity.source,
					layer: entity.layer,
					icon: `${radarIcon(entity)}1`,
					driveMinutes: entity.driveMinutes ?? '',
					distanceMiles: entity.distanceMiles ?? '',
					score: entity.score,
					reason: entity.reasons[0] ?? '',
					url: entity.url ?? '',
					address: entity.address ?? '',
					city: entity.city ?? '',
					state: entity.state ?? ''
				},
				geometry: {
					type: 'Point',
					coordinates: [Number(entity.lng), Number(entity.lat)]
				}
			}))
	};
}

function radarIcon(entity: RadarEntity): string {
	if (entity.source === 'tta') return getLocationIcon(entity.name || 'default');
	switch (entity.layer) {
		case 'playground':
			return 'playground';
		case 'park':
			return 'park1';
		case 'splash_pad':
			return 'splash-pad';
		case 'library':
			return 'library';
		case 'museum':
			return 'museum';
		case 'attraction':
			return 'community-center';
		case 'event':
			return 'community-center';
		case 'food_play':
			return 'bakery';
		case 'aircraft':
			return 'aircraft-observation';
		default:
			return 'mythmap';
	}
}
