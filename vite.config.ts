// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
// import generateCityIndex from './vite-plugin-generate-city-index.js';
// import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { geoJsonPlugin } from './geoJsonPlugin';

export default defineConfig({
	plugins: [sveltekit(), geoJsonPlugin()],

	build: {
		assetsInlineLimit: 1000000000 // 100MB
	}
});
