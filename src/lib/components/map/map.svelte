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

	$: if (map && mapboxgl) {
		if (shownLocations) updateLocations(shownLocations);
		if (currentLocation) updateCurrentLocation(currentLocation);
		if (selectedState) updateStateFilter(selectedState);
		if (selectedState && selectedCity) updateCityFilter(selectedState, selectedCity);
	}

	$: currentLocation, showCurrentLocation();

	const showCurrentLocation = async () => {
		if (!currentLocation?.lat && browser) {
			await getCurrentLocation();
		}

		if (!map || !mapboxgl?.Marker) {
			setTimeout(() => {
				showCurrentLocation();
			}, 1000);
		}

		const el = document.createElement('div');
		const width = 30;
		const height = 30;
		if (el && mapboxgl) {
			el.className = 'marker';

			el.style.backgroundImage = `url(/map/location-arrow.svg)`;

			el.style.width = `${width}px`;
			el.style.height = `${height}px`;
			el.style.backgroundSize = '100%';

			const marker = new mapboxgl.Marker(el).setLngLat(currentLocation).setPopup(
				new mapboxgl.Popup({ offset: 25 }) // add popups
					.setHTML(`<h3>Current Location</h3>`)
			);

			marker.addTo(map);
		}
	};

	onMount(async () => {
		mapboxgl = await import('mapbox-gl');
		await initMap();
	});

	onDestroy(() => {
		if (map) map.remove();
	});

	async function initMap() {
		map = new mapboxgl.Map({
			container: mapContainer,
			style: 'mapbox://styles/mapbox/streets-v12',
			center: [-76.7818, 39.2141],
			zoom: 7,
			accessToken: PUBLIC_MAP_KEY
		});

		map.on('load', async () => {
			try {
				popup = new mapboxgl.Popup({ offset: [0, 0], className: 'popups' });
				await initLayers();
				updateMapState();
				addMapControls();
				addMapEventListeners();
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

		try {
			const stateGeoJSON = await fetch(
				`https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/0/query?where=&text=${stateName}&objectIds=&time=&geometry=&geometryType=esriGeometryPolygon&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentsOnly=false&datumTransformation=&parameterValues=&rangeValues=&f=geojson`
			).then((res) => res.json());

			updateStateLayer(stateGeoJSON);
			if (!selectedCity) removeSelectedCityLayers();

			if (selectedCity) return;

			fitMapToBounds(stateGeoJSON);
			_selectedState = stateObj;
		} catch (error) {
			console.error('Error loading state boundary:', error);
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
		if (!map) return;

		if (_selectedCity && _selectedCity === cityName) return;

		try {
			const cityGeoJSON = await loadCityGeoJSON(
				stateName.abr,
				cityName.toLowerCase().replace(' ', '-')
			);
			const cityFeature =
				cityGeoJSON.type === 'FeatureCollection' ? cityGeoJSON.features[0] : cityGeoJSON;

			updateCityLayer(cityFeature);
			zoomToLocation(cityFeature);
			_selectedCity = cityName;
		} catch (error) {
			console.error('Error loading city GeoJSON:', error);
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

		if (!currentLocationMarker) {
			const el = createMarkerElement();
			currentLocationMarker = new mapboxgl.Marker(el)
				.setLngLat(location)
				.setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<h3>Current Location</h3>'))
				.addTo(map);
		} else {
			currentLocationMarker.setLngLat(location);
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
			features: locations.map((location, i) => ({
				type: 'Feature',
				properties: {
					latitude: location.lat,
					longitude: location.lng,
					address_line_1: location.address_line_1,
					city: location.city,
					state: location.state,
					zip_code: location.zip_code,
					website: location.website,
					name: location.name,
					location: location.location,
					id: i,
					icon: `${getLocationIcon(location.name)}1`
				},
				geometry: { type: 'Point', coordinates: [location.lng, location.lat] }
			}))
		};
	}

	function addMapControls() {
		map.addControl(new FullscreenControl(), 'top-right');
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

		map.getSource('shownLocations').getClusterExpansionZoom(clusterId, (err, zoom) => {
			if (err) return;
			map.easeTo({
				center: features[0].geometry.coordinates,
				zoom: zoom
			});
		});
	}

	function handleUnclusteredPointClick(e) {
		const { properties, geometry } = e.features[0];
		const { name, address_line_1, city, state, zip_code, website } = properties;
		const coordinates = geometry.coordinates.slice();

		while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
			coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
		}

		const address = `${address_line_1}, ${city}, ${state} ${zip_code}`;
		const copyId = `copy-${name.split(' ').join('-')}`;
		const detailsLink =
			`/locations/states/${properties.state}/${properties.city}/${properties.name}`.replace(
				/\s/g,
				'-'
			);

		popup
			.setLngLat(coordinates)
			.setHTML(
				`
				<div style="font-family: system-ui;">
					<h1 style="font-size:2rem; line-height: 2rem; font-weight: bold;">${name}</h1>
					<br>
					<p id="${copyId}-address">
						<b>Address</b>: 
						<button type="button" id="${copyId}" style="border-radius: 5px; border: 1px solid #201f1f;  padding: 2px 5px; margin: 3px 0; color: white; background: #00000070; font-weight: bold;">
							Copy Address
						</button>
						<br>${address_line_1},<br> ${city}, ${state} ${zip_code}
					</p>
					<br>
					<a style="border-radius: 5px; border: 1px solid #201f1f; padding: 2px 5px; margin: 3px 0; color: white; background: #00000070; font-weight: bold; float: right;" href="${website}" target="_blank">Website</a>
					<a style="border-radius: 5px; border: 1px solid #201f1f; padding: 2px 5px; margin: 3px 0; color: white; background: #00000070; font-weight: bold; float: right; margin-right: 0.2rem;" href="${detailsLink}">Details</a>
				</div>
			`
			)
			.addTo(map);

		document.getElementById(copyId).addEventListener('click', () => {
			navigator.clipboard.writeText(address);
			notifications.info('Address copied to clipboard');
			audio.play();
		});
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

	setContext(key, { getMap: () => map });
</script>

<div class="map-wrap">
	<div class="map" id="map" bind:this={mapContainer}></div>
</div>

<style lang="">
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
