<!-- src/lib/components/map/map.svelte -->
<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { get } from 'svelte/store';
	import { PUBLIC_MAP_KEY } from '$env/static/public';
	import { browser } from '$app/environment';
	import './mapbox.css';
	import { loadCityGeoJSON, loadStateBoundary } from '../../../utils/geoDataLoader';
	import type {
		Map,
		Popup,
		LngLatBounds,
		MapMouseEvent,
		GeoJSONSource,
		GeolocateControl
	} from 'mapbox-gl';
	import { notifications } from '../shared/notifications';
	import { attachLazyIconLoader } from './map-icons';
	import {
		clusterLayer,
		clusterCountLayer,
		focusRingLayer,
		unclusteredPointLayer,
		stateBoundaryLayer,
		selectedCityFillLayer,
		selectedCityOutlineLayer,
		SHOWN_LOCATIONS_SOURCE_ID
	} from './map-layers';
	import { buildFeatureCollection } from './map-features';
	import { buildAddress, buildPopupHTML } from './map-popup';
	import { FullscreenControl } from './FullscreenControl';
	import { currentLocation } from '$lib/stores/locationStore';
	import { locationFocus, type LocationFocusKey } from '$lib/stores/locationFocusStore';
	import { effectiveTheme, type EffectiveTheme } from '$lib/stores/themeStore';

	export let locations: any[] = [];
	export let shownLocations: any[] = [];
	export let selectedState: { name: string; abr: string } | null = null;
	export let selectedCity: string | null = null;

	const dispatch = createEventDispatcher<{ pinclick: { id: LocationFocusKey } }>();

	// Mapbox base styles per theme.
	// Using `outdoors-v12` for light because it leans topographic — fits the brand.
	// `dark-v11` for dark mode.
	const STYLE_FOR_THEME: Record<EffectiveTheme, string> = {
		light: 'mapbox://styles/mapbox/outdoors-v12',
		dark: 'mapbox://styles/mapbox/dark-v11'
	};

	let currentStyleUrl: string | null = null;

	let focusedId: LocationFocusKey | null = null;
	const unsubscribeFocus = locationFocus.subscribe(({ hovered, selected }) => {
		const next = hovered ?? selected;
		if (next === focusedId) return;
		focusedId = next;
		if (mapReady) syncFocusRing(next);
	});

	let prevStateAbr: string | null = null;
	let prevCity: string | null = null;

	let mapContainer: HTMLElement;
	let map: Map;
	let popup: Popup;
	let geolocateControl: GeolocateControl;
	let mapboxgl: typeof import('mapbox-gl');
	let audio: HTMLAudioElement;

	let mapReady = false;
	let unsubscribeTheme: (() => void) | null = null;

	$: if (mapReady) syncShownLocations(shownLocations);
	$: if (mapReady) syncStateFilter(selectedState);
	$: if (mapReady) syncCityFilter(selectedState, selectedCity);

	onMount(async () => {
		if (!browser) return;
		mapboxgl = await import('mapbox-gl');
		audio = new Audio('/sounds/tic-toc-click.wav');
		await initMap();

		// After the map is initialized, subscribe to theme changes and swap the
		// base style on the fly. We skip the first emission (already used at init).
		let isFirstEmit = true;
		unsubscribeTheme = effectiveTheme.subscribe(($theme) => {
			if (isFirstEmit) {
				isFirstEmit = false;
				return;
			}
			swapMapStyle($theme);
		});
	});

	onDestroy(() => {
		unsubscribeFocus();
		unsubscribeTheme?.();
		if (map) map.remove();
	});

	async function initMap() {
		if (!mapContainer) return;

		const initialTheme = get(effectiveTheme);
		currentStyleUrl = STYLE_FOR_THEME[initialTheme];

		map = new mapboxgl.Map({
			container: mapContainer,
			style: currentStyleUrl,
			center: [-76.7818, 39.2141],
			zoom: 7,
			minZoom: 3,
			maxZoom: 18,
			accessToken: PUBLIC_MAP_KEY,
			renderWorldCopies: false,
			preserveDrawingBuffer: false,
			antialias: false,
			fadeDuration: 300
		});

		attachLazyIconLoader(map);

		map.on('load', async () => {
			try {
				popup = new mapboxgl.Popup({ offset: [0, 0], className: 'popups' });
				addInitialSourceAndLayers();
				addMapControls();
				addMapEventListeners();
				optimizeForMobile();
				if (selectedState) await syncStateFilter(selectedState);
				if (selectedState && selectedCity) await syncCityFilter(selectedState, selectedCity);
				autoActivateGeolocate();
				mapReady = true;
				syncFocusRing(focusedId);
			} catch (error) {
				console.error('Error initializing map:', error);
			}
		});
	}

	/**
	 * Swap the Mapbox base style (light/dark) and restore all custom layers
	 * after the new style finishes loading. setStyle() removes our sources +
	 * layers, so we rebuild them on `style.load`.
	 */
	function swapMapStyle(theme: EffectiveTheme) {
		if (!map) return;
		const desired = STYLE_FOR_THEME[theme];
		if (desired === currentStyleUrl) return;
		currentStyleUrl = desired;

		// Capture state we need to restore — the existing prev* trackers prevent
		// reload-on-no-change, so reset them.
		const stateToRestore = selectedState;
		const cityToRestore = selectedCity;
		prevStateAbr = null;
		prevCity = null;

		map.setStyle(desired);

		map.once('style.load', async () => {
			try {
				addInitialSourceAndLayers();
				if (stateToRestore) await syncStateFilter(stateToRestore);
				if (stateToRestore && cityToRestore) {
					await syncCityFilter(stateToRestore, cityToRestore);
				}
				syncFocusRing(focusedId);
			} catch (error) {
				console.error('Error restoring layers after style swap:', error);
			}
		});
	}

	function addInitialSourceAndLayers() {
		if (!map.getSource(SHOWN_LOCATIONS_SOURCE_ID)) {
			const initialData = shownLocations?.length ? shownLocations : locations;
			map.addSource(SHOWN_LOCATIONS_SOURCE_ID, {
				type: 'geojson',
				data: buildFeatureCollection(initialData),
				cluster: true,
				clusterMaxZoom: 16,
				clusterRadius: 40,
				clusterProperties: {
					point_count_abbreviated: ['+', ['get', 'point_count']]
				}
			});
		}
		if (!map.getLayer(clusterLayer.id)) map.addLayer(clusterLayer);
		if (!map.getLayer(clusterCountLayer.id)) map.addLayer(clusterCountLayer);
		if (!map.getLayer(focusRingLayer.id)) map.addLayer(focusRingLayer);
		if (!map.getLayer(unclusteredPointLayer.id)) map.addLayer(unclusteredPointLayer);
	}

	function syncFocusRing(id: LocationFocusKey | null) {
		if (!map?.getLayer('focus-ring')) return;
		const sentinel = id == null ? '__none__' : id;
		map.setFilter('focus-ring', ['==', ['get', 'id'], sentinel]);
	}

	function syncShownLocations(list: any[]) {
		const source = map?.getSource(SHOWN_LOCATIONS_SOURCE_ID) as GeoJSONSource | undefined;
		source?.setData(buildFeatureCollection(list ?? []));
	}

	async function syncStateFilter(stateObj: { name: string; abr: string } | null) {
		if (!map) return;

		if (!stateObj) {
			if (prevStateAbr) {
				removeStateLayers();
				removeSelectedCityLayers();
				prevStateAbr = null;
				prevCity = null;
			}
			return;
		}

		if (prevStateAbr === stateObj.abr) return;
		prevStateAbr = stateObj.abr;

		try {
			const stateGeoJSON = await loadStateBoundary(stateObj.abr);

			if (!stateGeoJSON?.features?.length) {
				throw new Error('No features found for state');
			}

			updateStateLayer(stateGeoJSON);
			if (!selectedCity) {
				removeSelectedCityLayers();
				fitMapToBounds(stateGeoJSON);
			}
		} catch (error) {
			console.error('Error loading state boundary:', error);
			notifications.warning(`Failed to load boundary for ${stateObj.name}`);
			prevStateAbr = null;
		}
	}

	function updateStateLayer(stateGeoJSON: GeoJSON.GeoJSON) {
		if (!map.getSource('state-boundary')) {
			map.addSource('state-boundary', { type: 'geojson', data: stateGeoJSON });
			map.addLayer(stateBoundaryLayer);
		} else {
			(map.getSource('state-boundary') as GeoJSONSource).setData(stateGeoJSON);
		}
	}

	function removeSelectedCityLayers() {
		if (!map) return;
		['selected-city-layer', 'selected-city-outline'].forEach((layerId) => {
			if (map.getLayer(layerId)) map.removeLayer(layerId);
		});
		if (map.getSource('selected-city')) map.removeSource('selected-city');
	}

	function removeStateLayers() {
		if (!map) return;
		if (map.getLayer('state-boundary-layer')) map.removeLayer('state-boundary-layer');
		if (map.getSource('state-boundary')) map.removeSource('state-boundary');
	}

	function fitMapToBounds(geoJSON: GeoJSON.GeoJSON) {
		const geom =
			geoJSON.type === 'Feature'
				? geoJSON.geometry
				: geoJSON.type === 'FeatureCollection'
					? geoJSON.features[0]?.geometry
					: geoJSON;
		if (!geom) return;
		const bounds = new mapboxgl.LngLatBounds();
		extendBoundsForGeometry(geom, bounds);
		map.fitBounds(bounds, { padding: 40, duration: 1200, curve: 1.42 });
	}

	function extendBoundsForGeometry(geometry: GeoJSON.Geometry, bounds: LngLatBounds) {
		if (geometry.type === 'Polygon') {
			geometry.coordinates[0]?.forEach((coord) => bounds.extend(coord as [number, number]));
		} else if (geometry.type === 'MultiPolygon') {
			geometry.coordinates.forEach((polygon) => {
				polygon[0]?.forEach((coord) => bounds.extend(coord as [number, number]));
			});
		}
	}

	async function syncCityFilter(
		stateObj: { abr: string; name: string } | null,
		cityName: string | null
	) {
		if (!map) return;

		if (!cityName || !stateObj) {
			if (prevCity) {
				removeSelectedCityLayers();
				prevCity = null;
			}
			return;
		}

		if (prevCity === cityName) return;
		prevCity = cityName;

		try {
			const cityGeoJSON = await loadCityGeoJSON(
				stateObj.abr,
				cityName.toLowerCase().replace(/\s+/g, '-')
			);

			if (!cityGeoJSON) throw new Error('No GeoJSON data found for city');

			const cityFeature =
				cityGeoJSON.type === 'FeatureCollection' ? cityGeoJSON.features[0] : cityGeoJSON;

			if (!cityFeature) throw new Error('No valid city feature found');

			updateCityLayer(cityFeature);
			zoomToFeature(cityFeature);
		} catch (error) {
			console.error('Error loading city GeoJSON:', error);
			notifications.warning(`Failed to load boundary for ${cityName}`);
			prevCity = null;
		}
	}

	function updateCityLayer(cityFeature: GeoJSON.Feature) {
		if (!map.getSource('selected-city')) {
			map.addSource('selected-city', { type: 'geojson', data: cityFeature });
			map.addLayer(selectedCityFillLayer);
			map.addLayer(selectedCityOutlineLayer);
		} else {
			(map.getSource('selected-city') as GeoJSONSource).setData(cityFeature);
		}
	}

	function zoomToFeature(feature: GeoJSON.Feature) {
		const bounds = new mapboxgl.LngLatBounds();
		extendBoundsForGeometry(feature.geometry, bounds);
		map.fitBounds(bounds, { padding: 40, maxZoom: 14, duration: 1000, curve: 1.2 });
	}

	function addMapControls() {
		map.addControl(new FullscreenControl(), 'top-right');
		map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

		geolocateControl = new mapboxgl.GeolocateControl({
			positionOptions: { enableHighAccuracy: true, timeout: 7000 },
			trackUserLocation: true,
			showUserHeading: true,
			showAccuracyCircle: true,
			fitBoundsOptions: { maxZoom: 13 }
		});
		map.addControl(geolocateControl, 'top-right');

		geolocateControl.on('geolocate', (event: any) => {
			const coords = event?.coords ?? event?.data?.coords;
			if (!coords) return;
			const { latitude, longitude, accuracy, heading } = coords;
			if (latitude == null || longitude == null) return;
			currentLocation.set({
				latitude,
				longitude,
				accuracy: accuracy ?? 0,
				heading: heading ?? 0,
				lat: latitude,
				lng: longitude,
				zip_code: ''
			});
		});
	}

	async function autoActivateGeolocate() {
		if (!geolocateControl || !navigator?.permissions?.query) return;
		try {
			const status = await navigator.permissions.query({ name: 'geolocation' });
			if (status.state === 'granted') geolocateControl.trigger();
		} catch {
			// Permissions API unavailable or rejected the query — leave the button for the user.
		}
	}

	function addMapEventListeners() {
		map.on('click', 'clusters', handleClusterClick);
		map.on('click', 'unclustered-point', handleUnclusteredPointClick);
		const setCursor = (cursor: string) => () => (map.getCanvas().style.cursor = cursor);
		map.on('mouseenter', 'clusters', setCursor('pointer'));
		map.on('mouseleave', 'clusters', setCursor(''));
		map.on('mouseenter', 'unclustered-point', setCursor('pointer'));
		map.on('mouseleave', 'unclustered-point', setCursor(''));
	}

	function handleClusterClick(e: MapMouseEvent) {
		const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
		if (!features.length) return;
		const feature = features[0];
		const clusterId = feature.properties?.cluster_id as number | undefined;
		const pointCount = (feature.properties?.point_count as number) ?? 0;
		if (clusterId == null) return;
		const clusterSource = map.getSource(SHOWN_LOCATIONS_SOURCE_ID) as GeoJSONSource;
		const center = (feature.geometry as GeoJSON.Point).coordinates as [number, number];

		clusterSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
			if (err || zoom == null) return;
			let targetZoom = zoom;
			if (pointCount > 50) targetZoom = Math.min(zoom + 2, 16);
			else if (pointCount > 20) targetZoom = Math.min(zoom + 1.5, 16);
			else if (pointCount > 10) targetZoom = Math.min(zoom + 1, 16);

			map.flyTo({ center, zoom: targetZoom, duration: 500, curve: 1, essential: true });
		});
	}

	function handleUnclusteredPointClick(e: MapMouseEvent & { features?: GeoJSON.Feature[] }) {
		const feature = e.features?.[0];
		if (!feature || feature.geometry.type !== 'Point') return;

		const props = (feature.properties || {}) as Record<string, string>;
		const coordinates = (feature.geometry.coordinates as number[]).slice() as [number, number];

		const rawId = (feature.properties as Record<string, unknown>)?.id;
		if (rawId != null) {
			const id = rawId as LocationFocusKey;
			locationFocus.select(id);
			dispatch('pinclick', { id });
		}

		while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
			coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
		}

		if (map.getZoom() < 15) {
			map.flyTo({
				center: coordinates,
				zoom: 15,
				duration: 500,
				curve: 1.2,
				offset: [0, -100],
				essential: true
			});
		} else {
			map.panTo(coordinates, { duration: 300, offset: [0, -100] });
		}

		const copyId = `copy-${(props.name || 'location').replace(/\s+/g, '-')}`;
		const address = buildAddress(props);

		popup.setLngLat(coordinates).setHTML(buildPopupHTML(props, copyId)).addTo(map);

		// Wire the copy button after the popup DOM exists.
		queueMicrotask(() => {
			const copyButton = document.getElementById(copyId);
			copyButton?.addEventListener('click', () => copyAddress(address));
		});
	}

	function copyAddress(address: string) {
		if (!navigator.clipboard) {
			notifications.warning('Clipboard not supported');
			return;
		}
		navigator.clipboard
			.writeText(address)
			.then(() => {
				notifications.info('Address copied to clipboard');
				audio?.play().catch(() => {});
			})
			.catch((err) => {
				console.error('Failed to copy address:', err);
				notifications.warning('Failed to copy address');
			});
	}

	function optimizeForMobile() {
		if (window.innerWidth < 768) {
			// Prevent the map from hijacking page scroll, but keep dragging/touch panning enabled.
			map.scrollZoom.disable();
			map.dragRotate.disable();
			map.touchZoomRotate.disableRotation();
		}
	}
</script>

<div class="map-wrap">
	<div class="map" id="map" bind:this={mapContainer}></div>
</div>

<style>
	.map-wrap {
		position: relative;
		z-index: 2;
		width: 100%;
		height: 100%;
	}
	.map {
		height: 100%;
		visibility: visible !important;
	}

	/* ============================================================
	   Map popup — theme-aware via CSS variables (see app.css :root + .dark)
	   Field-manual style: stamped 2px corners, mono labels, kraft surface in
	   light mode, dusk-brown in dark mode.
	   ============================================================ */

	:global(.mapboxgl-popup) {
		font-family: theme('fontFamily.sans');
		z-index: 10;
	}

	:global(.mapboxgl-popup-content) {
		background: var(--surface-surface);
		color: var(--text-default);
		border: 1px solid var(--border-subtle);
		border-radius: 2px;
		box-shadow: 0 12px 28px rgba(1, 68, 33, 0.1);
		padding: 0;
		min-width: 264px;
		max-width: 300px;
		overflow: hidden;
	}

	:global(.dark .mapboxgl-popup-content) {
		box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
	}

	:global(.mapboxgl-popup-close-button) {
		font-size: 18px;
		width: 26px;
		height: 26px;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-subtle);
		right: 8px;
		top: 8px;
		border-radius: 2px;
		background: transparent;
		transition:
			background-color 100ms cubic-bezier(0.22, 1, 0.36, 1),
			color 100ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	:global(.mapboxgl-popup-close-button:hover) {
		color: theme('colors.primary.700');
		background-color: var(--surface-sunken);
	}

	:global(.dark .mapboxgl-popup-close-button:hover) {
		color: theme('colors.primary.300');
	}

	/* Tip color follows surface — covers all anchor orientations */
	:global(.mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip),
	:global(.mapboxgl-popup-anchor-bottom-left .mapboxgl-popup-tip),
	:global(.mapboxgl-popup-anchor-bottom-right .mapboxgl-popup-tip) {
		border-top-color: var(--surface-surface);
	}
	:global(.mapboxgl-popup-anchor-top .mapboxgl-popup-tip),
	:global(.mapboxgl-popup-anchor-top-left .mapboxgl-popup-tip),
	:global(.mapboxgl-popup-anchor-top-right .mapboxgl-popup-tip) {
		border-bottom-color: var(--surface-surface);
	}
	:global(.mapboxgl-popup-anchor-left .mapboxgl-popup-tip) {
		border-right-color: var(--surface-surface);
	}
	:global(.mapboxgl-popup-anchor-right .mapboxgl-popup-tip) {
		border-left-color: var(--surface-surface);
	}

	/* Popup content */
	:global(.popup-content) {
		padding: 1rem 1.125rem 1.125rem;
	}

	:global(.popup-title) {
		font-family: theme('fontFamily.display');
		font-size: 1rem;
		font-weight: 700;
		color: theme('colors.primary.700');
		margin: 0 0 0.625rem 0;
		line-height: 1.25;
		letter-spacing: -0.01em;
		padding-right: 1.5rem; /* room for close button */
	}

	:global(.dark .popup-title) {
		color: theme('colors.primary.300');
	}

	:global(.popup-address-row) {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin: 0 0 0.875rem 0;
	}

	:global(.popup-address) {
		flex: 1;
		font-size: 0.8125rem;
		color: var(--text-default);
		margin: 0;
		line-height: 1.5;
	}

	:global(.popup-copy-btn) {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		border: 1px solid var(--border-subtle);
		border-radius: 2px;
		background: var(--surface-sunken);
		color: var(--text-subtle);
		cursor: pointer;
		transition:
			background-color 100ms cubic-bezier(0.22, 1, 0.36, 1),
			color 100ms cubic-bezier(0.22, 1, 0.36, 1),
			border-color 100ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	:global(.popup-copy-btn:hover) {
		background: var(--surface-elevated);
		border-color: var(--border-strong);
		color: theme('colors.primary.700');
	}

	:global(.dark .popup-copy-btn:hover) {
		color: theme('colors.primary.300');
	}

	:global(.popup-actions) {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	/* Field-manual buttons — stamped 2px, mono uppercase */
	:global(.popup-btn) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		font-family: theme('fontFamily.mono');
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		border-radius: 2px;
		text-decoration: none;
		transition:
			background-color 100ms cubic-bezier(0.22, 1, 0.36, 1),
			color 100ms cubic-bezier(0.22, 1, 0.36, 1),
			border-color 100ms cubic-bezier(0.22, 1, 0.36, 1);
		cursor: pointer;
		border: 1px solid transparent;
		line-height: 1;
		white-space: nowrap;
	}

	:global(.popup-btn-primary) {
		background-color: theme('colors.primary.700');
		color: #ffffff;
		border-color: theme('colors.primary.700');
		flex: 1;
	}

	:global(.popup-btn-primary:hover) {
		background-color: theme('colors.primary.600');
		border-color: theme('colors.primary.600');
	}

	:global(.dark .popup-btn-primary) {
		background-color: theme('colors.primary.500');
		border-color: theme('colors.primary.500');
	}

	:global(.dark .popup-btn-primary:hover) {
		background-color: theme('colors.primary.400');
		border-color: theme('colors.primary.400');
	}

	:global(.popup-btn-secondary) {
		background-color: var(--surface-surface);
		color: theme('colors.primary.700');
		border-color: var(--border-subtle);
	}

	:global(.popup-btn-secondary:hover) {
		background-color: var(--surface-sunken);
		border-color: var(--border-strong);
	}

	:global(.dark .popup-btn-secondary) {
		color: theme('colors.primary.300');
	}

	:global(.popup-btn .popup-icon) {
		color: currentColor;
		flex-shrink: 0;
	}

	/* Mapbox control buttons — stamped, theme-aware */
	:global(.mapboxgl-ctrl-group) {
		background: var(--surface-surface);
		border: 1px solid var(--border-subtle);
		border-radius: 2px;
		box-shadow: 0 1px 2px rgba(1, 68, 33, 0.04);
	}

	:global(.dark .mapboxgl-ctrl-group) {
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
	}

	:global(.mapboxgl-ctrl-group:not(:empty)) {
		box-shadow: 0 1px 2px rgba(1, 68, 33, 0.04);
	}

	:global(.mapboxgl-ctrl button) {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		cursor: pointer;
		background: var(--surface-surface);
		transition: background-color 100ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	:global(.mapboxgl-ctrl button:hover) {
		background-color: var(--surface-sunken);
	}

	:global(.mapboxgl-ctrl button:first-child) {
		border-radius: 2px 2px 0 0;
	}

	:global(.mapboxgl-ctrl button:last-child) {
		border-radius: 0 0 2px 2px;
	}

	:global(.mapboxgl-ctrl button:only-child) {
		border-radius: 2px;
	}

	/* Invert mapbox control icons in dark mode so they remain visible */
	:global(.dark .mapboxgl-ctrl-group button .mapboxgl-ctrl-icon) {
		filter: invert(1) hue-rotate(180deg);
	}

	/* Custom fullscreen control */
	:global(.fullscreen-button) {
		background: var(--surface-surface);
		border: none;
		cursor: pointer;
		padding: 0;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 100ms cubic-bezier(0.22, 1, 0.36, 1);
		border-radius: 2px;
	}

	:global(.fullscreen-button:hover) {
		background-color: var(--surface-sunken);
	}

	:global(.fullscreen-icon) {
		width: 18px;
		height: 18px;
		position: relative;
	}

	:global(.fullscreen-icon::before) {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border: 2px solid var(--text-default);
		border-radius: 2px;
	}

	:global(.fullscreen-icon::after) {
		content: '';
		position: absolute;
		top: -2px;
		left: -2px;
		width: 6px;
		height: 6px;
		border-top: 2px solid var(--text-default);
		border-left: 2px solid var(--text-default);
		border-radius: 2px 0 0 0;
		box-shadow:
			16px 0 0 0 var(--text-default),
			0 16px 0 0 var(--text-default),
			16px 16px 0 0 var(--text-default);
	}

	:global(.exit-fullscreen-icon::before) {
		content: '';
		position: absolute;
		top: 4px;
		left: 4px;
		width: 10px;
		height: 10px;
		border: 2px solid var(--text-default);
		border-radius: 2px;
	}

	:global(.exit-fullscreen-icon::after) {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 6px;
		height: 6px;
		border-bottom: 2px solid var(--text-default);
		border-right: 2px solid var(--text-default);
		border-radius: 0 0 2px 0;
		box-shadow:
			8px 0 0 0 var(--text-default),
			0 8px 0 0 var(--text-default),
			8px 8px 0 0 var(--text-default);
	}
</style>
