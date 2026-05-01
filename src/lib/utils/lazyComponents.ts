// src/lib/utils/lazyComponents.ts
import { lazy } from '../../utils/lazy';

export const LazyMap = lazy(() => import('$lib/components/map/map.svelte'));

export function preloadCriticalComponents() {
	if (typeof window !== 'undefined') {
		setTimeout(() => {
			LazyMap.load();
		}, 2000);
	}
}
