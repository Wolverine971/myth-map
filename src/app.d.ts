// src/app.d.ts
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}

		interface MdsvexFile {
			default: import('svelte/internal').SvelteComponent;
			metadata: Record<string, string> | BlogPost;
		}

		type MdsvexResolver = () => Promise<MdsvexFile>;

		interface BlogPost {
			slug: string;
			title: string;
			author: string;
			description: string;
			date: string;
			loc: string;
			lastmod: string;
			changefreq: string;
			priority: string;
			published: boolean;
			type?: string[];
			person?: string;
			wikipedia?: string;
			twitter?: string;
			instagram?: string;
			tiktok?: string;
			blog?: boolean;
			jsonld: string;
			pic?: string;
		}
	}
}

export {};
