// src/routes/api/comments/[id]/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const user = await locals.getUser();
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { content } = await request.json();

	const { data, error } = await locals.supabase
		.from('comments')
		.update({ content, is_edited: true })
		.match({ id: params.id, user_id: user.id })
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json(data);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = await locals.getUser();
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { error } = await locals.supabase
		.from('comments')
		.delete()
		.match({ id: params.id, user_id: user.id });

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ message: 'Comment deleted' });
};
