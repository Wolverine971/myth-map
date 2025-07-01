// svelte.config.js

import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
	extensions: ['.svelte', '.svx', '.md'],

	preprocess: [
		vitePreprocess({
			postcss: true
		}),
		mdsvex({
			extensions: ['.svx', '.md']
		})
	],

	kit: {
		// Use Vercel adapter with explicit runtime configuration
		adapter: adapter({
			runtime: 'nodejs20.x', // Explicitly specify Node 20 runtime
			regions: ['iad1'], // Optional: specify region (iad1 is US East)
			memory: 1024, // Optional: specify memory limit in MB
			maxDuration: 10, // Optional: max execution time in seconds
		}),

		alias: {
			$components: 'src/lib/components',
			$ui: 'src/lib/ui',
			$utils: 'src/lib/utils'
		},

		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				if (path.startsWith('/api/')) {
					return;
				}
				// Only fail builds in production
				if (process.env.VERCEL) {
					throw new Error(message);
				}
				console.warn(`Prerender error on ${path}: ${message}`);
			},
			entries: [
				'*',
				'/blog',
				'/locations'
			]
		},

		env: {
			publicPrefix: 'PUBLIC_'
		}
	}
};