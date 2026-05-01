// src/lib/components/map/map-features.ts
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
