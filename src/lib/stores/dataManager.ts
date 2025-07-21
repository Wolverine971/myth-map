// src/lib/stores/dataManager.ts
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { cacheManager, CacheKeys, CacheTTL } from './cacheStore';

export interface LocationData {
	locations: any[];
	locationTags: any[];
	tags: any[];
	lastUpdated: number;
}

class DataManager {
	private store = writable<LocationData | null>(null);
	private isLoading = writable(false);
	private error = writable<string | null>(null);

	constructor() {
		if (browser) {
			this.loadCachedData();
		}
	}

	private async loadCachedData() {
		try {
			const cachedLocations = cacheManager.get(CacheKeys.LOCATIONS);
			const cachedTags = cacheManager.get(CacheKeys.TAGS);
			const cachedLocationTags = cacheManager.get(CacheKeys.LOCATION_TAGS);

			if (cachedLocations && cachedTags && cachedLocationTags) {
				this.store.set({
					locations: cachedLocations,
					tags: cachedTags,
					locationTags: cachedLocationTags,
					lastUpdated: Date.now()
				});
			}
		} catch (error) {
			console.warn('Failed to load cached data:', error);
		}
	}

	// Cache data from server load
	cacheServerData(data: { locations: any[]; tags: any[]; locationTags: any[] }) {
		if (!browser) return;

		// Cache individual datasets with appropriate TTL
		cacheManager.set(CacheKeys.LOCATIONS, data.locations, CacheTTL.LONG);
		cacheManager.set(CacheKeys.TAGS, data.tags, CacheTTL.VERY_LONG);
		cacheManager.set(CacheKeys.LOCATION_TAGS, data.locationTags, CacheTTL.LONG);

		// Update store
		this.store.set({
			...data,
			lastUpdated: Date.now()
		});

		this.error.set(null);
	}

	// Check if cached data is still fresh
	isCachedDataFresh(maxAge: number = CacheTTL.MEDIUM): boolean {
		const locations = cacheManager.get(CacheKeys.LOCATIONS);
		const tags = cacheManager.get(CacheKeys.TAGS);
		const locationTags = cacheManager.get(CacheKeys.LOCATION_TAGS);

		return !!(locations && tags && locationTags);
	}

	// Get cached data if available
	getCachedData(): LocationData | null {
		if (!browser) return null;

		const locations = cacheManager.get(CacheKeys.LOCATIONS);
		const tags = cacheManager.get(CacheKeys.TAGS);
		const locationTags = cacheManager.get(CacheKeys.LOCATION_TAGS);

		if (locations && tags && locationTags) {
			return {
				locations,
				tags,
				locationTags,
				lastUpdated: Date.now()
			};
		}

		return null;
	}

	// Force refresh data
	async refreshData(): Promise<void> {
		if (!browser) return;

		this.isLoading.set(true);
		this.error.set(null);

		try {
			// Clear existing cache
			cacheManager.delete(CacheKeys.LOCATIONS);
			cacheManager.delete(CacheKeys.TAGS);
			cacheManager.delete(CacheKeys.LOCATION_TAGS);

			// Trigger a page reload to get fresh data
			// In a real app, you might want to make API calls here instead
			window.location.reload();
		} catch (error) {
			console.error('Failed to refresh data:', error);
			this.error.set('Failed to refresh data');
		} finally {
			this.isLoading.set(false);
		}
	}

	// Invalidate and refresh specific data
	invalidateLocations() {
		cacheManager.delete(CacheKeys.LOCATIONS);
		cacheManager.delete(CacheKeys.LOCATION_TAGS);
		
		// Clear related caches
		cacheManager.clearExpired();
	}

	// Get data freshness info
	getDataFreshness() {
		const locations = cacheManager.get(CacheKeys.LOCATIONS);
		const tags = cacheManager.get(CacheKeys.TAGS);
		const locationTags = cacheManager.get(CacheKeys.LOCATION_TAGS);

		if (!locations || !tags || !locationTags) {
			return { isFresh: false, age: null, nextRefresh: null };
		}

		// This is simplified - in the real cache we'd track timestamps
		const age = 0; // Would calculate from cache timestamps
		const nextRefresh = Date.now() + CacheTTL.LONG;

		return {
			isFresh: true,
			age,
			nextRefresh
		};
	}

	// Preload critical data in background
	async preloadCriticalData() {
		// This would be used for prefetching additional data
		// For now, we rely on the server load function
	}

	// Store subscriptions
	subscribe = this.store.subscribe;
	subscribeToLoading = this.isLoading.subscribe;
	subscribeToError = this.error.subscribe;

	// Derived stores for easy access
	get locations() {
		return derived(this.store, $store => $store?.locations || []);
	}

	get tags() {
		return derived(this.store, $store => $store?.tags || []);
	}

	get locationTags() {
		return derived(this.store, $store => $store?.locationTags || []);
	}

	get isDataAvailable() {
		return derived(this.store, $store => !!$store);
	}
}

// Create singleton instance
export const dataManager = new DataManager();

// City data cache
class CityDataCache {
	private cityCache = new Map<string, { data: string[]; timestamp: number }>();
	private readonly CITY_CACHE_TTL = CacheTTL.VERY_LONG; // Cities don't change often

	async getCityData(stateAbbr: string): Promise<string[]> {
		const key = stateAbbr.toLowerCase();
		const cached = this.cityCache.get(key);
		
		if (cached && Date.now() - cached.timestamp < this.CITY_CACHE_TTL) {
			return cached.data;
		}

		try {
			// Dynamically import city data
			const indexModule = await import(
				`../../geographies/cities/${key}/index.json`
			);
			
			const cities = indexModule.default.map((city: string) =>
				this.normalizeCityName(city)
			);
			
			// Cache the result
			this.cityCache.set(key, { data: cities, timestamp: Date.now() });
			
			// Also cache in localStorage for persistence
			if (browser) {
				cacheManager.set(`cities_${key}`, cities, this.CITY_CACHE_TTL);
			}
			
			return cities;
		} catch (error) {
			console.error(`Failed to load cities for state ${stateAbbr}:`, error);
			
			// Try to get from localStorage cache
			if (browser) {
				const cached = cacheManager.get(`cities_${key}`);
				if (cached) return cached;
			}
			
			return [];
		}
	}

	private normalizeCityName(city: string): string {
		// Simplified normalization - just proper case
		return city
			.split(/[\s-]+/)
			.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	}

	clearCache(): void {
		this.cityCache.clear();
	}

	preloadCitiesForState(stateAbbr: string): void {
		// Preload in background
		this.getCityData(stateAbbr).catch(console.error);
	}
}

export const cityDataCache = new CityDataCache();

// Cache for search results with debouncing
class SearchCacheManager {
	private searchCache = new Map<string, { data: any; timestamp: number }>();
	private readonly SEARCH_CACHE_TTL = CacheTTL.SHORT;

	getCachedSearchResults(query: string, filters: any = {}): any | null {
		const key = this.getSearchKey(query, filters);
		const cached = this.searchCache.get(key);
		
		if (cached && Date.now() - cached.timestamp < this.SEARCH_CACHE_TTL) {
			return cached.data;
		}

		this.searchCache.delete(key);
		return null;
	}

	setCachedSearchResults(query: string, filters: any = {}, data: any): void {
		const key = this.getSearchKey(query, filters);
		this.searchCache.set(key, { data, timestamp: Date.now() });
		
		// Clean up old entries if cache gets too large
		if (this.searchCache.size > 50) {
			const entries = Array.from(this.searchCache.entries());
			entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
			
			// Remove oldest 25% of entries
			const toRemove = Math.floor(entries.length * 0.25);
			for (let i = 0; i < toRemove; i++) {
				this.searchCache.delete(entries[i][0]);
			}
		}
	}

	private getSearchKey(query: string, filters: any): string {
		return `${query.toLowerCase().trim()}_${JSON.stringify(filters)}`;
	}

	clearSearchCache(): void {
		this.searchCache.clear();
	}
}

export const searchCacheManager = new SearchCacheManager();