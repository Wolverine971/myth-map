// src/lib/utils/memoize.ts

export interface MemoizeOptions {
	maxSize?: number;
	ttl?: number; // Time to live in milliseconds
}

interface CacheEntry<T> {
	value: T;
	timestamp: number;
}

/**
 * Creates a memoized version of a function with optional TTL and size limit
 */
export function memoize<TArgs extends any[], TResult>(
	fn: (...args: TArgs) => TResult,
	options: MemoizeOptions = {}
): (...args: TArgs) => TResult {
	const { maxSize = 100, ttl = 0 } = options;
	const cache = new Map<string, CacheEntry<TResult>>();

	return (...args: TArgs): TResult => {
		const key = JSON.stringify(args);
		const now = Date.now();
		const cached = cache.get(key);

		// Check if we have a valid cached value
		if (cached) {
			if (ttl === 0 || now - cached.timestamp < ttl) {
				return cached.value;
			}
			// Remove expired entry
			cache.delete(key);
		}

		// Calculate new value
		const value = fn(...args);
		
		// Store in cache
		cache.set(key, { value, timestamp: now });

		// Enforce size limit
		if (cache.size > maxSize) {
			const firstKey = cache.keys().next().value;
			cache.delete(firstKey);
		}

		return value;
	};
}

/**
 * Creates a memoized derived store for Svelte
 */
export function createMemoizedDerived<T>(
	compute: () => T,
	dependencies: any[],
	options: MemoizeOptions = {}
): T {
	const memoizedCompute = memoize(compute, options);
	return memoizedCompute();
}

/**
 * Specialized memoization for location filtering
 */
export function memoizeLocationFilter(
	filterFn: (locations: any[], filters: any) => any[],
	options: MemoizeOptions = { maxSize: 50, ttl: 5 * 60 * 1000 } // 5 minutes default
) {
	const cache = new Map<string, CacheEntry<any[]>>();

	return (locations: any[], filters: any): any[] => {
		// Create a stable key from locations length and filters
		const key = `${locations.length}_${JSON.stringify(filters)}`;
		const now = Date.now();
		const cached = cache.get(key);

		if (cached && (options.ttl === 0 || now - cached.timestamp < options.ttl)) {
			return cached.value;
		}

		const result = filterFn(locations, filters);
		cache.set(key, { value: result, timestamp: now });

		// Clean up old entries
		if (cache.size > (options.maxSize || 50)) {
			const entries = Array.from(cache.entries());
			entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
			cache.delete(entries[0][0]);
		}

		return result;
	};
}