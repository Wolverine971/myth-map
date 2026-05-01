// src/lib/components/map/map-layers.ts
import type { AnyLayer } from 'mapbox-gl';

export const SHOWN_LOCATIONS_SOURCE_ID = 'shownLocations';

export const clusterLayer: AnyLayer = {
	id: 'clusters',
	type: 'circle',
	source: SHOWN_LOCATIONS_SOURCE_ID,
	filter: ['has', 'point_count'],
	paint: {
		'circle-color': [
			'step',
			['get', 'point_count'],
			'#60a5fa',
			5,
			'#3b82f6',
			10,
			'#2563eb',
			25,
			'#1d4ed8',
			50,
			'#1e40af'
		],
		'circle-radius': ['step', ['get', 'point_count'], 18, 5, 22, 10, 26, 25, 30, 50, 35],
		'circle-stroke-width': 3,
		'circle-stroke-color': '#ffffff',
		'circle-stroke-opacity': 0.8
	}
};

export const clusterCountLayer: AnyLayer = {
	id: 'cluster-count',
	type: 'symbol',
	source: SHOWN_LOCATIONS_SOURCE_ID,
	filter: ['has', 'point_count'],
	layout: {
		'text-field': '{point_count_abbreviated}',
		'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
		'text-size': 14,
		'text-allow-overlap': true
	},
	paint: {
		'text-color': '#ffffff',
		'text-halo-color': '#1e40af',
		'text-halo-width': 1
	}
};

export const focusRingLayer: AnyLayer = {
	id: 'focus-ring',
	type: 'circle',
	source: SHOWN_LOCATIONS_SOURCE_ID,
	filter: ['==', ['get', 'id'], '__none__'],
	paint: {
		'circle-radius': 22,
		'circle-color': 'rgba(205, 87, 0, 0.15)',
		'circle-stroke-color': '#CD5700',
		'circle-stroke-width': 2,
		'circle-stroke-opacity': 0.95
	}
};

export const unclusteredPointLayer: AnyLayer = {
	id: 'unclustered-point',
	type: 'symbol',
	source: SHOWN_LOCATIONS_SOURCE_ID,
	filter: ['!', ['has', 'point_count']],
	layout: {
		'icon-image': ['get', 'icon'],
		'icon-size': 0.12,
		'icon-allow-overlap': true
	}
};

export const stateBoundaryLayer: AnyLayer = {
	id: 'state-boundary-layer',
	type: 'line',
	source: 'state-boundary',
	paint: {
		'line-color': '#3b82f6',
		'line-width': 2,
		'line-dasharray': [2, 2],
		'line-opacity': 0.8
	}
};

export const selectedCityFillLayer: AnyLayer = {
	id: 'selected-city-layer',
	type: 'fill',
	source: 'selected-city',
	paint: {
		'fill-color': '#3b82f6',
		'fill-opacity': 0.1
	}
};

export const selectedCityOutlineLayer: AnyLayer = {
	id: 'selected-city-outline',
	type: 'line',
	source: 'selected-city',
	paint: {
		'line-color': '#2563eb',
		'line-width': 2,
		'line-opacity': 0.9
	}
};
