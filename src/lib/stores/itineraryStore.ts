// src/lib/stores/itineraryStore.ts

import { writable, get } from 'svelte/store';
import type { Itinerary, Location, ItineraryItem } from '$lib/types/itinerary';
import { supabase } from '$lib/supabaseClient';

function createItineraryStore() {
	const { subscribe, set, update } = writable<Itinerary | null>(null);

	function formatTime(time: string | null): string | null {
		if (!time) return null;
		// Ensure the time is in HH:MM format
		const [hours, minutes] = time.split(':');
		return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
	}

	return {
		subscribe,
		setItinerary: (itinerary: Itinerary) => set(itinerary),
		addItem: async ({
			location,
			itineraryId,
			name,
			startTime,
			endTime,
			userId
		}: {
			location: Location;
			itineraryId?: string;
			name?: string;
			startTime?: string;
			endTime?: string;
			userId?: string;
		}) => {
			let currentItineraryId = itineraryId;

			if (!currentItineraryId) {
				const today = new Date().toISOString().split('T')[0];
				const { data: newItinerary, error: createError } = await supabase
					.from('itineraries')
					.insert({
						name: `${name} Itinerary`,
						start_date: today,
						end_date: today,
						user_id: userId,
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
					order_index: await getNextOrderIndex(currentItineraryId),
					start_time: formatTime(startTime),
					end_time: formatTime(endTime)
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
		updateItemTime: async (itemId: string, startTime: string, endTime?: string) => {
			const { data, error } = await supabase
				.from('itinerary_items')
				.update({ start_time: formatTime(startTime), end_time: formatTime(endTime) })
				.match({ id: itemId })
				.select()
				.single();

			if (error) throw error;

			update((itinerary) => {
				if (!itinerary) return null;
				return {
					...itinerary,
					items: itinerary.items.map((item) =>
						item.id === itemId ? { ...item, start_time: startTime, end_time: endTime } : item
					)
				};
			});

			return data;
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
		updateItinerary: async (updates: {
			id: string;
			name?: string;
			startDate?: string;
			endDate?: string;
			items?: ItineraryItem[];
			// user
		}) => {
			const { id, name, startDate, endDate, items } = updates;

			// Update itinerary details
			const { data: updatedItinerary, error: itineraryError } = await supabase
				.from('itineraries')
				.update({
					name: name,
					start_date: startDate ? new Date(startDate) : undefined,
					end_date: endDate ? new Date(endDate) : undefined
				})
				.eq('id', id)
				.select()
				.single();

			if (itineraryError) {
				console.error('Error updating itinerary:', itineraryError);
				throw itineraryError;
			}

			// Update item order if items are provided
			if (items) {
				const itemUpdates = items.map((item, index) => ({
					id: item.id,
					order_index: index,
					start_time: formatTime(item.start_time),
					end_time: formatTime(item.end_time)
				}));

				const { error: removeItemsError } = await supabase
					.from('itinerary_items')
					.delete()
					.eq('itinerary_id', id);

				if (removeItemsError) {
					console.error('Error removing itinerary items:', removeItemsError);
					throw removeItemsError;
				}


				const { error: itemsError } = await supabase
					.from('itinerary_items')
					.upsert(itemUpdates, { onConflict: 'id' });

				if (itemsError) {
					console.error('Error updating itinerary items:', itemsError);
					throw itemsError;
				}
			}

			// Update the store
			update((itinerary) => {
				if (!itinerary) return null;
				return {
					...itinerary,
					...updatedItinerary,
					items: items || itinerary.items
				};
			});

			return updatedItinerary;
		},
		update: (updater: (itinerary: Itinerary) => Itinerary) => {
			update((currentItinerary) => {
				if (currentItinerary === null) return null;
				return updater(currentItinerary);
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
