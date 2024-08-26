// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

import { Session, SupabaseClient, User } from '@supabase/supabase-js';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}

		interface Locals {
			supabase: SupabaseClient;
			getUser(): Promise<User | null>;
			safeGetSession(): Promise<{ session: Session | null; user: User | null }>
			session: Session | null;
			user: User | null;
		}
		// interface PageData {
		// 	session: Session | null;
		// }

		interface Supabase {
			Database: import('./src/schema').Database;
			SchemaName: 'public';
		}

		// interface Locals {}
		interface PageData {
			// session: import('@supabase/supabase-js').Session | null;
			session: Session | null;
			user: User | null;
		}
		// interface Error {}
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

export { };
