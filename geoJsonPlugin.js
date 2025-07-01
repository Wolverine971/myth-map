// geoJsonPlugin.js
import fs from 'fs';
import path from 'path';

export function geoJsonPlugin() {
	return {
		name: 'vite-plugin-geojson',
		transform(code, id) {
			if (id.endsWith('.json')) {
				const jsonContent = fs.readFileSync(id, 'utf-8');
				const parsedContent = JSON.parse(jsonContent);

				// Simplify the GeoJSON here if needed
				// For example, reduce the number of coordinates:
				if (parsedContent?.features) {
					parsedContent.features.forEach((feature) => {
						if (feature.geometry && feature.geometry.coordinates) {
							feature.geometry.coordinates = feature.geometry.coordinates.map((ring) =>
								ring.filter((_, index) => index % 10 === 0)
							);
						}
					});
				}

				return {
					code: `export default ${JSON.stringify(parsedContent)}`,
					map: null
				};
			}
		}
	};
}
