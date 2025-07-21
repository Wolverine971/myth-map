// src/lib/types/filters.ts

export interface StateInfo {
	name: string;
	abr: string;
}

export interface FilterState {
	selectedTags: string[];
	selectedState: StateInfo | null;
	selectedCity: string | null;
	searchQuery: string;
}

export interface LocationData {
	location: {
		id: number;
		name: string;
		city: string;
		state: string;
		address_line_1?: string;
		address_line_2?: string;
		zip_code?: string;
		lat: number;
		lng: number;
		[key: string]: any;
	};
	website?: string;
	[key: string]: any;
}

export interface Tag {
	id: number;
	name: string;
}

export interface LocationTag {
	location: {
		name: string;
		[key: string]: any;
	};
	tags: Tag;
}

export interface FilterChangeEvent {
	detail: string[] | { state: StateInfo | null; city: string | null };
}

export interface DisplayTag extends Tag {
	checked: boolean;
	disabled: boolean;
}

export interface CityLocationCount {
	city: string;
	count: number;
}

export interface AvailableTagsMap {
	[tagName: string]: number;
}