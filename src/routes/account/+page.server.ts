// src/routes/account/+page.server.ts

import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = await locals.getUser();
	if (!user) {
		throw redirect(302, '/login');
	}

	const { data: profile, error: profileError } = await locals.supabase
		.from('user_profiles')
		.select('*')
		.eq('id', user.id)
		.single();

	if (profileError && profileError.code !== 'PGRST116') {
		// PGRST116 is the error code for no rows returned
		console.error('Error fetching user profile:', profileError);
		throw error(500, 'Error fetching user profile');
	}

	return {
		user: {
			...user,
			...profile
		}
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		const user = await locals.getUser();
		if (!user) {
			throw error(401, 'Unauthorized');
		}

		const formData = await request.formData();
		const username = formData.get('username') as string;
		const firstName = formData.get('firstName') as string;
		const lastName = formData.get('lastName') as string;

		const { data, error: upsertError } = await locals.supabase
			.from('user_profiles')
			.upsert(
				{
					id: user.id,
					username,
					first_name: firstName,
					last_name: lastName
				},
				{
					onConflict: 'id'
				}
			)
			.select()
			.single();

		if (upsertError) {
			console.error('Error upserting user profile:', upsertError);
			return fail(500, { message: 'Error updating user profile' });
		}

		return { success: true, profile: data };
	},

	logout: async ({ locals }) => {
		const { error: logoutError } = await locals.supabase.auth.signOut();
		if (logoutError) {
			console.error('Logout error:', logoutError);
			return fail(500, { message: 'Error during logout' });
		}
		console.log('Logged out');
		return { success: true };
	}
};
