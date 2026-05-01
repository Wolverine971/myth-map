// src/lib/services/filterService.ts
import { memoizeLocationFilter } from '$lib/utils/memoize';
import { searchCacheManager } from '$lib/stores/dataManager';

export interface FilterState {
	selectedTags: string[];
	selectedState: { name: string; abr: string } | null;
	selectedCity: string | null;
	searchQuery: string;
}

/**
 * Virtual category tags → set of concrete tag names found in the data.
 * The four "base" filters (Activity / Eats / Indoor / Outdoor) don't exist as
 * literal tags on any location, so when the user picks one, expand it to its
 * underlying tag bucket and match if the location has any of those.
 */
export const TAG_BUCKETS: Record<string, Set<string>> = {
	Eats: new Set(['Treat', 'Food', 'Drink']),
	Outdoor: new Set([
		'Park',
		'Playground',
		'Hiking',
		'Water',
		'Beach',
		'Farm',
		'Biking',
		'Swimming'
	]),
	Indoor: new Set(['Educational', 'Interactive', 'Creativity', 'Animals', 'Trains']),
	Activity: new Set(['Physical Activity', 'Play', 'Wellness'])
};

function tagMatches(tag: string, locationTags: Set<string>): boolean {
	const bucket = TAG_BUCKETS[tag];
	if (!bucket) return locationTags.has(tag);
	for (const t of bucket) if (locationTags.has(t)) return true;
	return false;
}

export interface LocationData {
	location: {
		id?: number | string;
		name: string;
		city: string;
		state: string;
		address_line_1?: string;
		address_line_2?: string;
		zip_code?: string;
		lat: number | null;
		lng: number | null;
		[key: string]: any;
	};
	website?: string;
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
			const cachedResults = searchCacheManager.getCachedSearchResults(searchQuery, {
				selectedTags,
				selectedState,
				selectedCity
			});
			if (cachedResults) {
				return cachedResults;
			}
		}

		let filtered = [...locations];

		// Apply geographic filters first (most restrictive)
		if (selectedState) {
			filtered = filtered.filter((loc) => loc.location.state === selectedState.abr);
		}

		if (selectedCity) {
			filtered = filtered.filter(
				(loc) => loc.location.city.toLowerCase() === selectedCity.toLowerCase()
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
		locationTags.forEach((lt) => {
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

			return (
				name.includes(query) ||
				city.includes(query) ||
				state.includes(query) ||
				address.includes(query) ||
				tags.some((tag) => tag.includes(query))
			);
		});
	}

	/**
	 * Filter locations by tags. Selected tags can be either literal tag names
	 * or virtual category tags (Activity / Eats / Indoor / Outdoor) — virtual
	 * tags expand to their underlying bucket via TAG_BUCKETS.
	 */
	private filterByTags(
		locations: LocationData[],
		selectedTags: string[],
		locationTags: LocationTag[]
	): LocationData[] {
		const locationTagMap = new Map<string, Set<string>>();
		locationTags.forEach((lt) => {
			if (!locationTagMap.has(lt.location.name)) {
				locationTagMap.set(lt.location.name, new Set());
			}
			locationTagMap.get(lt.location.name)!.add(lt.tags.name);
		});

		return locations.filter((contentLocation) => {
			const tags = locationTagMap.get(contentLocation.location.name);
			if (!tags) return false;
			return selectedTags.every((tag) => tagMatches(tag, tags));
		});
	}

	/**
	 * Get available tags for current geographic scope. Real tag names get a
	 * count of (location, tag) link occurrences. The four virtual categories
	 * get a count of unique locations whose tag set intersects their bucket.
	 */
	getAvailableTags(
		locations: LocationData[],
		locationTags: LocationTag[],
		selectedState: { name: string; abr: string } | null,
		selectedCity: string | null
	): Record<string, number> {
		let locationsInScope = [...locations];

		if (selectedState) {
			locationsInScope = locationsInScope.filter((loc) => loc.location.state === selectedState.abr);
		}

		if (selectedCity) {
			locationsInScope = locationsInScope.filter(
				(loc) => loc.location.city.toLowerCase() === selectedCity.toLowerCase()
			);
		}

		const locationNamesInScope = new Set(locationsInScope.map((l) => l.location.name));

		// Concrete tag counts.
		const availableTagsMap: Record<string, number> = {};
		// Index of (location → set of tags) so we can compute bucket membership.
		const locationToTags = new Map<string, Set<string>>();

		locationTags.forEach((lt) => {
			if (!locationNamesInScope.has(lt.location.name)) return;
			const tagName = lt.tags.name;
			availableTagsMap[tagName] = (availableTagsMap[tagName] || 0) + 1;

			let set = locationToTags.get(lt.location.name);
			if (!set) {
				set = new Set();
				locationToTags.set(lt.location.name, set);
			}
			set.add(tagName);
		});

		// Virtual category counts: number of unique in-scope locations whose
		// tag set intersects the bucket.
		for (const [bucketName, bucket] of Object.entries(TAG_BUCKETS)) {
			let count = 0;
			for (const tagSet of locationToTags.values()) {
				for (const t of bucket) {
					if (tagSet.has(t)) {
						count++;
						break;
					}
				}
			}
			availableTagsMap[bucketName] = count;
		}

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
