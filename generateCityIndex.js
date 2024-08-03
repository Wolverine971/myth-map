import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const citiesDir = path.join(__dirname, './src/geographies/cities');

async function generateCityIndex() {
	try {
		const stateDirs = await fs.readdir(citiesDir);

		for (const stateDir of stateDirs) {
			const statePath = path.join(citiesDir, stateDir);
			const stats = await fs.stat(statePath);

			if (stats.isDirectory()) {
				const files = await fs.readdir(statePath);
				const cities = files
					.filter((file) => file.endsWith('.json'))
					.map((file) => file.replace('.json', ''));

				await fs.writeFile(path.join(statePath, 'index.json'), JSON.stringify(cities));
			}
		}

		console.log('City indexes generated successfully.');
	} catch (error) {
		console.error('Error generating city indexes:', error);
	}
}

generateCityIndex();
