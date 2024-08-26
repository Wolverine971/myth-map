import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	try {
		const user = event.locals.getUser();
		const { data: stateData, error } = await event.locals.supabase.rpc(
			'get_location_count_by_state'
		);
		if (error) console.error(error);

		return {
			stateData,
			user
		};
	} catch (error) {
		console.error('error', error);
	}
};
