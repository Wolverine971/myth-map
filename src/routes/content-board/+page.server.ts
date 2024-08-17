// import { getServerSession } from '@supabase/auth-helpers-sveltekit';
import { redirect, type Actions } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const load = async (event) => {
	// const session = await getServerSession(event);

	// if (!session?.user?.id) {
	// 	throw redirect(302, '/questions');
	// }

	const { data: locationContent, error: locationContentError } = await supabase
		.from(`content_locations`)
		.select('*');

	if (locationContentError) {
		console.log(locationContentError);
	}

	return {
		locations: locationContent
	};
};

export const actions: Actions = {
	updateStage: async ({ request }) => {
		try {
			const body = Object.fromEntries(await request.formData());

			const contentType = body.content_type as string;

			const title = body.title as string;
			const description = body.description as string;
			const author = body.author as string;
			const date = body.date;
			const loc = body.loc as string;
			const lastmod = body.lastmod;
			const published = body.published as string;
			const type = body.type as string;
			const stageName = body.stageName as string;

			const { data: existingRecord, error: existingRecordError } = await supabase
				.from(`content_${contentType}`)
				.select('*')
				.eq('loc', loc);

			if (existingRecordError) {
				console.log(existingRecordError);
			}

			if (existingRecord?.length) {
				const { data: record, error: recordError } = await supabase
					.from(`content_${contentType}`)
					.update({
						title,
						description,
						author,
						date: date !== 'null' ? date : new Date().toISOString(),
						loc,
						lastmod: lastmod !== 'null' ? lastmod : new Date().toISOString(),
						published,
						type,
						stageName
					})
					.eq('loc', loc)
					.select();
				if (recordError) {
					console.log(recordError);
				}

				return record;
			} else {
				const { data: record, error: recordError } = await supabase
					.from(`content_${contentType}`)
					.insert({
						title,
						description,
						author,
						date: date !== 'null' ? date : new Date().toISOString(),
						loc,
						lastmod: lastmod !== 'null' ? lastmod : new Date().toISOString(),
						published,
						type,
						stageName
					})
					.select();
				if (recordError) {
					console.log(recordError);
				}

				return record;
			}
		} catch (e) {
			throw error(400, {
				message: `error staging content ${JSON.stringify(e)}`
			});
		}
	}
};
