// import { getServerSession } from '@supabase/auth-helpers-sveltekit';
import { redirect, type Actions } from '@sveltejs/kit';

export const load = async (event) => {
	const user = await event.locals.getUser();

	if (!user) {
		throw redirect(303, '/login');
	}

	const { data: profile, error: profileError } = await event.locals.supabase
		.from('user_profiles')
		.select('admin')
		.eq('id', user.id)
		.single();

	if (profileError || !profile || !profile.admin) {
		throw redirect(303, '/');
	}


	const { data: locationContent, error: locationContentError } = await event.locals.supabase
		.from(`content_locations`)
		.select(`*, location:locations(*)`);

	if (locationContentError) {
		console.log(locationContentError);
	}

	return {
		locations: locationContent
	};
};

export const actions: Actions = {
	updateStage: async ({ request, locals }) => {
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

			const { data: existingRecord, error: existingRecordError } = await locals.supabase
				.from(`content_${contentType}`)
				.select('*')
				.eq('loc', loc);

			if (existingRecordError) {
				console.log(existingRecordError);
			}

			if (existingRecord?.length) {
				const { data: record, error: recordError } = await locals.supabase
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
				const { data: record, error: recordError } = await locals.supabase
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
