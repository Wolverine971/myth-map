import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { supabase } from '$lib/supabaseClient';

export const load: PageServerLoad = async ({ locals }) => {
    const user = await locals.getUser();

    if (!user) {
        throw redirect(303, '/login');
    }

    const { data: profile, error: profileError } = await locals.supabase
        .from('user_profiles')
        .select('admin')
        .eq('id', user.id)
        .single();

    if (profileError || !profile || !profile.admin) {
        throw redirect(303, '/');
    }

    const { data: users, error: usersError } = await locals.supabase.rpc('get_all_users');


    if (usersError) {
        throw error(500, 'Error fetching users');
    }

    return { users };
};

export const actions: Actions = {
    updateUser: async ({ request, locals }) => {
        const user = await locals.getUser();
        if (!user) {
            throw error(401, 'Unauthorized');
        }

        const formData = await request.formData();
        const userId = formData.get('id') as string;
        const username = formData.get('username') as string;
        const firstName = formData.get('first_name') as string;
        const lastName = formData.get('last_name') as string;
        const isAdmin = formData.get('admin') === 'on';

        const { data: existingUser, error: existingUserError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', userId);
        if (existingUserError) {
            return fail(500, { message: 'Error fetching user' });
        }

        if (!existingUser?.length) {
            const { error: updateError } = await supabase
                .from('user_profiles')
                .insert({
                    username,
                    first_name: firstName,
                    last_name: lastName,
                    admin: isAdmin,
                    id: userId
                })

            if (updateError) {
                return fail(500, { message: 'Error creating user profile' });
            }

        } else {
            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    username,
                    first_name: firstName,
                    last_name: lastName,
                    admin: isAdmin
                })
                .eq('id', userId);

            if (updateError) {
                return fail(500, { message: 'Error updating user' });
            }
        }

        return { success: true };
    }
};