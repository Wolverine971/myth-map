// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// import generateCityIndex from './vite-plugin-generate-city-index.js';
import { geoJsonPlugin } from './geoJsonPlugin';

export default defineConfig({
	plugins: [sveltekit(), geoJsonPlugin()],

	build: {
		assetsInlineLimit: 0, // Don't inline any assets, keep them as separate files
		rolldownOptions: {
			output: {
				codeSplitting: {
					groups: [
						{
							name: 'vendor-ui',
							test: /node_modules\/(?:flowbite-svelte|flowbite-svelte-icons)\//
						}
					]
				}
			}
		},
		// Enable source maps for better debugging in production
		sourcemap: true,
		// Optimize chunk size warnings
		chunkSizeWarningLimit: 1000
	},

	// Optimize dependencies
	// @mapbox/mapbox-sdk is only imported server-side (src/routes/+page.server.ts),
	// so Vite never pre-bundles it for the browser — no need to exclude.
	optimizeDeps: {
		include: ['flowbite-svelte', 'flowbite-svelte-icons']
	}
});
