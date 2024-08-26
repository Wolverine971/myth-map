// /src/api/comments/[id]/flag/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
    const user = await locals.getUser();
    if (!user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reason, explanation } = await request.json();

    const { data, error } = await locals.supabase
        .from('comment_flags')
        .insert({ user_id: user.id, comment_id: params.id, reason, explanation })
        .single();

    if (error) {
        return json({ error: error.message }, { status: 500 });
    }

    return json(data, { status: 201 });
};