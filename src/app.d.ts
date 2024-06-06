// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}

		interface Supabase {
			Database: import('./src/schema').Database;
			SchemaName: 'public';
		}

		// interface Locals {}
		interface PageData {
			session: import('@supabase/supabase-js').Session | null;
		}
		// interface Error {}
		// interface Platform {}

		interface MdsvexFile {
			default: import('svelte/internal').SvelteComponent;
			metadata: Record<string, string>;
		}

		type MdsvexResolver = () => Promise<MdsvexFile>;
	}
}

export { };
