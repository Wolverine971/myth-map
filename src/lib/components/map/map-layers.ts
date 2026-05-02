// src/lib/components/map/map-layers.ts
import type { AnyLayer, ExpressionSpecification } from 'mapbox-gl';
import type { EffectiveTheme } from '$lib/stores/themeStore';

export const SHOWN_LOCATIONS_SOURCE_ID = 'shownLocations';

/**
 * Map layer styling — Tiny Tribe field-manual palette.
 *
 * Colors come from the brand palette (see docs/design-system.md §5):
 *   primary  Forest Green  #014421 + ramp
 *   tertiary Rustic Orange #CD5700 (the route marker)
 *   secondary Sandstone    #D2B48C (kraft)
 *
 * Layers are theme-aware via factory functions because Mapbox layer styles are
 * baked-in JSON paints — they can't reference CSS variables. We rebuild layers
 * when the base style swaps (see map.svelte::swapMapStyle).
 */

// ============================================================
// Clusters — density deepens the forest
// ============================================================
type ClusterPalette = {
	steps: ExpressionSpecification;
	stroke: string;
	textColor: string;
	textHalo: string;
};

const CLUSTER_PALETTE: Record<EffectiveTheme, ClusterPalette> = {
	// Light mode: clusters are deep forest, kraft text on top
	light: {
		steps: [
			'step',
			['get', 'point_count'],
			'#74AA85', //  1–4   primary-300
			5,
			'#579769', //  5–9   primary-400
			10,
			'#014421', // 10–24  primary-500 (Forest Green)
			25,
			'#013D1E', // 25–49  primary-600
			50,
			'#012E16' // 50+    primary-800
		],
		stroke: '#FCF9F5', // kraft (secondary-50) — pops off the green
		textColor: '#FCF9F5', // kraft text on dark fills
		textHalo: '#01361A' // primary-700 halo
	},
	// Dark mode: clusters get LIGHTER as density grows so they pop off the dusk base
	dark: {
		steps: [
			'step',
			['get', 'point_count'],
			'#579769', //  1–4   primary-400
			5,
			'#74AA85', //  5–9   primary-300
			10,
			'#9BC2A7', // 10–24  primary-200
			25,
			'#C2DAC9', // 25–49  primary-100
			50,
			'#E6F0EA' // 50+    primary-50
		],
		stroke: '#1A1410', // dusk page bg — lifts cluster off the dark map
		textColor: '#1A1410', // dark text on light fills
		textHalo: '#012511' // primary-900 halo
	}
};

export function buildClusterLayer(theme: EffectiveTheme): AnyLayer {
	const p = CLUSTER_PALETTE[theme];
	return {
		id: 'clusters',
		type: 'circle',
		source: SHOWN_LOCATIONS_SOURCE_ID,
		filter: ['has', 'point_count'],
		paint: {
			'circle-color': p.steps,
			'circle-radius': ['step', ['get', 'point_count'], 18, 5, 22, 10, 26, 25, 30, 50, 35],
			'circle-stroke-width': 2.5,
			'circle-stroke-color': p.stroke,
			'circle-stroke-opacity': 0.9
		}
	};
}

export function buildClusterCountLayer(theme: EffectiveTheme): AnyLayer {
	const p = CLUSTER_PALETTE[theme];
	return {
		id: 'cluster-count',
		type: 'symbol',
		source: SHOWN_LOCATIONS_SOURCE_ID,
		filter: ['has', 'point_count'],
		layout: {
			'text-field': '{point_count_abbreviated}',
			'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
			'text-size': 13,
			'text-letter-spacing': 0.04,
			'text-allow-overlap': true
		},
		paint: {
			'text-color': p.textColor,
			'text-halo-color': p.textHalo,
			'text-halo-width': 1
		}
	};
}

// ============================================================
// Focus ring — survival-orange "you are here" marker, both themes
// ============================================================
export const focusRingLayer: AnyLayer = {
	id: 'focus-ring',
	type: 'circle',
	source: SHOWN_LOCATIONS_SOURCE_ID,
	filter: ['==', ['get', 'id'], '__none__'],
	paint: {
		'circle-radius': 22,
		'circle-color': 'rgba(205, 87, 0, 0.18)', // tertiary-500 @ 18%
		'circle-stroke-color': '#CD5700', // tertiary-500 — route marker
		'circle-stroke-width': 2.5,
		'circle-stroke-opacity': 0.95
	}
};

// ============================================================
// Unclustered points — render the per-location PNG icons
// Anchor at the bottom so the pin tip lands on the coordinate.
// Scale by zoom so pins feel right at both regional and street levels.
// ============================================================
export const unclusteredPointLayer: AnyLayer = {
	id: 'unclustered-point',
	type: 'symbol',
	source: SHOWN_LOCATIONS_SOURCE_ID,
	filter: ['!', ['has', 'point_count']],
	layout: {
		'icon-image': ['get', 'icon'],
		'icon-anchor': 'bottom',
		'icon-size': ['interpolate', ['linear'], ['zoom'], 8, 0.08, 12, 0.12, 16, 0.16, 18, 0.2],
		'icon-allow-overlap': true,
		'icon-ignore-placement': true
	}
};

// ============================================================
// State boundary — forest green dashed line, sage in dark
// ============================================================
export function buildStateBoundaryLayer(theme: EffectiveTheme): AnyLayer {
	return {
		id: 'state-boundary-layer',
		type: 'line',
		source: 'state-boundary',
		paint: {
			'line-color': theme === 'light' ? '#01361A' : '#74AA85', // primary-700 / 300
			'line-width': 2,
			'line-dasharray': [3, 2],
			'line-opacity': 0.7
		}
	};
}

// ============================================================
// Selected city — survival-orange "filtered area" highlight
// ============================================================
export function buildSelectedCityFillLayer(theme: EffectiveTheme): AnyLayer {
	return {
		id: 'selected-city-layer',
		type: 'fill',
		source: 'selected-city',
		paint: {
			'fill-color': '#CD5700', // tertiary-500 — route marker
			'fill-opacity': theme === 'light' ? 0.1 : 0.18
		}
	};
}

export function buildSelectedCityOutlineLayer(theme: EffectiveTheme): AnyLayer {
	return {
		id: 'selected-city-outline',
		type: 'line',
		source: 'selected-city',
		paint: {
			'line-color': theme === 'light' ? '#A44600' : '#E08F54', // tertiary-700 / 400
			'line-width': 2,
			'line-opacity': 0.9
		}
	};
}
