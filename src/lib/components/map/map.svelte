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
				.setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3>Current Location</h3>`))
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
			antialias: false
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
		if (selectedState) updateStateFilter(selectedState);
		if (selectedState && selectedCity) updateCityFilter(selectedState, selectedCity);
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
				clusterMaxZoom: 14,
				clusterRadius: 50
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
						'#51bbd6',
						100,
						'#f1f075',
						750,
						'#f28cb1'
					],
					'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
				}
			},
			{
				id: 'cluster-count',
				type: 'symbol',
				filter: ['has', 'point_count'],
				layout: {
					'text-field': '{point_count_abbreviated}',
					'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
					'text-size': 12,
					'text-allow-overlap': true
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
				paint: { 'line-color': '#627BC1', 'line-width': 2 }
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
		map.fitBounds(bounds, { padding: 20 });
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
			paint: { 'fill-color': '#627BC1', 'fill-opacity': 0.2 }
		});

		map.addLayer({
			id: 'selected-city-outline',
			type: 'line',
			source: 'selected-city',
			paint: { 'line-color': '#627BC1', 'line-width': 2 }
		});
	}

	function zoomToLocation(feature: GeoJSON.Feature) {
		const bounds = new mapboxgl.LngLatBounds();
		fitBoundsForGeometry(feature.geometry, bounds);
		map.fitBounds(bounds, { padding: 20, maxZoom: 15 });
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
			.setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<h3>Current Location</h3>'))
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
		map.on('mouseenter', 'clusters', () => {
			map.getCanvas().style.cursor = 'pointer';
		});
		map.on('mouseleave', 'clusters', () => {
			map.getCanvas().style.cursor = '';
		});
	}

	function handleClusterClick(e) {
		const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
		const clusterId = features[0].properties.cluster_id;

		(map.getSource('shownLocations') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
			clusterId,
			(err, zoom) => {
				if (err) return;
				map.easeTo({
					center: features[0].geometry.coordinates,
					zoom: zoom
				});
			}
		);
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

		const address =
			`${address_line_1 || ''}, ${city || ''}, ${state || ''} ${zip_code || ''}`.trim();
		const copyId = `copy-${(name || 'location').replace(/\s+/g, '-')}`;
		const detailsLink =
			properties.state && properties.city && properties.name
				? `/locations/states/${properties.state}/${properties.city.replace(/\s+/g, '-')}/${properties.name.replace(/\s+/g, '-')}`
				: '#';

		const websiteButton = website
			? `<a style="border-radius: 5px; border: 1px solid #201f1f; padding: 2px 5px; margin: 3px 0; color: white; background: #00000070; font-weight: bold; float: right;" href="${website}" target="_blank">Website</a>`
			: '';

		popup
			.setLngLat(coordinates)
			.setHTML(
				`
			<div style="font-family: system-ui; min-width: 200px;">
				<h1 style="font-size:1.5rem; line-height: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">${name || 'Unknown Location'}</h1>
				<p id="${copyId}-address">
					<b>Address</b>: 
					<button type="button" id="${copyId}" style="border-radius: 5px; border: 1px solid #201f1f; padding: 2px 5px; margin: 3px 0; color: white; background: #00000070; font-weight: bold;">
						Copy Address
					</button>
					<br>${address}
				</p>
				<div style="margin-top: 1rem;">
					${websiteButton}
					<a style="border-radius: 5px; border: 1px solid #201f1f; padding: 2px 5px; margin: 3px 0; color: white; background: #00000070; font-weight: bold; float: right; margin-right: 0.2rem;" href="${detailsLink}">Details</a>
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
	.popups {
		background-color: #000;
		color: #fff;
		border-radius: 5px;
	}

	.popup h1 {
		font-size: 2rem;
		color: aqua;
	}
	.fullscreen-button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 6px;
	}

	.fullscreen-icon {
		background-image: url('path-to-your-fullscreen-icon.svg');
		display: inline-block;
		width: 20px;
		height: 20px;
		background-size: contain;
	}

	.exit-fullscreen-icon {
		background-image: url('path-to-your-exit-fullscreen-icon.svg');
	}
</style>
