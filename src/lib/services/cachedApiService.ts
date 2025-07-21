// src/lib/services/cachedApiService.ts
import { cacheManager, CacheKeys, CacheTTL } from '../stores/cacheStore';

// Generic API fetch wrapper with caching
async function cachedFetch<T>(
	url: string,
	cacheKey: string,
	ttl: number = CacheTTL.MEDIUM,
	options: RequestInit = {}
): Promise<T> {
	return cacheManager.getOrFetch(
		cacheKey,
		async () => {
			const response = await fetch(url, {
				...options,
				headers: {
					'Content-Type': 'application/json',
					...options.headers
				}
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			return response.json();
		},
		ttl
	);
}

// Stale-while-revalidate wrapper
async function cachedFetchSWR<T>(
	url: string,
	cacheKey: string,
	ttl: number = CacheTTL.MEDIUM,
	options: RequestInit = {}
): Promise<T> {
	return cacheManager.getWithStaleWhileRevalidate(
		cacheKey,
		async () => {
			const response = await fetch(url, {
				...options,
				headers: {
					'Content-Type': 'application/json',
					...options.headers
				}
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			return response.json();
		},
		ttl
	);
}

export class CachedApiService {
	// Get all locations with caching
	static async getLocations() {
		return cachedFetchSWR(
			'/api/locations',
			CacheKeys.LOCATIONS,
			CacheTTL.LONG
		);
	}

	// Get location tags with caching
	static async getLocationTags() {
		return cachedFetchSWR(
			'/api/location-tags',
			CacheKeys.LOCATION_TAGS,
			CacheTTL.LONG
		);
	}

	// Get tags with caching
	static async getTags() {
		return cachedFetchSWR(
			'/api/tags',
			CacheKeys.TAGS,
			CacheTTL.VERY_LONG
		);
	}

	// Get location detail with caching
	static async getLocationDetail(locationId: string) {
		return cachedFetch(
			`/api/locations/${locationId}`,
			CacheKeys.LOCATION_DETAIL(locationId),
			CacheTTL.MEDIUM
		);
	}

	// Get nearby locations with caching
	static async getNearbyLocations(locationId: string, radius: number = 10) {
		return cachedFetch(
			`/api/locations/${locationId}/nearby?radius=${radius}`,
			CacheKeys.NEARBY_LOCATIONS(locationId),
			CacheTTL.MEDIUM
		);
	}

	// Search locations with short-term caching
	static async searchLocations(query: string, filters: any = {}) {
		const searchParams = new URLSearchParams({
			q: query,
			...filters
		});

		return cachedFetch(
			`/api/search?${searchParams}`,
			CacheKeys.SEARCH_RESULTS(query + JSON.stringify(filters)),
			CacheTTL.SHORT
		);
	}

	// Invalidate specific cache entries
	static invalidateLocation(locationId: string) {
		cacheManager.delete(CacheKeys.LOCATION_DETAIL(locationId));
		cacheManager.delete(CacheKeys.NEARBY_LOCATIONS(locationId));
		// Also invalidate the main locations cache to ensure consistency
		cacheManager.delete(CacheKeys.LOCATIONS);
		cacheManager.delete(CacheKeys.LOCATION_TAGS);
	}

	// Invalidate all location-related cache
	static invalidateLocations() {
		cacheManager.delete(CacheKeys.LOCATIONS);
		cacheManager.delete(CacheKeys.LOCATION_TAGS);
		cacheManager.delete(CacheKeys.TAGS);
		
		// Clear all location detail and nearby caches
		const stats = cacheManager.getStats();
		// This is a simplified approach - in a real app you might want to track these keys
		Object.keys(localStorage).forEach(key => {
			if (key.includes('location_detail_') || key.includes('nearby_locations_')) {
				const cacheKey = key.replace('tta_cache_', '');
				cacheManager.delete(cacheKey);
			}
		});
	}

	// Preload critical data
	static async preloadCriticalData() {
		try {
			// Preload in parallel for better performance
			await Promise.all([
				this.getLocations(),
				this.getTags(),
				this.getLocationTags()
			]);
		} catch (error) {
			console.warn('Failed to preload critical data:', error);
		}
	}

	// Get cache statistics
	static getCacheStats() {
		return cacheManager.getStats();
	}

	// Manual cache cleanup
	static cleanupCache() {
		cacheManager.clearExpired();
	}
}

// Export for use in load functions and components
export { cacheManager, CacheKeys, CacheTTL };