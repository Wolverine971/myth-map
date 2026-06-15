// src/lib/components/map/map-layers.ts
import type { AnyLayer, ExpressionSpecification } from 'mapbox-gl';
import type { EffectiveTheme } from '$lib/stores/themeStore';

export const SHOWN_LOCATIONS_SOURCE_ID = 'shownLocations';
export const RADAR_ISOCHRONE_SOURCE_ID = 'radarIsochrones';
export const RADAR_ENTITIES_SOURCE_ID = 'radarEntities';

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

// Thresholds tuned for the actual location density in the DMV data set —
// most clusters live in the 2–20 range, so we put more color resolution
// in the low/mid buckets and reserve the darkest tone for genuinely big stacks.
const CLUSTER_PALETTE: Record<EffectiveTheme, ClusterPalette> = {
	// Light mode: clusters are deep forest, kraft text on top
	light: {
		steps: [
			'step',
			['get', 'point_count'],
			'#74AA85', //  2     primary-300
			3,
			'#579769', //  3–6   primary-400
			7,
			'#014421', //  7–14  primary-500 (Forest Green)
			15,
			'#013D1E', // 15–29  primary-600
			30,
			'#012E16' // 30+    primary-800
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
			'#579769', //  2     primary-400
			3,
			'#74AA85', //  3–6   primary-300
			7,
			'#9BC2A7', //  7–14  primary-200
			15,
			'#C2DAC9', // 15–29  primary-100
			30,
			'#E6F0EA' // 30+    primary-50
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
			// Radius ramps along the same buckets as the color palette.
			'circle-radius': ['step', ['get', 'point_count'], 18, 3, 22, 7, 26, 15, 30, 30, 35],
			'circle-stroke-width': ['case', ['boolean', ['feature-state', 'hover'], false], 4, 2.5],
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
// Adventure Radar overlays — temporary scan layers
// ============================================================
export function buildRadarIsochroneFillLayer(theme: EffectiveTheme): AnyLayer {
	return {
		id: 'radar-isochrone-fill',
		type: 'fill',
		source: RADAR_ISOCHRONE_SOURCE_ID,
		paint: {
			'fill-color': [
				'match',
				['to-string', ['get', 'contour']],
				'15',
				'#87CEEB',
				'30',
				'#D2B48C',
				'60',
				theme === 'light' ? '#74AA85' : '#579769',
				'#87CEEB'
			],
			'fill-opacity': [
				'match',
				['to-string', ['get', 'contour']],
				'15',
				0.22,
				'30',
				0.15,
				'60',
				0.1,
				0.14
			]
		}
	};
}

export function buildRadarIsochroneOutlineLayer(theme: EffectiveTheme): AnyLayer {
	return {
		id: 'radar-isochrone-outline',
		type: 'line',
		source: RADAR_ISOCHRONE_SOURCE_ID,
		paint: {
			'line-color': theme === 'light' ? '#014421' : '#9BC2A7',
			'line-width': [
				'match',
				['to-string', ['get', 'contour']],
				'15',
				2.25,
				'30',
				1.75,
				'60',
				1.25,
				1.5
			],
			'line-opacity': 0.78,
			'line-dasharray': [2, 1.5]
		}
	};
}

export function buildRadarClusterLayer(theme: EffectiveTheme): AnyLayer {
	return {
		id: 'radar-clusters',
		type: 'circle',
		source: RADAR_ENTITIES_SOURCE_ID,
		filter: ['has', 'point_count'],
		paint: {
			'circle-color': theme === 'light' ? '#CD5700' : '#E08F54',
			'circle-radius': ['step', ['get', 'point_count'], 17, 3, 21, 7, 25, 15, 30],
			'circle-stroke-color': theme === 'light' ? '#FCF9F5' : '#1A1410',
			'circle-stroke-width': 2.5,
			'circle-opacity': 0.96
		}
	};
}

export function buildRadarClusterCountLayer(theme: EffectiveTheme): AnyLayer {
	return {
		id: 'radar-cluster-count',
		type: 'symbol',
		source: RADAR_ENTITIES_SOURCE_ID,
		filter: ['has', 'point_count'],
		layout: {
			'text-field': '{point_count_abbreviated}',
			'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
			'text-size': 12,
			'text-allow-overlap': true
		},
		paint: {
			'text-color': theme === 'light' ? '#fff' : '#1A1410',
			'text-halo-color': theme === 'light' ? '#A44600' : '#F2B489',
			'text-halo-width': 0.75
		}
	};
}

export const radarFocusRingLayer: AnyLayer = {
	id: 'radar-focus-ring',
	type: 'circle',
	source: RADAR_ENTITIES_SOURCE_ID,
	filter: ['==', ['get', 'id'], '__none__'],
	paint: {
		'circle-radius': 24,
		'circle-color': 'rgba(135, 206, 235, 0.22)',
		'circle-stroke-color': '#0B7EA3',
		'circle-stroke-width': 2.5,
		'circle-stroke-opacity': 0.95
	}
};

export const radarUnclusteredPointLayer: AnyLayer = {
	id: 'radar-unclustered-point',
	type: 'symbol',
	source: RADAR_ENTITIES_SOURCE_ID,
	filter: ['!', ['has', 'point_count']],
	layout: {
		'icon-image': ['get', 'icon'],
		'icon-anchor': 'bottom',
		'icon-size': ['interpolate', ['linear'], ['zoom'], 8, 0.1, 12, 0.14, 16, 0.18, 18, 0.22],
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
