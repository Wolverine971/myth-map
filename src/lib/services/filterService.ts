// src/lib/services/filterService.ts
import { memoizeLocationFilter } from '$lib/utils/memoize';
import { searchCacheManager } from '$lib/stores/dataManager';

export interface FilterState {
	selectedTags: string[];
	selectedState: { name: string; abr: string } | null;
	selectedCity: string | null;
	searchQuery: string;
}

export interface LocationData {
	location: {
		name: string;
		city: string;
		state: string;
		address_line_1?: string;
		lat: number;
		lng: number;
	};
	[key: string]: any;
}

export interface LocationTag {
	location: { name: string };
	tags: { name: string };
}

class FilterService {
	private filterLocationsMemoized = memoizeLocationFilter(this.filterLocations.bind(this));

	/**
	 * Filter locations based on all criteria
	 */
	filterLocations(
		locations: LocationData[],
		filters: {
			state: FilterState;
			locationTags: LocationTag[];
		}
	): LocationData[] {
		const { selectedTags, selectedState, selectedCity, searchQuery } = filters.state;
		
		// Check search cache first
		if (searchQuery.trim()) {
			const cachedResults = searchCacheManager.getCachedSearchResults(
				searchQuery,
				{ selectedTags, selectedState, selectedCity }
			);
			if (cachedResults) {
				return cachedResults;
			}
		}

		let filtered = [...locations];

		// Apply geographic filters first (most restrictive)
		if (selectedState) {
			filtered = filtered.filter(loc => 
				loc.location.state === selectedState.abr
			);
		}

		if (selectedCity) {
			filtered = filtered.filter(loc => 
				loc.location.city.toLowerCase() === selectedCity.toLowerCase()
			);
		}

		// Apply search query filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			filtered = this.searchLocations(filtered, query, filters.locationTags);
			
			// Cache search results
			searchCacheManager.setCachedSearchResults(
				searchQuery,
				{ selectedTags, selectedState, selectedCity },
				filtered
			);
		}

		// Apply tag filters last
		if (selectedTags.length > 0) {
			filtered = this.filterByTags(filtered, selectedTags, filters.locationTags);
		}

		return filtered;
	}

	/**
	 * Search locations by query
	 */
	private searchLocations(
		locations: LocationData[],
		query: string,
		locationTags: LocationTag[]
	): LocationData[] {
		// Create a map of location names to tags for faster lookup
		const locationTagMap = new Map<string, string[]>();
		locationTags.forEach(lt => {
			if (!locationTagMap.has(lt.location.name)) {
				locationTagMap.set(lt.location.name, []);
			}
			locationTagMap.get(lt.location.name)!.push(lt.tags.name.toLowerCase());
		});

		return locations.filter((contentLocation) => {
			const name = contentLocation.location.name.toLowerCase();
			const city = contentLocation.location.city.toLowerCase();
			const state = contentLocation.location.state.toLowerCase();
			const address = (contentLocation.location.address_line_1 || '').toLowerCase();
			const tags = locationTagMap.get(contentLocation.location.name) || [];
			
			return name.includes(query) ||
				   city.includes(query) ||
				   state.includes(query) ||
				   address.includes(query) ||
				   tags.some(tag => tag.includes(query));
		});
	}

	/**
	 * Filter locations by tags
	 */
	private filterByTags(
		locations: LocationData[],
		selectedTags: string[],
		locationTags: LocationTag[]
	): LocationData[] {
		// Create a map for faster tag lookups
		const locationTagMap = new Map<string, Set<string>>();
		locationTags.forEach(lt => {
			if (!locationTagMap.has(lt.location.name)) {
				locationTagMap.set(lt.location.name, new Set());
			}
			locationTagMap.get(lt.location.name)!.add(lt.tags.name);
		});

		return locations.filter((contentLocation) => {
			const tags = locationTagMap.get(contentLocation.location.name);
			if (!tags) return false;
			
			// Check if location has ALL selected tags
			return selectedTags.every(tag => tags.has(tag));
		});
	}

	/**
	 * Get available tags for current geographic scope
	 */
	getAvailableTags(
		locations: LocationData[],
		locationTags: LocationTag[],
		selectedState: { name: string; abr: string } | null,
		selectedCity: string | null
	): Record<string, number> {
		let locationsInScope = [...locations];

		// Filter by geographic selections
		if (selectedState) {
			locationsInScope = locationsInScope.filter(loc => 
				loc.location.state === selectedState.abr
			);
		}

		if (selectedCity) {
			locationsInScope = locationsInScope.filter(loc => 
				loc.location.city.toLowerCase() === selectedCity.toLowerCase()
			);
		}

		// Get location names in scope
		const locationNamesInScope = new Set(
			locationsInScope.map(l => l.location.name)
		);

		// Count available tags
		const availableTagsMap: Record<string, number> = {};
		locationTags.forEach((locationTag) => {
			if (locationNamesInScope.has(locationTag.location.name)) {
				const tagName = locationTag.tags.name;
				availableTagsMap[tagName] = (availableTagsMap[tagName] || 0) + 1;
			}
		});

		return availableTagsMap;
	}

	/**
	 * Use memoized version for better performance
	 */
	getFilteredLocations(
		locations: LocationData[],
		filters: FilterState,
		locationTags: LocationTag[]
	): LocationData[] {
		return this.filterLocationsMemoized(locations, { state: filters, locationTags });
	}
}

// Export singleton instance
export const filterService = new FilterService();