import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { slug } = params;
	const { name, startDate, endDate, items } = await request.json();

	const { data, error } = await locals.supabase
		.from('itineraries')
		.update({ name, start_date: new Date(startDate), end_date: new Date(endDate) })
		.eq('id', slug)
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 400 });
	}

	const { error: removeItemsError } = await locals.supabase
		.from('itinerary_items')
		.delete()
		.eq('itinerary_id', slug);

	if (removeItemsError) {
		return json({ error: removeItemsError.message }, { status: 400 });
	}

	// Update itinerary items
	const itemUpdates = items.map((item, index) => ({
		id: item.id,
		itinerary_id: slug,
		location_id: item.location_id,
		notes: item.notes,
		start_time: item.start_time || null,
		end_time: item.end_time || null,
		order_index: index
	}));

	const { error: itemsError } = await locals.supabase
		.from('itinerary_items')
		.upsert(itemUpdates, { onConflict: 'id' });

	if (itemsError) {
		return json({ error: itemsError.message }, { status: 400 });
	}

	return json(data);
};
