<script lang="ts">
	import { setContext, onMount, onDestroy } from 'svelte';
	import { dev } from '$app/environment';
	import { PUBLIC_MAP_KEY } from '$env/static/public';
	import './mapbox.css';
	import { getLocationIcon } from '../../../utils/locationPhotos.js';
	import { getCurrentLocation } from '../../../utils/userLocation';
	import type { Map, Popup, Marker } from 'mapbox-gl';

	export let locations: any[] = [];
	export let shownLocations: any[] = [];
	export let currentLocation: { lat: number; lng: number } | null = null;

	let mapContainer: HTMLElement;
	let map: Map;
	let popup: Popup;
	let currentLocationMarker: Marker;
	let mapboxgl: typeof import('mapbox-gl');

	const key = Symbol();

	onMount(async () => {
		mapboxgl = await import('mapbox-gl');
		await initMap();
	});

	onDestroy(() => {
		if (map) map.remove();
	});

	$: if (map && shownLocations) {
		updateLocations(shownLocations);
	}

	$: mapboxgl && currentLocation, updateCurrentLocation(currentLocation);

	async function initMap() {
		map = new mapboxgl.Map({
			container: mapContainer,
			style: 'mapbox://styles/mapbox/streets-v12',
			center: [-76.7818, 39.2141],
			zoom: 7,
			accessToken: PUBLIC_MAP_KEY
		});

		map.on('load', async () => {
			popup = new mapboxgl.Popup({ offset: [0, 0], className: 'popups' });
			await initLayers();
			addMapControls();
			addMapEventListeners();
		});
	}

	async function initLayers() {
		await loadMapImages();
		addMapSources();
		addMapLayers();
	}

	async function loadMapImages() {
		const images = [
			{ url: 'map/playground.png', id: 'playground1' },
			{ url: 'map/park1.png', id: 'park1' },
			{ url: 'map/mythmap.png', id: 'mythmap1' },
			{ url: 'map/donut-shop.png', id: 'donut-shop1' },
			{ url: 'map/library.png', id: 'library1' },
			{ url: 'map/museum.png', id: 'museum1' },
			{ url: 'map/farm.png', id: 'farm1' },
			{ url: 'map/hiking-trail.png', id: 'hiking-trail1' },
			{ url: 'map/nasa.png', id: 'nasa1' },
			{ url: 'map/ice-cream-truck.png', id: 'ice-cream-truck1' },
			{ url: 'map/mini-golf.png', id: 'mini-golf1' },
			{ url: 'map/bakery.png', id: 'bakery1' },
			{ url: 'map/brewery.png', id: 'brewery1' },
			{ url: 'map/trampoline-park.png', id: 'trampoline-park1' },
			{ url: 'map/climbing-gym.png', id: 'climbing-gym1' },
			{ url: 'map/lake.png', id: 'lake1' },
			{ url: 'map/nature-preserve.png', id: 'nature-preserve1' },
			{ url: 'map/community-center.png', id: 'community-center1' },
			{ url: 'map/art-studio.png', id: 'art-studio1' },
			{ url: 'map/splash-pad.png', id: 'splash-pad1' },
			{ url: 'map/train.png', id: 'train1' },
			{ url: 'map/park-with-trails.png', id: 'park-with-trails1' },
			{ url: 'map/park-with-zoo.png', id: 'park-with-zoo1' },
			{ url: 'map/aircraft-observation.png', id: 'aircraft-observation1' }
		];

		for (const img of images) {
			if (!map.hasImage(img.id)) {
				await new Promise((resolve, reject) => {
					map.loadImage(img.url, (error, res) => {
						if (error) reject(error);
						map.addImage(img.id, res);
						resolve(res);
					});
				});
			}
		}
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
		map.addLayer({
			id: 'clusters',
			type: 'circle',
			source: 'shownLocations',
			filter: ['has', 'point_count'],
			paint: {
				'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
				'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
			}
		});

		map.addLayer({
			id: 'cluster-count',
			type: 'symbol',
			source: 'shownLocations',
			filter: ['has', 'point_count'],
			layout: {
				'text-field': '{point_count_abbreviated}',
				'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
				'text-size': 12,
				'text-allow-overlap': true
			}
		});

		map.addLayer({
			id: 'unclustered-point',
			type: 'symbol',
			source: 'shownLocations',
			filter: ['!', ['has', 'point_count']],
			layout: {
				'icon-image': ['get', 'icon'],
				'icon-size': 0.12,
				'icon-allow-overlap': true
			}
		});
	}

	const addMapControls = () => {
		map.addControl(new FullscreenControl(), 'top-right');
	};

	const addMapEventListeners = () => {
		map.on('click', 'clusters', handleClusterClick);
		map.on('click', 'unclustered-point', handleUnclusteredPointClick);
		map.on('mouseenter', 'clusters', () => {
			map.getCanvas().style.cursor = 'pointer';
		});
		map.on('mouseleave', 'clusters', () => {
			map.getCanvas().style.cursor = '';
		});
	};

	const handleClusterClick = (e) => {
		const features = map.queryRenderedFeatures(e.point, {
			layers: ['clusters']
		});
		const clusterId = features[0].properties.cluster_id;

		map.getSource('shownLocations').getClusterExpansionZoom(clusterId, (err, zoom) => {
			if (err) return;

			map.easeTo({
				center: features[0].geometry.coordinates,
				zoom: zoom
			});
		});
	};

	const handleUnclusteredPointClick = (e) => {
		const coordinates = e.lngLat;

		const name = e.features[0].properties?.name;
		const address = `${e.features[0].properties.address_line_1}, ${e.features[0].properties.city}, ${e.features[0].properties.state} ${e.features[0].properties.zip_code}`;

		// Ensure that if the map is zoomed out such that
		// multiple copies of the feature are visible, the
		// popup appears over the copy being pointed to.
		while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
			coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
		}
		// while (Math.abs(e.lngLat.lng - coordinates[1]) > 180) {
		// 	coordinates2[1] += e.lngLat.lng > coordinates[1] ? 360 : -360;
		// }
		const addressPart1 = address.split(',')[0];
		const addressPart2 = address.split(',').slice(1);

		let copyId = `copy-${name.split(' ').join('-')}`;

		popup
			.setLngLat(coordinates)
			.setHTML(
				`<div>
                    
					<h1 style="font-size:2rem; line-height: 2rem; font-weight: bold;">${name}</h1>
					<br> <p id="${copyId}-address"><b>Address</b>: <button type="button" id="${copyId}" 
					style="border-radius: 5px; border: 1px solid #201f1f;  padding: 2px 5px; margin: 3px 0; color: white; background: #00000070; font-weight: bold;">Copy Address</button>
					
					<br>${addressPart1},<br> ${addressPart2}  </p>
					<br>
					<a style="border-radius: 5px; border: 1px solid #201f1f; padding: 2px 5px; margin: 3px 0; color: white; background: #00000070; font-weight: bold; float: right;" href="${e.features[0].properties.website}" target="_blank">Website</a>
                    </div>`
			)
			.addTo(map);

		document.getElementById(copyId).addEventListener('click', function () {
			navigator.clipboard.writeText(address);
		});
	};

	const updateLocations = (locations: any[]) => {
		const source = map.getSource('shownLocations') as mapboxgl.GeoJSONSource;
		if (source) {
			source.setData(getFeatureCollection(locations));
		}
	};

	async function updateCurrentLocation(location: { lat: number; lng: number }) {
		console.log('updating current location', location);
		if (!location) {
			await getCurrentLocation();
			return;
		}
		if (!mapboxgl) return;

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
					// region: location.region,
					latitude: location.lat,
					longitude: location.lng,
					// scatterLat: location.scatterLat,
					// scatterLong: location.scatterLong,
					// count: location.count,
					address_line_1: location.address_line_1,
					city: location.city,
					state: location.state,
					zip_code: location.zip_code,
					website: location.website,
					name: location.name,
					location: location.location,
					// type: location.type,
					// active: location.active,
					// contact: location.contact,
					// programs: location.programs,
					// keywords: location.keywords,
					id: i,
					icon: `${getLocationIcon(location.name)}1`
				},
				geometry: { type: 'Point', coordinates: [location.lng, location.lat] }
			}))
		};
	}

	class FullscreenControl {
		constructor() {
			this._fullscreen = false;
		}

		onAdd(map) {
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
			if (!this._fullscreen) {
				this._enterFullscreen(mapContainer);
			} else {
				this._exitFullscreen(mapContainer);
			}
		}

		_enterFullscreen(element) {
			if (element.requestFullscreen) {
				element.requestFullscreen();
			} else if (element.mozRequestFullScreen) {
				element.mozRequestFullScreen();
			} else if (element.webkitRequestFullscreen) {
				element.webkitRequestFullscreen();
			} else if (element.msRequestFullscreen) {
				element.msRequestFullscreen();
			} else {
				// Fallback for mobile devices
				this._setMobileFullscreen(element, true);
			}
			this._fullscreen = true;
			this._updateButtonIcon();
		}

		_exitFullscreen(element) {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
			} else {
				// Fallback for mobile devices
				this._setMobileFullscreen(element, false);
			}
			this._fullscreen = false;
			this._updateButtonIcon();
		}

		_setMobileFullscreen(element, fullscreen) {
			if (fullscreen) {
				element.style.position = 'fixed';
				element.style.top = '0';
				element.style.left = '0';
				element.style.width = '100%';
				element.style.height = '100%';
				element.style.zIndex = '9999';
			} else {
				element.style.position = '';
				element.style.top = '';
				element.style.left = '';
				element.style.width = '';
				element.style.height = '';
				element.style.zIndex = '';
			}
			this._map.resize();
		}

		_updateButtonIcon() {
			if (this._fullscreen) {
				this._icon.classList.remove('fullscreen-icon');
				this._icon.classList.add('exit-fullscreen-icon');
			} else {
				this._icon.classList.remove('exit-fullscreen-icon');
				this._icon.classList.add('fullscreen-icon');
			}
		}
	}

	setContext(key, {
		getMap: () => map
	});
</script>

<div class="map-wrap">
	<div class="map" id="map" bind:this={mapContainer}></div>
</div>

<style lang="">
	.map-wrap {
		position: relative;
		z-index: 12343;
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
	.mapboxgl-popup {
		/* visibility: visible !important; */
		background-color: #000;
		color: #fff;
		border-radius: 5px;
	}
	.mapboxgl-popup-content {
		background-color: #03a9f485;
		color: #fff;
		padding: 5px;
		border-radius: 5px;
		overflow-y: scroll;
		overflow-x: scroll;
	}

	.popup h1 {
		font-size: 2rem;
		color: aqua;
	}
</style>
