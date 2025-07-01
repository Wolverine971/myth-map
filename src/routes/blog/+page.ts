// src/routes/blog/+page.ts
import type { PageServerLoad } from './$types';

// const MAX_POSTS = 20;

export const load: PageServerLoad = async (event) => {
	try {
		const { data: existingLocationData, error: existingLocationDataError } =
			await event.locals.supabase.from('content_locations').select('*');

		if (existingLocationDataError) {
			console.log('existingLocationDataError', existingLocationDataError);
		}

		return {
			blogs: existingLocationData
		};
	} catch (error) {
		console.error('error', error);
	}
};
