import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const { slug } = params;
	const { name, startDate, endDate, items } = await request.json();

	const { data, error } = await supabase
		.from('itineraries')
		.update({ name, start_date: startDate, end_date: endDate })
		.eq('id', slug)
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 400 });
	}

	// Update itinerary items
	const itemUpdates = items.map((item, index) => ({
		id: item.id,
		order_index: index
	}));

	const { error: itemsError } = await supabase
		.from('itinerary_items')
		.upsert(itemUpdates, { onConflict: 'id' });

	if (itemsError) {
		return json({ error: itemsError.message }, { status: 400 });
	}

	return json(data);
};
