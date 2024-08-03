import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
// import generateCityIndex from './vite-plugin-generate-city-index.js';
// import { purgeCss } from 'vite-plugin-tailwind-purgecss';

export default defineConfig({
	plugins: [sveltekit()]
});
