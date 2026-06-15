// src/lib/server/radar/cache.ts
type CacheItem<T> = {
	value: T;
	expiresAt: number;
};

const memoryCache = new Map<string, CacheItem<unknown>>();

export const RadarCacheTTL = {
	result: 2 * 60 * 1000,
	isochrone: 24 * 60 * 60 * 1000,
	osm: 24 * 60 * 60 * 1000,
	wikipedia: 24 * 60 * 60 * 1000,
	wikidata: 24 * 60 * 60 * 1000,
	ticketmaster: 15 * 60 * 1000,
	opensky: 30 * 1000,
	nwsForecast: 10 * 60 * 1000
} as const;

export function getRadarCache<T>(key: string): T | null {
	const item = memoryCache.get(key);
	if (!item) return null;
	if (Date.now() >= item.expiresAt) {
		memoryCache.delete(key);
		return null;
	}
	return item.value as T;
}

export function setRadarCache<T>(key: string, value: T, ttlMs: number): void {
	memoryCache.set(key, {
		value,
		expiresAt: Date.now() + ttlMs
	});
}
