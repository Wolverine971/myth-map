<!-- src/lib/components/map/map.svelte -->
<script lang="ts">
	import { setContext, onMount, onDestroy } from 'svelte';
	import { PUBLIC_MAP_KEY } from '$env/static/public';
	import { browser } from '$app/environment';
	import './mapbox.css';
	import { getLocationIcon } from '../../../utils/locationPhotos.js';
	import { getCurrentLocation } from '../../../utils/userLocation';
	import { loadCityGeoJSON } from '../../../utils/geoDataLoader';
	import type { Map, Popup, Marker, LngLatBounds } from 'mapbox-gl';
	import { notifications } from '../shared/notifications';

	export let locations: any[] = [];
	export let shownLocations: any[] = [];
	export let currentLocation: { lat: number; lng: number } | null = null;
	export let selectedState: { name: string; abr: string } | null = null;
	export let selectedCity: string | null = null;

	let _selectedState;
	let _selectedCity;

	let mapContainer: HTMLElement;
	let map: Map;
	let popup: Popup;
	let currentLocationMarker: Marker;
	let mapboxgl: typeof import('mapbox-gl');
	const audio = new Audio('/sounds/tic-toc-click.wav');

	const key = Symbol();

	let mapInitialized = false;

	$: if (map && mapboxgl && mapInitialized) {
		if (shownLocations) updateLocations(shownLocations);
		if (selectedState) updateStateFilter(selectedState);
		if (selectedState && selectedCity) updateCityFilter(selectedState, selectedCity);
		if (selectedState && !selectedCity) unselectCityFilter();
	}

	$: if (currentLocation && mapInitialized) showCurrentLocation();

	const showCurrentLocation = async () => {
		if (!currentLocation?.lat && browser) {
			await getCurrentLocation();
		}

		if (!map || !mapboxgl?.Marker) return;

		if (!currentLocationMarker) {
			const el = createMarkerElement();
			currentLocationMarker = new mapboxgl.Marker(el)
				.setLngLat(currentLocation)
				.setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
					<div class="popup-content">
						<h3 class="popup-title">📍 Your Location</h3>
						<p class="popup-address">You are here</p>
					</div>
				`))
				.addTo(map);
		} else {
			currentLocationMarker.setLngLat(currentLocation);
		}
	};

	onMount(async () => {
		if (browser) {
			mapboxgl = await import('mapbox-gl');
			await initMap();
			mapInitialized = true;
		}
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
			fadeDuration: 300 // Smooth fade-in for tiles
		});

		map.on('load', async () => {
			try {
				popup = new mapboxgl.Popup({ offset: [0, 0], className: 'popups' });
				await initLayers();
				updateMapState();
				addMapControls();
				addMapEventListeners();
				optimizeForMobile();
			} catch (error) {
				console.error('Error initializing map:', error);
			}
		});
	}

	function updateMapState() {
		if (shownLocations) updateLocations(shownLocations);
		if (currentLocation) updateCurrentLocation(currentLocation);
		
		// Use setTimeout to ensure map is fully loaded before applying filters
		setTimeout(() => {
			if (selectedState) updateStateFilter(selectedState);
			if (selectedState && selectedCity) updateCityFilter(selectedState, selectedCity);
		}, 100);
	}

	async function initLayers() {
		await loadMapImages();
		addMapSources();
		addMapLayers();
	}

	async function loadMapImages() {
		const images = [
			{ url: '/map/playground.png', id: 'playground1' },
			{ url: '/map/park1.png', id: 'park1' },
			{ url: '/map/mythmap.png', id: 'mythmap1' },
			{ url: '/map/donut-shop.png', id: 'donut-shop1' },
			{ url: '/map/library.png', id: 'library1' },
			{ url: '/map/museum.png', id: 'museum1' },
			{ url: '/map/farm.png', id: 'farm1' },
			{ url: '/map/hiking-trail.png', id: 'hiking-trail1' },
			{ url: '/map/nasa.png', id: 'nasa1' },
			{ url: '/map/ice-cream-truck.png', id: 'ice-cream-truck1' },
			{ url: '/map/mini-golf.png', id: 'mini-golf1' },
			{ url: '/map/bakery.png', id: 'bakery1' },
			{ url: '/map/brewery.png', id: 'brewery1' },
			{ url: '/map/trampoline-park.png', id: 'trampoline-park1' },
			{ url: '/map/climbing-gym.png', id: 'climbing-gym1' },
			{ url: '/map/lake.png', id: 'lake1' },
			{ url: '/map/nature-preserve.png', id: 'nature-preserve1' },
			{ url: '/map/community-center.png', id: 'community-center1' },
			{ url: '/map/art-studio.png', id: 'art-studio1' },
			{ url: '/map/aquarium.png', id: 'aquarium1' },
			{ url: '/map/splash-pad.png', id: 'splash-pad1' },
			{ url: '/map/train.png', id: 'train1' },
			{ url: '/map/park-with-trails.png', id: 'park-with-trails1' },
			{ url: '/map/park-with-zoo.png', id: 'park-with-zoo1' },
			{ url: '/map/aircraft-observation.png', id: 'aircraft-observation1' }
		];

		await Promise.all(
			images.map(
				(img) =>
					!map.hasImage(img.id) &&
					new Promise((resolve, reject) => {
						map.loadImage(img.url, (error, res) => {
							if (error) {
								console.error('Error loading image:', error);
								reject(error);
							}
							map.addImage(img.id, res);
							resolve(res);
						});
					})
			)
		);
	}

	function addMapSources() {
		if (!map.getSource('shownLocations')) {
			map.addSource('shownLocations', {
				type: 'geojson',
				data: getFeatureCollection(locations),
				cluster: true,
				clusterMaxZoom: 16, // Increased from 14 to allow more zoom before unclustering
				clusterRadius: 40, // Reduced from 50 for tighter clusters
				clusterProperties: {
					// Add cluster properties for better control
					point_count_abbreviated: ["+", ["get", "point_count"]]
				}
			});
		}
	}

	function addMapLayers() {
		const layers = [
			{
				id: 'clusters',
				type: 'circle',
				filter: ['has', 'point_count'],
				paint: {
					'circle-color': [
						'step',
						['get', 'point_count'],
						'#60a5fa', // primary-400 for small clusters
						5,
						'#3b82f6', // primary-500
						10,
						'#2563eb', // primary-600
						25,
						'#1d4ed8', // primary-700
						50,
						'#1e40af'  // primary-800 for large clusters
					],
					'circle-radius': [
						'step',
						['get', 'point_count'],
						18, // smaller initial size
						5,
						22,
						10,
						26,
						25,
						30,
						50,
						35
					],
					'circle-stroke-width': 3,
					'circle-stroke-color': '#ffffff',
					'circle-stroke-opacity': 0.8
				}
			},
			{
				id: 'cluster-count',
				type: 'symbol',
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
			},
			{
				id: 'unclustered-point',
				type: 'symbol',
				filter: ['!', ['has', 'point_count']],
				layout: {
					'icon-image': ['get', 'icon'],
					'icon-size': 0.12,
					'icon-allow-overlap': true
				}
			}
		];

		layers.forEach((layer) => map.addLayer({ ...layer, source: 'shownLocations' }));
	}

	async function updateStateFilter(stateObj: { name: string; abr: string }) {
		const { abr: stateAbbr, name: stateName } = stateObj;
		if (!stateAbbr || !map) return;

		if (_selectedState && _selectedState.abr === stateAbbr) return;

		_selectedState = stateObj;

		try {
			const response = await fetch(
				`https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/0/query?where=&text=${encodeURIComponent(stateName)}&objectIds=&time=&geometry=&geometryType=esriGeometryPolygon&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentsOnly=false&datumTransformation=&parameterValues=&rangeValues=&f=geojson`
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const stateGeoJSON = await response.json();

			if (!stateGeoJSON.features || stateGeoJSON.features.length === 0) {
				throw new Error('No features found for state');
			}

			updateStateLayer(stateGeoJSON);
			if (!selectedCity) removeSelectedCityLayers();

			if (selectedCity) return;

			fitMapToBounds(stateGeoJSON);
			_selectedState = stateObj;
		} catch (error) {
			console.error('Error loading state boundary:', error);
			notifications.warning(`Failed to load boundary for ${stateName}`);
		}
	}

	function updateStateLayer(stateGeoJSON) {
		if (!map.getSource('state-boundary')) {
			map.addSource('state-boundary', { type: 'geojson', data: stateGeoJSON });
			map.addLayer({
				id: 'state-boundary-layer',
				type: 'line',
				source: 'state-boundary',
				paint: { 
					'line-color': '#3b82f6',
					'line-width': 2,
					'line-dasharray': [2, 2],
					'line-opacity': 0.8
				}
			});
		} else {
			(map.getSource('state-boundary') as mapboxgl.GeoJSONSource).setData(stateGeoJSON);
		}
	}

	function removeSelectedCityLayers() {
		['selected-city-layer', 'selected-city-outline'].forEach((layerId) => {
			if (map.getLayer(layerId)) map.removeLayer(layerId);
		});
		if (map.getSource('selected-city')) map.removeSource('selected-city');
	}

	function fitMapToBounds(geoJSON) {
		const bounds = new mapboxgl.LngLatBounds();
		fitBoundsForGeometry(
			geoJSON.type === 'Feature' ? geoJSON.geometry : geoJSON.features[0].geometry,
			bounds
		);
		map.fitBounds(bounds, { 
			padding: 40,
			duration: 1200,
			curve: 1.42
		});
	}

	function fitBoundsForGeometry(geometry: GeoJSON.Geometry, bounds: LngLatBounds) {
		if (geometry.type === 'Polygon') {
			geometry.coordinates[0].forEach((coord) => bounds.extend(coord as [number, number]));
		} else if (geometry.type === 'MultiPolygon') {
			geometry.coordinates.forEach((polygon) => {
				polygon[0].forEach((coord) => bounds.extend(coord as [number, number]));
			});
		}
	}

	async function updateCityFilter(stateName: { abr: string; name: string }, cityName: string) {
		if (!map || !cityName) return;

		if (_selectedCity && _selectedCity === cityName) return;

		try {
			const cityGeoJSON = await loadCityGeoJSON(
				stateName.abr,
				cityName.toLowerCase().replace(/\s+/g, '-')
			);

			if (!cityGeoJSON) {
				throw new Error('No GeoJSON data found for city');
			}

			const cityFeature =
				cityGeoJSON.type === 'FeatureCollection' ? cityGeoJSON.features[0] : cityGeoJSON;

			if (!cityFeature) {
				throw new Error('No valid city feature found');
			}

			updateCityLayer(cityFeature);
			zoomToLocation(cityFeature);
			_selectedCity = cityName;
		} catch (error) {
			console.error('Error loading city GeoJSON:', error);
			notifications.warning(`Failed to load boundary for ${cityName}`);
			// Don't set _selectedCity if there was an error
		}
	}

	async function unselectCityFilter() {
		if (!map) return;

		_selectedCity = null;

		try {
			removeSelectedCityLayers();
		} catch (error) {
			console.error('Error removing selected city GeoJSON:', error);
		}
	}

	function updateCityLayer(cityFeature) {
		if (!map.getSource('selected-city')) {
			map.addSource('selected-city', { type: 'geojson', data: cityFeature });
			addCityLayers();
		} else {
			(map.getSource('selected-city') as mapboxgl.GeoJSONSource).setData(cityFeature);
		}
	}

	function addCityLayers() {
		map.addLayer({
			id: 'selected-city-layer',
			type: 'fill',
			source: 'selected-city',
			paint: { 
				'fill-color': '#3b82f6',
				'fill-opacity': 0.1
			}
		});

		map.addLayer({
			id: 'selected-city-outline',
			type: 'line',
			source: 'selected-city',
			paint: { 
				'line-color': '#2563eb',
				'line-width': 2,
				'line-opacity': 0.9
			}
		});
	}

	function zoomToLocation(feature: GeoJSON.Feature) {
		const bounds = new mapboxgl.LngLatBounds();
		fitBoundsForGeometry(feature.geometry, bounds);
		map.fitBounds(bounds, { 
			padding: 40,
			maxZoom: 14,
			duration: 1000,
			curve: 1.2
		});
	}

	function updateLocations(locations: any[]) {
		if (!map || !map.getSource('shownLocations')) return;

		const source = map.getSource('shownLocations') as mapboxgl.GeoJSONSource;
		if (source) {
			source.setData(getFeatureCollection(locations));
		}
	}

	async function updateCurrentLocation(location: { lat: number; lng: number }) {
	if (!location || !map || !mapboxgl) {
		if (!location && browser) {
			await getCurrentLocation();
		}
		return;
	}

	// Validate coordinates
	if (!location.lat || !location.lng || 
		isNaN(location.lat) || isNaN(location.lng) ||
		Math.abs(location.lat) > 90 || Math.abs(location.lng) > 180) {
		console.error('Invalid coordinates:', location);
		return;
	}

	if (!currentLocationMarker) {
		const el = createMarkerElement();
		currentLocationMarker = new mapboxgl.Marker(el)
			.setLngLat([location.lng, location.lat])
			.setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
				<div class="popup-content">
					<h3 class="popup-title">📍 Your Location</h3>
					<p class="popup-address">You are here</p>
				</div>
			`))
			.addTo(map);
	} else {
		currentLocationMarker.setLngLat([location.lng, location.lat]);
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

	function getFeatureCollection(locations: any[]) {
		return {
			type: 'FeatureCollection',
			features: locations
				.filter((l) => l?.location?.lat && l?.location?.lng) // Only include valid coordinates
				.map((contentLocation, i) => ({
					type: 'Feature',
					properties: {
						latitude: contentLocation.location.lat,
						longitude: contentLocation.location.lng,
						address_line_1: contentLocation.location.address_line_1 || '',
						city: contentLocation.location.city || '',
						state: contentLocation.location.state || '',
						zip_code: contentLocation.location.zip_code || '',
						website: contentLocation.website || '',
						name: contentLocation.location.name || 'Unknown Location',
						id: contentLocation.location.id || i,
						icon: `${getLocationIcon(contentLocation.location.name || 'default')}1`
					},
					geometry: {
						type: 'Point',
						coordinates: [
							Number(contentLocation.location.lng),
							Number(contentLocation.location.lat)
						]
					}
				}))
		};
	}

	function addMapControls() {
		map.addControl(new FullscreenControl(), 'top-right');
		map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
	}

	function addMapEventListeners() {
		map.on('click', 'clusters', handleClusterClick);
		map.on('click', 'unclustered-point', handleUnclusteredPointClick);
		// Add hover effects for better interactivity
		map.on('mouseenter', 'clusters', () => {
			map.getCanvas().style.cursor = 'pointer';
		});
		map.on('mouseleave', 'clusters', () => {
			map.getCanvas().style.cursor = '';
		});
		map.on('mouseenter', 'unclustered-point', () => {
			map.getCanvas().style.cursor = 'pointer';
		});
		map.on('mouseleave', 'unclustered-point', () => {
			map.getCanvas().style.cursor = '';
		});
	}

	function handleClusterClick(e) {
		const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
		const clusterId = features[0].properties.cluster_id;
		const pointCount = features[0].properties.point_count;
		const clusterSource = map.getSource('shownLocations') as mapboxgl.GeoJSONSource;

		// Get the cluster's children to determine optimal zoom
		clusterSource.getClusterChildren(clusterId, (err, children) => {
			if (err) {
				console.error('Error getting cluster children:', err);
				return;
			}

			// If cluster has many points, zoom in more aggressively
			clusterSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
				if (err) return;
				
				// Calculate zoom based on point count for better UX
				let targetZoom = zoom;
				if (pointCount > 50) {
					targetZoom = Math.min(zoom + 2, 16); // Zoom in more for large clusters
				} else if (pointCount > 20) {
					targetZoom = Math.min(zoom + 1.5, 16);
				} else if (pointCount > 10) {
					targetZoom = Math.min(zoom + 1, 16);
				}

				// Smooth animation to cluster center
				map.flyTo({
					center: features[0].geometry.coordinates,
					zoom: targetZoom,
					duration: 500, // Smooth 1.2 second transition
					curve: 1, // Easing curve for smooth acceleration/deceleration
					essential: true // This animation is essential with respect to prefers-reduced-motion
				});
			});
		});
	}

	function handleUnclusteredPointClick(e) {
		if (!e.features || !e.features[0]) return;

		const { properties, geometry } = e.features[0];
		const { name, address_line_1, city, state, zip_code, website } = properties;

		if (!geometry || !geometry.coordinates) return;

		const coordinates = geometry.coordinates.slice();

		// Handle coordinate wrapping
		while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
			coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
		}

		// Smoothly zoom and center on the clicked location
		const currentZoom = map.getZoom();
		if (currentZoom < 15) {
			map.flyTo({
				center: coordinates,
				zoom: 15,
				duration: 500,
				curve: 1.2,
				offset: [0, -100], // Offset to account for popup
				essential: true
			});
		} else {
			// If already zoomed in, just pan to center
			map.panTo(coordinates, {
				duration: 300,
				offset: [0, -100]
			});
		}

		const address =
			`${address_line_1 || ''}, ${city || ''}, ${state || ''} ${zip_code || ''}`.trim();
		const copyId = `copy-${(name || 'location').replace(/\s+/g, '-')}`;
		const detailsLink =
			properties.state && properties.city && properties.name
				? `/locations/states/${properties.state}/${properties.city.replace(/\s+/g, '-')}/${properties.name.replace(/\s+/g, '-')}`
				: '#';

		const websiteButton = website
			? `<a class="popup-btn popup-btn-secondary" href="${website}" target="_blank" rel="noopener noreferrer">
				<svg class="popup-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<path d="M2 12h20"></path>
					<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
				</svg>
				Website
			</a>`
			: '';

		popup
			.setLngLat(coordinates)
			.setHTML(
				`
			<div class="popup-content">
				<h3 class="popup-title">${name || 'Unknown Location'}</h3>
				
				<div class="popup-address-section">
					<div class="popup-address-header">
						<svg class="popup-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
							<circle cx="12" cy="10" r="3"></circle>
						</svg>
						<span class="popup-label">Address</span>
					</div>
					<p class="popup-address">${address}</p>
					<button type="button" id="${copyId}" class="popup-btn popup-btn-copy">
						<svg class="popup-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
							<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
						</svg>
						Copy
					</button>
				</div>
				
				<div class="popup-actions">
					<a class="popup-btn popup-btn-primary" href="${detailsLink}">
						<svg class="popup-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M9 11l3 3L22 4"></path>
							<path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
						</svg>
						View Details
					</a>
					${websiteButton}
				</div>
			</div>
		`
			)
			.addTo(map);

		// Add event listener with error handling
		setTimeout(() => {
			const copyButton = document.getElementById(copyId);
			if (copyButton) {
				copyButton.addEventListener('click', () => {
					if (navigator.clipboard) {
						navigator.clipboard
							.writeText(address)
							.then(() => {
								notifications.info('Address copied to clipboard');
								if (audio) audio.play();
							})
							.catch((err) => {
								console.error('Failed to copy address:', err);
								notifications.warning('Failed to copy address');
							});
					} else {
						// Fallback for older browsers
						notifications.warning('Clipboard not supported');
					}
				});
			}
		}, 100);
	}

	class FullscreenControl {
		private _fullscreen = false;
		private _map: Map;
		private _container: HTMLElement;
		private _button: HTMLButtonElement;
		private _icon: HTMLSpanElement;
		private _originalStyles: { [key: string]: string } = {};

		onAdd(map: Map) {
			this._map = map;
			this._container = document.createElement('div');
			this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
			this._button = document.createElement('button');
			this._button.className = 'fullscreen-button';
			this._icon = document.createElement('span');
			this._icon.className = 'fullscreen-icon';
			this._button.appendChild(this._icon);
			this._container.appendChild(this._button);
			this._button.addEventListener('click', () => this.toggleFullscreen());
			return this._container;
		}

		onRemove() {
			this._container.parentNode.removeChild(this._container);
			this._map = undefined;
		}

		toggleFullscreen() {
			const mapContainer = this._map.getContainer();
			this._fullscreen ? this._exitFullscreen(mapContainer) : this._enterFullscreen(mapContainer);
		}

		private _enterFullscreen(element: HTMLElement) {
			if (element.requestFullscreen) {
				element.requestFullscreen();
			} else if ((element as any).webkitRequestFullscreen) {
				(element as any).webkitRequestFullscreen();
			} else if ((element as any).mozRequestFullScreen) {
				(element as any).mozRequestFullScreen();
			} else if ((element as any).msRequestFullscreen) {
				(element as any).msRequestFullscreen();
			} else {
				this._fallbackFullscreen(element);
			}

			this._fullscreen = true;
			this._updateButtonIcon();
		}

		private _exitFullscreen(element: HTMLElement) {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if ((document as any).webkitExitFullscreen) {
				(document as any).webkitExitFullscreen();
			} else if ((document as any).mozCancelFullScreen) {
				(document as any).mozCancelFullScreen();
			} else if ((document as any).msExitFullscreen) {
				(document as any).msExitFullscreen();
			} else {
				this._fallbackExitFullscreen(element);
			}

			this._fullscreen = false;
			this._updateButtonIcon();
		}

		private _fallbackFullscreen(element: HTMLElement) {
			this._originalStyles = {
				position: element.style.position,
				top: element.style.top,
				left: element.style.left,
				width: element.style.width,
				height: element.style.height,
				zIndex: element.style.zIndex
			};

			element.style.position = 'fixed';
			element.style.top = '0';
			element.style.left = '0';
			element.style.width = '100%';
			element.style.height = '100%';
			element.style.zIndex = '9999';

			setTimeout(() => this._map.resize(), 0);
		}

		private _fallbackExitFullscreen(element: HTMLElement) {
			for (const [prop, value] of Object.entries(this._originalStyles)) {
				element.style[prop] = value;
			}

			setTimeout(() => this._map.resize(), 0);
		}

		private _updateButtonIcon() {
			this._icon.classList.toggle('fullscreen-icon', !this._fullscreen);
			this._icon.classList.toggle('exit-fullscreen-icon', this._fullscreen);
		}
	}

	function optimizeForMobile() {
		if (window.innerWidth < 768) {
			map.scrollZoom.disable();
			map.dragRotate.disable();
			map.touchZoomRotate.disableRotation();
			map.dragPan.disable();
			map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));
		}
	}

	setContext(key, { getMap: () => map });
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
	/* Mapbox popup styling */
	:global(.mapboxgl-popup) {
		font-family: system-ui, -apple-system, sans-serif;
		z-index: 10;
	}

	:global(.mapboxgl-popup-content) {
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
		padding: 0;
		min-width: 280px;
		max-width: 320px;
	}

	:global(.mapboxgl-popup-close-button) {
		font-size: 20px;
		padding: 0.5rem;
		color: #6b7280;
		right: 0;
		top: 0;
	}

	:global(.mapboxgl-popup-close-button:hover) {
		color: #374151;
		background-color: #f3f4f6;
		border-radius: 0 0.75rem 0 0.75rem;
	}

	:global(.mapboxgl-popup-tip) {
		border-top-color: white;
	}

	/* Popup content styling */
	:global(.popup-content) {
		padding: 1.25rem;
	}

	:global(.popup-title) {
		font-size: 1.25rem;
		font-weight: 700;
		color: #111827;
		margin: 0 0 1rem 0;
		line-height: 1.4;
	}

	:global(.popup-address-section) {
		margin-bottom: 1rem;
	}

	:global(.popup-address-header) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	:global(.popup-label) {
		font-size: 0.875rem;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	:global(.popup-address) {
		font-size: 0.875rem;
		color: #374151;
		margin: 0 0 0.75rem 0;
		line-height: 1.5;
	}

	:global(.popup-icon) {
		flex-shrink: 0;
		color: #9ca3af;
	}

	:global(.popup-actions) {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	/* Popup button styles */
	:global(.popup-btn) {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.5rem;
		text-decoration: none;
		transition: all 0.2s;
		cursor: pointer;
		border: 1px solid transparent;
		line-height: 1;
	}

	:global(.popup-btn-primary) {
		background-color: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	:global(.popup-btn-primary:hover) {
		background-color: #2563eb;
		border-color: #2563eb;
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	:global(.popup-btn-secondary) {
		background-color: #f3f4f6;
		color: #374151;
		border-color: #e5e7eb;
	}

	:global(.popup-btn-secondary:hover) {
		background-color: #e5e7eb;
		border-color: #d1d5db;
		transform: translateY(-1px);
	}

	:global(.popup-btn-copy) {
		background-color: white;
		color: #6b7280;
		border: 1px solid #e5e7eb;
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
	}

	:global(.popup-btn-copy:hover) {
		background-color: #f9fafb;
		color: #374151;
		border-color: #d1d5db;
	}

	:global(.popup-btn .popup-icon) {
		color: currentColor;
	}
	/* Fullscreen control styling */
	:global(.mapboxgl-ctrl-group) {
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
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

	.fullscreen-button {
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

	.fullscreen-button:hover {
		background-color: #f3f4f6;
	}

	.fullscreen-icon {
		width: 18px;
		height: 18px;
		position: relative;
	}

	/* Create fullscreen icon with CSS */
	.fullscreen-icon::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border: 2px solid #374151;
		border-radius: 2px;
	}

	.fullscreen-icon::after {
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

	.exit-fullscreen-icon::before {
		content: '';
		position: absolute;
		top: 4px;
		left: 4px;
		width: 10px;
		height: 10px;
		border: 2px solid #374151;
		border-radius: 2px;
	}

	.exit-fullscreen-icon::after {
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
