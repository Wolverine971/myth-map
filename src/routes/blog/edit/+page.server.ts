import type { PageLoad } from './$types';
import { error, type Actions } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, locals }) => {
	const { data: existingLocationData, error: existingLocationDataError } = await locals.supabase
		.from('content_locations')
		.select('*');

	if (existingLocationDataError) {
		console.log('existingLocationDataError', existingLocationDataError);
	}

	return {
		locationBlogs: existingLocationData
	};
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		try {
			const body = Object.fromEntries(await request.formData());

			const loc = body.loc as string;
			const markdown = body.markdown as string;
			const description = body.description as string;

			const { data: locationData, error: locationDataError } = await locals.supabase
				.from('content_locations')
				.select('*')
				.eq('loc', loc)
				.single();

			if (locationDataError) {
				console.log('locationDataError', locationDataError);
			}

			if (locationData) {
				const { data: updatedLocationData, error: updatedLocationDataError } = await locals.supabase
					.from('content_locations')
					.update({
						content: markdown,
						description: description
					})
					.eq('loc', loc)
					.single();
				if (updatedLocationDataError) {
					console.log('updatedLocationDataError', updatedLocationDataError);
				}
			}
			return { success: true };
		} catch (e) {
			throw error(404, {
				message: `Failed to ingest, ${JSON.stringify(e)}`
			});
		}
	}
};
