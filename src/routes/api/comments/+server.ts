// /src/api/comments/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const parentId = url.searchParams.get('parentId');
	const parentType = url.searchParams.get('parentType');
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 10;
	const offset = (page - 1) * limit;

	const { data, error, count } = await locals.supabase
		.from('comments')
		.select(
			`
            *,
            likes:comment_likes (user_id),
            _count:comment_likes (count)
        `,
			{ count: 'exact' }
		)
		.eq('parent_id', parentId)
		.eq('parent_type', parentType)
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	// Fetch user profiles for the comments
	const userIds = data?.map((comment) => comment.user_id) || [];
	const { data: userProfiles, error: userProfilesError } = await locals.supabase
		.from('user_profiles')
		.select('id, username, first_name, last_name')
		.in('id', userIds);

	if (userProfilesError) {
		return json({ error: userProfilesError.message }, { status: 500 });
	}

	// Create a map of user profiles for easy lookup
	const userProfileMap = new Map(userProfiles?.map((profile) => [profile.id, profile]));

	// Transform the data to include user info, like count, and whether the current user has liked the comment
	const user = await locals.getUser();
	const currentUserId = user?.id;

	const transformedData = data?.map((comment) => {
		const userProfile = userProfileMap.get(comment.user_id);
		return {
			...comment,
			author: userProfile
				? {
						username: userProfile.username,
						first_name: userProfile.first_name,
						last_name: userProfile.last_name
					}
				: null,
			likes_count: comment._count?.count || 0,
			user_has_liked: currentUserId
				? comment.likes.some((like) => like.user_id === currentUserId)
				: false
		};
	});

	return json({ comments: transformedData, total: count });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await locals.getUser();
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { parentId, parentType, content } = await request.json();

	const parentIdString = parentId.toString();

	const { data, error } = await locals.supabase
		.from('comments')
		.insert({ user_id: user.id, parent_id: parentIdString, parent_type: parentType, content })
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json(data, { status: 201 });
};
