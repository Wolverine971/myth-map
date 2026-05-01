<!-- src/lib/components/map/map.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { PUBLIC_MAP_KEY } from '$env/static/public';
	import { browser } from '$app/environment';
	import './mapbox.css';
	import { loadCityGeoJSON, loadStateBoundary } from '../../../utils/geoDataLoader';
	import type { Map, Popup, Marker, LngLatBounds, MapMouseEvent, GeoJSONSource } from 'mapbox-gl';
	import { notifications } from '../shared/notifications';
	import { attachLazyIconLoader } from './map-icons';
	import {
		clusterLayer,
		clusterCountLayer,
		unclusteredPointLayer,
		stateBoundaryLayer,
		selectedCityFillLayer,
		selectedCityOutlineLayer,
		SHOWN_LOCATIONS_SOURCE_ID
	} from './map-layers';
	import { buildFeatureCollection } from './map-features';
	import { buildAddress, buildPopupHTML } from './map-popup';
	import { FullscreenControl } from './FullscreenControl';

	export let locations: any[] = [];
	export let shownLocations: any[] = [];
	export let currentLocation: { lat: number; lng: number } | null = null;
	export let selectedState: { name: string; abr: string } | null = null;
	export let selectedCity: string | null = null;

	let prevStateAbr: string | null = null;
	let prevCity: string | null = null;

	let mapContainer: HTMLElement;
	let map: Map;
	let popup: Popup;
	let currentLocationMarker: Marker;
	let mapboxgl: typeof import('mapbox-gl');
	let audio: HTMLAudioElement;

	let mapReady = false;

	$: if (mapReady) syncShownLocations(shownLocations);
	$: if (mapReady) syncStateFilter(selectedState);
	$: if (mapReady) syncCityFilter(selectedState, selectedCity);
	$: if (mapReady && currentLocation) updateCurrentLocation(currentLocation);

	onMount(async () => {
		if (!browser) return;
		mapboxgl = await import('mapbox-gl');
		audio = new Audio('/sounds/tic-toc-click.wav');
		await initMap();
	});

	onDestroy(() => {
		if (map) map.remove();
	});

	async function initMap() {
		if (!mapContainer) return;

		map = new mapboxgl.Map({
			container: mapContainer,
			style: 'mapbox://styles/mapbox/streets-v12',
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
				if (currentLocation) updateCurrentLocation(currentLocation);
				mapReady = true;
			} catch (error) {
				console.error('Error initializing map:', error);
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
		map.addLayer(clusterLayer);
		map.addLayer(clusterCountLayer);
		map.addLayer(unclusteredPointLayer);
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

	function updateCurrentLocation(location: { lat: number; lng: number } | null) {
		if (!location || !map || !mapboxgl) return;

		const { lat, lng } = location;
		if (
			lat == null ||
			lng == null ||
			isNaN(lat) ||
			isNaN(lng) ||
			Math.abs(lat) > 90 ||
			Math.abs(lng) > 180
		) {
			console.warn('Invalid current-location coordinates:', location);
			return;
		}

		if (!currentLocationMarker) {
			currentLocationMarker = new mapboxgl.Marker(createMarkerElement())
				.setLngLat([lng, lat])
				.setPopup(
					new mapboxgl.Popup({ offset: 25 }).setHTML(`
						<div class="popup-content">
							<h3 class="popup-title">📍 Your Location</h3>
							<p class="popup-address">You are here</p>
						</div>
					`)
				)
				.addTo(map);
		} else {
			currentLocationMarker.setLngLat([lng, lat]);
		}
	}

	function createMarkerElement() {
		const el = document.createElement('div');
		el.className = 'marker';
		el.style.backgroundImage = `url(/map/location-arrow.svg)`;
		el.style.width = '30px';
		el.style.height = '30px';
		el.style.backgroundSize = '100%';
		return el;
	}

	function addMapControls() {
		map.addControl(new FullscreenControl(), 'top-right');
		map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
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
	   Map popup — Tiny Tribe Adventures brand palette
	   Forest Green primary, Sandstone surface, Slate Gray text
	   ============================================================ */

	:global(.mapboxgl-popup) {
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			sans-serif;
		z-index: 10;
	}

	:global(.mapboxgl-popup-content) {
		background: #ffffff;
		border: 1px solid #eee0cc; /* secondary-200 */
		border-radius: 14px;
		box-shadow:
			0 12px 24px -8px rgba(1, 68, 33, 0.18),
			0 4px 12px -4px rgba(1, 68, 33, 0.08);
		padding: 0;
		min-width: 264px;
		max-width: 300px;
		overflow: hidden;
	}

	:global(.mapboxgl-popup-close-button) {
		font-size: 18px;
		width: 26px;
		height: 26px;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #708090; /* neutral-500 */
		right: 8px;
		top: 8px;
		border-radius: 999px;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
	}

	:global(.mapboxgl-popup-close-button:hover) {
		color: #014421;
		background-color: #f7f0e6; /* secondary-100 */
	}

	:global(.mapboxgl-popup-tip) {
		border-top-color: #ffffff;
	}

	/* Popup content */
	:global(.popup-content) {
		padding: 1rem 1.125rem 1.125rem;
	}

	:global(.popup-title) {
		font-size: 1.0625rem;
		font-weight: 700;
		color: #014421; /* primary-500, Forest Green */
		margin: 0 0 0.625rem 0;
		line-height: 1.3;
		letter-spacing: -0.01em;
		padding-right: 1.5rem; /* leave room for close button */
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
		color: #4e5964; /* neutral-800 */
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
		border: 1px solid #eee0cc; /* secondary-200 */
		border-radius: 8px;
		background: #fcf9f5; /* secondary-50 */
		color: #708090; /* neutral-500 */
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			color 0.15s ease,
			border-color 0.15s ease;
	}

	:global(.popup-copy-btn:hover) {
		background: #f7f0e6; /* secondary-100 */
		border-color: #e5d0b3; /* secondary-300 */
		color: #014421; /* primary-500 */
	}

	:global(.popup-actions) {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	:global(.popup-btn) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		font-size: 0.8125rem;
		font-weight: 600;
		border-radius: 9px;
		text-decoration: none;
		transition:
			background-color 0.15s ease,
			color 0.15s ease,
			border-color 0.15s ease,
			transform 0.15s ease;
		cursor: pointer;
		border: 1px solid transparent;
		line-height: 1;
		white-space: nowrap;
	}

	:global(.popup-btn-primary) {
		background-color: #014421; /* primary-500, Forest Green */
		color: #ffffff;
		border-color: #014421;
		flex: 1;
	}

	:global(.popup-btn-primary:hover) {
		background-color: #013d1e; /* primary-600 */
		border-color: #013d1e;
		transform: translateY(-1px);
	}

	:global(.popup-btn-secondary) {
		background-color: #ffffff;
		color: #014421; /* primary-500 */
		border-color: #c2dac9; /* primary-100 */
	}

	:global(.popup-btn-secondary:hover) {
		background-color: #e6f0ea; /* primary-50 */
		border-color: #9bc2a7; /* primary-200 */
	}

	:global(.popup-btn .popup-icon) {
		color: currentColor;
		flex-shrink: 0;
	}

	/* Mapbox control group buttons */
	:global(.mapboxgl-ctrl-group) {
		background: white;
		border-radius: 0.5rem;
		box-shadow:
			0 1px 3px 0 rgba(0, 0, 0, 0.1),
			0 1px 2px 0 rgba(0, 0, 0, 0.06);
	}

	:global(.mapboxgl-ctrl button) {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
	}

	:global(.mapboxgl-ctrl button:hover) {
		background-color: #f3f4f6;
	}

	:global(.mapboxgl-ctrl button:first-child) {
		border-radius: 0.5rem 0.5rem 0 0;
	}

	:global(.mapboxgl-ctrl button:last-child) {
		border-radius: 0 0 0.5rem 0.5rem;
	}

	:global(.mapboxgl-ctrl button:only-child) {
		border-radius: 0.5rem;
	}

	/* Custom fullscreen control (created in JS so styles must be global) */
	:global(.fullscreen-button) {
		background: white;
		border: none;
		cursor: pointer;
		padding: 0;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		border-radius: 0.5rem;
	}

	:global(.fullscreen-button:hover) {
		background-color: #f3f4f6;
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
		border: 2px solid #374151;
		border-radius: 2px;
	}

	:global(.fullscreen-icon::after) {
		content: '';
		position: absolute;
		top: -2px;
		left: -2px;
		width: 6px;
		height: 6px;
		border-top: 2px solid #374151;
		border-left: 2px solid #374151;
		border-radius: 2px 0 0 0;
		box-shadow:
			16px 0 0 0 #374151,
			0 16px 0 0 #374151,
			16px 16px 0 0 #374151;
	}

	:global(.exit-fullscreen-icon::before) {
		content: '';
		position: absolute;
		top: 4px;
		left: 4px;
		width: 10px;
		height: 10px;
		border: 2px solid #374151;
		border-radius: 2px;
	}

	:global(.exit-fullscreen-icon::after) {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 6px;
		height: 6px;
		border-bottom: 2px solid #374151;
		border-right: 2px solid #374151;
		border-radius: 0 0 2px 0;
		box-shadow:
			8px 0 0 0 #374151,
			0 8px 0 0 #374151,
			8px 8px 0 0 #374151;
	}
</style>
