// src/lib/utils/lazyComponents.ts
import { lazy } from '../../utils/lazy';

export const LazyMap = lazy(() => import('$lib/components/map/map.svelte'));
