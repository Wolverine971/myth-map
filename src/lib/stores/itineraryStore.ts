// src/lib/stores/itineraryStore.ts

import { writable, get } from 'svelte/store';
import type { Itinerary, Location, ItineraryItem } from '$lib/types/itinerary';
import { supabase } from '$lib/supabaseClient';

function createItineraryStore() {
	const { subscribe, set, update } = writable<Itinerary | null>(null);

	return {
		subscribe,
		setItinerary: (itinerary: Itinerary) => set(itinerary),
		addItem: async ({ location, itineraryId, name }: { location: Location, itineraryId?: string, name?: string }) => {
			let currentItineraryId = itineraryId;

			// If no itineraryId is provided, create a new itinerary
			if (!currentItineraryId) {
				const { data: newItinerary, error: createError } = await supabase
					.from('itineraries')
					.insert({
						name: `${name} Itinerary`,
						start_date: new Date().toISOString().split('T')[0],
						end_date: new Date().toISOString().split('T')[0],
						user_id: (await supabase.auth.getUser()).data.user?.id,
						tracking_link: `https://tinytribeadventures.com/itineraries/${crypto.randomUUID()}`
					})
					.select();

				if (createError) throw createError;
				currentItineraryId = newItinerary[0].id;
				set(newItinerary[0]);
			}

			const { data: newItem, error: insertError } = await supabase
				.from('itinerary_items')
				.insert({
					itinerary_id: currentItineraryId,
					location_id: location.id,
					order_index: await getNextOrderIndex(currentItineraryId)
				})
				.select(
					`
                    *,
                    location:locations(*)
                `
				)
				.single();

			if (insertError) throw insertError;

			update((itinerary) => {
				if (!itinerary) return null;
				return {
					...itinerary,
					items: [...(itinerary.items || []), newItem]
				};
			});

			return newItem;
		},
		removeLocation: async (locationId: string) => {
			const { error } = await supabase
				.from('itinerary_items')
				.delete()
				.match({ location_id: locationId });

			if (error) throw error;
			update((itinerary) => {
				if (!itinerary) return null;
				return {
					...itinerary,
					items: itinerary.items.filter((item) => item.location_id !== locationId)
				};
			});
		},
		updateOrder: async (newOrder: Location[]) => {
			const currentItineraryId = get({ subscribe })?.id;
			const updates = newOrder.map((location, index) => ({
				itinerary_id: currentItineraryId,
				location_id: location.id,
				order_index: index
			}));

			for await (const update of updates) {
				const { error } = await supabase
					.from('itinerary_items')
					.update({ order_index: update.order_index })
					.eq('itinerary_id', update.itinerary_id)
					.eq('location_id', update.location_id);

				if (error) throw error;
			}

			update((itinerary) => {
				if (!itinerary) return null;
				return {
					...itinerary,
					items: newOrder.map((location, index) => ({
						...itinerary.items.find((item) => item.location_id === location.id),
						order_index: index
					}))
				};
			});
		},

		updateName: async (newName: string) => {
			const currentItineraryId = get({ subscribe })?.id;

			if (!currentItineraryId) {
				throw new Error('No current itinerary');
			}

			const { data, error } = await supabase
				.from('itineraries')
				.update({ name: newName })
				.match({ id: currentItineraryId })
				.select()
				.single();

			if (error) throw error;

			update((itinerary) => {
				if (!itinerary) return null;
				return { ...itinerary, name: newName };
			});

			return data;
		},
		updateDateRange: async (itineraryId: string, startDate: string, endDate: string) => {
			const { data, error } = await supabase
				.from('itineraries')
				.update({ start_date: startDate, end_date: endDate })
				.match({ id: itineraryId })
				.select()
				.single();

			if (error) throw error;
			update((itinerary) => {
				if (!itinerary) return null;
				return {
					...itinerary,
					start_date: startDate,
					end_date: endDate
				};
			});
		}
	};
}

async function getNextOrderIndex(itineraryId: string): Promise<number> {
	const { data, error } = await supabase
		.from('itinerary_items')
		.select('order_index')
		.eq('itinerary_id', itineraryId)
		.order('order_index', { ascending: false })
		.limit(1)
		.select();

	if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found
	return (data?.[0]?.order_index ?? -1) + 1;
}

export const currentItinerary = createItineraryStore();
