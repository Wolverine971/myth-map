// vite.config.ts
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { mdsvex } from 'mdsvex';
import mdsvexConfig from './mdsvex.config.js';
import { geoJsonPlugin } from './geoJsonPlugin';

export default defineConfig(({ mode }) => {
	const isDev = mode === 'development';
	const isProd = mode === 'production';

	return {
		plugins: [
			mdsvex(mdsvexConfig),
			sveltekit(),
			geoJsonPlugin()
		],

		// Development server optimizations
		server: {
			fs: { strict: true },
			hmr: {
				port: 24678 // Use dedicated port for HMR
			},
			watch: {
				// Ignore heavy directories to reduce file watching overhead
				ignored: [
					'**/node_modules/**',
					'**/.git/**',
					'**/dist/**',
					'**/.svelte-kit/**',
					'**/coverage/**',
					'**/scripts/**' // Your scripts directory
				]
			}
		},

		preview: { port: 4173 },


		// Environment variable handling
		define: {
			__APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.1')
		},

		// Production optimizations for Vercel
		build: {
			assetsInlineLimit: 1000000000, // 100MB
			
		},

		// Conditional configuration based on environment
		...(isProd && {
			// Production-only optimizations
			esbuild: {
				// Remove console.log in production
				drop: ['console', 'debugger'],
				legalComments: 'none'
			}
		})
	};
});