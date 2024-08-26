// /src/api/comments/[id]/like/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	const user = await locals.getUser();
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { data, error } = await locals.supabase
		.from('comment_likes')
		.insert({ user_id: user.id, comment_id: params.id })
		.single();

	if (error && error.code === '23505') {
		// Unique constraint violation
		return json({ message: 'Already liked' }, { status: 409 });
	}

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json(data, { status: 201 });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = await locals.getUser();
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { error } = await locals.supabase
		.from('comment_likes')
		.delete()
		.match({ user_id: user.id, comment_id: params.id });

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ message: 'Like removed' });
};
