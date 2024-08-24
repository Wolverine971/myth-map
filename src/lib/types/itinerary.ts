// src/lib/types/itinerary.ts

export interface Location {
	id: string;
	name: string;
	latitude: number;
	longitude: number;
	address?: string;
	description?: string;
}

export interface Itinerary {
	id: string;
	user_id: string;
	name: string;
	start_date: string;
	end_date: string;
	tracking_link: string;
}

export interface ItineraryItem {
	id: string;
	start_time: string;
	end_time: string | null;
	displayStartTime: string;
	displayEndTime: string | null;
	itinerary_id: string;
	location_id: string;
	order_index: number;
	notes?: string;
}
