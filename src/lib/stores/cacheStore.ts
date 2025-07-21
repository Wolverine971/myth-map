// src/lib/stores/cacheStore.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface CacheItem<T> {
	data: T;
	timestamp: number;
	ttl: number; // Time to live in milliseconds
}

interface CacheStore {
	[key: string]: CacheItem<any>;
}

const CACHE_KEY_PREFIX = 'tta_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

class CacheManager {
	private store = writable<CacheStore>({});
	private memoryCache: CacheStore = {};

	constructor() {
		if (browser) {
			this.loadFromLocalStorage();
		}
	}

	private loadFromLocalStorage() {
		try {
			const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_KEY_PREFIX));
			const cache: CacheStore = {};
			
			keys.forEach(key => {
				const item = localStorage.getItem(key);
				if (item) {
					const cacheKey = key.replace(CACHE_KEY_PREFIX, '');
					const parsed = JSON.parse(item);
					
					// Check if item is still valid
					if (this.isValid(parsed)) {
						cache[cacheKey] = parsed;
						this.memoryCache[cacheKey] = parsed;
					} else {
						localStorage.removeItem(key);
					}
				}
			});
			
			this.store.set(cache);
		} catch (error) {
			console.warn('Failed to load cache from localStorage:', error);
		}
	}

	private saveToLocalStorage(key: string, item: CacheItem<any>) {
		if (!browser) return;
		
		try {
			localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(item));
		} catch (error) {
			console.warn('Failed to save to localStorage:', error);
			// If localStorage is full, clear old cache entries
			this.clearExpired();
		}
	}

	private isValid<T>(item: CacheItem<T>): boolean {
		return Date.now() - item.timestamp < item.ttl;
	}

	set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
		const item: CacheItem<T> = {
			data,
			timestamp: Date.now(),
			ttl
		};

		this.memoryCache[key] = item;
		this.saveToLocalStorage(key, item);
		
		this.store.update(cache => ({
			...cache,
			[key]: item
		}));
	}

	get<T>(key: string): T | null {
		const item = this.memoryCache[key];
		
		if (!item) {
			return null;
		}

		if (!this.isValid(item)) {
			this.delete(key);
			return null;
		}

		return item.data;
	}

	async getOrFetch<T>(
		key: string,
		fetchFn: () => Promise<T>,
		ttl: number = DEFAULT_TTL
	): Promise<T> {
		const cached = this.get<T>(key);
		
		if (cached !== null) {
			return cached;
		}

		const data = await fetchFn();
		this.set(key, data, ttl);
		return data;
	}

	async getWithStaleWhileRevalidate<T>(
		key: string,
		fetchFn: () => Promise<T>,
		ttl: number = DEFAULT_TTL,
		staleTime: number = ttl * 0.5 // 50% of TTL
	): Promise<T> {
		const item = this.memoryCache[key];
		
		if (!item) {
			// No cached data, fetch fresh
			const data = await fetchFn();
			this.set(key, data, ttl);
			return data;
		}

		const age = Date.now() - item.timestamp;
		
		if (age < staleTime) {
			// Fresh data, return immediately
			return item.data;
		}

		if (age < ttl) {
			// Stale but valid, return stale data and revalidate in background
			fetchFn().then(newData => {
				this.set(key, newData, ttl);
			}).catch(error => {
				console.warn('Background revalidation failed:', error);
			});
			
			return item.data;
		}

		// Expired, fetch fresh data
		try {
			const data = await fetchFn();
			this.set(key, data, ttl);
			return data;
		} catch (error) {
			// If fetch fails but we have stale data, return it
			if (item) {
				console.warn('Fetch failed, returning stale data:', error);
				return item.data;
			}
			throw error;
		}
	}

	delete(key: string): void {
		delete this.memoryCache[key];
		
		if (browser) {
			localStorage.removeItem(CACHE_KEY_PREFIX + key);
		}
		
		this.store.update(cache => {
			const { [key]: removed, ...rest } = cache;
			return rest;
		});
	}

	clear(): void {
		this.memoryCache = {};
		
		if (browser) {
			const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_KEY_PREFIX));
			keys.forEach(key => localStorage.removeItem(key));
		}
		
		this.store.set({});
	}

	clearExpired(): void {
		const now = Date.now();
		const toDelete: string[] = [];
		
		Object.entries(this.memoryCache).forEach(([key, item]) => {
			if (!this.isValid(item)) {
				toDelete.push(key);
			}
		});
		
		toDelete.forEach(key => this.delete(key));
	}

	// Get cache statistics
	getStats() {
		const items = Object.values(this.memoryCache);
		const now = Date.now();
		
		return {
			totalItems: items.length,
			validItems: items.filter(item => this.isValid(item)).length,
			expiredItems: items.filter(item => !this.isValid(item)).length,
			averageAge: items.length > 0 
				? items.reduce((sum, item) => sum + (now - item.timestamp), 0) / items.length 
				: 0,
			memoryUsage: JSON.stringify(this.memoryCache).length
		};
	}

	// Subscribe to cache updates
	subscribe = this.store.subscribe;
}

// Create singleton instance
export const cacheManager = new CacheManager();

// Cache key generators
export const CacheKeys = {
	LOCATIONS: 'locations',
	LOCATION_TAGS: 'location_tags',
	TAGS: 'tags',
	LOCATION_DETAIL: (id: string) => `location_detail_${id}`,
	NEARBY_LOCATIONS: (id: string) => `nearby_locations_${id}`,
	USER_PREFERENCES: 'user_preferences',
	SEARCH_RESULTS: (query: string) => `search_${btoa(query).slice(0, 20)}`,
} as const;

// Cache TTL constants
export const CacheTTL = {
	SHORT: 2 * 60 * 1000,      // 2 minutes
	MEDIUM: 5 * 60 * 1000,     // 5 minutes  
	LONG: 15 * 60 * 1000,      // 15 minutes
	VERY_LONG: 60 * 60 * 1000, // 1 hour
	USER_PREFS: 24 * 60 * 60 * 1000, // 24 hours
} as const;