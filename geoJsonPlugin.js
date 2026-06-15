// geoJsonPlugin.js
import fs from 'fs';

/** @returns {import('vite').Plugin} */
export function geoJsonPlugin() {
	return {
		name: 'vite-plugin-geojson',
		/**
		 * @param {string} _code
		 * @param {string} id
		 */
		transform(_code, id) {
			if (id.endsWith('.json')) {
				const jsonContent = fs.readFileSync(id, 'utf-8');
				const parsedContent = JSON.parse(jsonContent);

				// Simplify the GeoJSON here if needed
				// For example, reduce the number of coordinates:
				/** @type {Array<{ geometry?: { coordinates?: unknown[] } }>} */
				const features = Array.isArray(parsedContent?.features) ? parsedContent.features : [];
				features.forEach((feature) => {
					const geometry = feature.geometry;
					const coordinates = geometry?.coordinates;
					if (geometry && Array.isArray(coordinates)) {
						geometry.coordinates = coordinates.map((ring) => {
							if (!Array.isArray(ring)) return ring;
							return ring.filter((_coordinate, index) => index % 10 === 0);
						});
					}
				});

				return {
					code: `export default ${JSON.stringify(parsedContent)}`,
					map: null
				};
			}
		}
	};
}
