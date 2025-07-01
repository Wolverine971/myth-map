// vite-plugin-generate-city-index.js
import { exec } from 'child_process';
import path from 'path';

export default function generateCityIndex() {
	return {
		name: 'generate-city-index',
		buildStart() {
			return new Promise((resolve, reject) => {
				exec('node generateCityIndex.js', { cwd: path.resolve() }, (error, stdout, stderr) => {
					if (error) {
						console.error(`exec error: ${error}`);
						return reject(error);
					}
					console.log(`stdout: ${stdout}`);
					console.error(`stderr: ${stderr}`);
					resolve();
				});
			});
		}
	};
}
