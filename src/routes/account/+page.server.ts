// src/routes/account/+page.ts
import { redirect, type Actions } from '@sveltejs/kit';
import type { PageLoad } from './$types';

import { supabase } from '$lib/supabaseClient';
import { goto } from '$app/navigation';

export const load: PageLoad = async (event) => {
	const data = await event.parent();

	const session = await event.locals.getSession()
	if (!session?.user) {
		throw redirect(303, '/login');
	}

	// const { data: user, error } = await supabase
	// 	.from('users')
	// 	.select('name, email')
	// 	.eq('id', session.user.id)
	// 	.single();

	// if (error) {
	// 	console.error('Error fetching user data:', error);
	// 	// Handle error as appropriate for your application
	// }

	return { user: session?.user };
};


export const actions: Actions = {
	logout: async (event) => {
		const { error } = await event.locals.supabase.auth.signOut();
		if (error) {
			console.error('Error logging out:', error);
			// Handle error as appropriate for your application
		}

	}
}
