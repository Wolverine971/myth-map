// import type { LayoutServerLoad } from './$types';
// import { getServerSession } from '@supabase/auth-helpers-sveltekit';

// export const load: LayoutServerLoad = async (event) => {
// 	const session = await getServerSession(event) // await getSession()
// 	return {
// 		session: session
// 	};
// };

// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const session = event.locals.session;
	return {
		session

	};
};