import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';


// import generateCityIndex from './vite-plugin-generate-city-index.js';
// import { geoJsonPlugin } from 'vite-plugin-tailwind-purgecss';
import { geoJsonPlugin } from './geoJsonPlugin';

export default defineConfig({
	plugins: [sveltekit(), geoJsonPlugin()],

	build: {
		assetsInlineLimit: 0, // Don't inline any assets, keep them as separate files
		rollupOptions: {
			output: {
				// Code splitting configuration
				manualChunks: {
					// Vendor chunks
					'vendor-ui': ['flowbite-svelte', 'flowbite-svelte-icons'],
				},
				// Ensure static assets are properly handled
				assetFileNames: (assetInfo) => {
					const info = assetInfo.name.split('.');
					const extType = info[info.length - 1];
					if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
						return `img/[name]-[hash][extname]`;
					}
					if (/woff2?|eot|ttf|otf/i.test(extType)) {
						return `fonts/[name]-[hash][extname]`;
					}
					return `assets/[name]-[hash][extname]`;
				}
			}
		},
		// Enable source maps for better debugging in production
		sourcemap: true,
		// Optimize chunk size warnings
		chunkSizeWarningLimit: 1000
	},

	// Optimize dependencies
	optimizeDeps: {
		include: [
			'flowbite-svelte',
			'flowbite-svelte-icons',
			'@supabase/supabase-js'
		],
		exclude: ['@mapbox/mapbox-sdk'] // Large dependency, load on demand
	}
});
