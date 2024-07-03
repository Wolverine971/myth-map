<script lang="ts">
	import { setContext, onMount } from 'svelte';

	import { dev } from '$app/environment';
	import { mapboxgl, key } from './mapboxgl.ts';
	import './mapbox.css';

	export let locations = [];

	export let shownLocations = [];
	export let currentLocation = null;
	let mapContainer;
	let map;
	onMount(async () => {
		await initMap();
	});

	$: shownLocations, showLocations();

	$: currentLocation, showCurrentLocation();

	const showCurrentLocation = async () => {
		if (!map || !currentLocation?.lat) return;

		const el = document.createElement('div');
		const width = 20;
		const height = 20;
		el.className = 'marker';
		if (dev) {
			el.style.backgroundImage = `url(http://localhost:5173/map/location-arrow.svg)`;
		} else {
			el.style.backgroundImage = `url(https://mythmap.vercel.app/map/location-arrow.svg)`;
		}
		el.style.width = `${width}px`;
		el.style.height = `${height}px`;
		el.style.backgroundSize = '100%';

		const marker = new mapboxgl.Marker(el).setLngLat(currentLocation).setPopup(
			new mapboxgl.Popup({ offset: 25 }) // add popups
				.setHTML(`<h3>Current Location</h3>`)
		);

		marker.addTo(map);
	};

	const showLocations = async () => {
		if (!map) return;

		const data = {
			type: 'FeatureCollection',
			crs: {
				type: 'name',
				properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
			},
			features: shownLocations?.map((location, i) => {
				return {
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
						id: i
					},
					geometry: { type: 'Point', coordinates: [location.lng, location.lat] }
				};
			})
		};

		const source = map?.getSource('shownLocations');
		if (source) {
			map.getSource('shownLocations').setData(data);
		}
	};

	setContext(key, {
		getMap: () => map
	});

	const getIcon = (name: string) => {
		const lowerCaseName = name.toLowerCase();
		if (lowerCaseName.includes('playground')) {
			return 'playground1';
		} else if (lowerCaseName.includes('park')) {
			return 'park1';
		} else if (lowerCaseName.includes('library')) {
			return 'library1';
		} else if (lowerCaseName.includes('museum')) {
			return 'museum1';
		}

		return 'mythmap1';
	};

	const initLayers = async (data: any) => {
		if (!map) return;

		// 		map.eachLayer(function (layer) {
		//     map.removeLayer(layer);
		// });

		const images = [
			{ url: 'map/playground.PNG', id: 'playground1' },
			{ url: 'map/park.png', id: 'park1' },
			{ url: 'map/mythmap.png', id: 'mythmap1' },
			{ url: 'map/library.png', id: 'library1' },
			{ url: 'map/museum.png', id: 'museum1' }
		];

		Promise.all(
			images.map(
				(img) =>
					new Promise((resolve, reject) => {
						map.loadImage(img.url, function (error, res) {
							map.addImage(img.id, res);
							resolve(res);
						});
					})
			)
		).then(() => {
			map.addSource('shownLocations', {
				type: 'geojson',
				// Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
				// from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
				data,
				cluster: true,
				clusterMaxZoom: 14, // Max zoom to cluster points on
				clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
				clusterProperties: {}
			});

			map.addLayer({
				id: 'clusters',
				type: 'circle',
				source: 'shownLocations',
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
					'icon-size': 0.15,
					'icon-allow-overlap': true,
					'icon-halo-color': 'black',
					'icon-halo-width': 10,
					'iconhalo-blur': 1,
					'text-color': 'black',
					'text-halo-color': 'white',
					'text-halo-width': 2,
					'text-halo-blur': 1
				}
			});
		});
	};

	const initMap = async () => {
		map = new mapboxgl.Map({
			container: mapContainer,
			style: 'mapbox://styles/mapbox/outdoors-v12', //'mapbox://styles/mapbox/dark-v10',
			center: [-76.7818, 39.2141],
			zoom: 7
		});

		const data = {
			type: 'FeatureCollection',
			crs: {
				type: 'name',
				properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
			},
			features: locations?.map((location, i) => {
				return {
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
						icon: getIcon(location.name)
					},
					geometry: { type: 'Point', coordinates: [location.lng, location.lat] }
				};
			})
		};

		map.on('load', async () => {
			console.log('map loaded');
			// Add a new source from our GeoJSON data and
			// set the 'cluster' option to true. GL-JS will
			// add the point_count property to your source data.
			await initLayers(data);

			// inspect a cluster on click
			map.on('click', 'clusters', (e) => {
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
			});

			// When a click event occurs on a feature in
			// the unclustered-point layer, open a popup at
			// the location of the feature, with
			// description HTML from its properties.
			map.on('click', (e) => {
				console.log(e.lngLat);
			});
			map.on('click', 'unclustered-point', (e) => {
				console.log(e);
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

				console.log(e.features[0].properties);

				let copyId = `copy-${name.split(' ').join('-')}`;
				const popup = new mapboxgl.Popup({ offset: [0, 0], className: 'popups' }).setLngLat(
					coordinates
				).setHTML(`<div>
                    
					<h1 style="font-size:2rem; line-height: 2rem;">${name}</h1>
					<br> <p id="${copyId}-address"><b>Address</b>: <br>${address} <button type="button" id="${copyId}" 
					style="border-radius: 5px; border: 1px solid white; padding: 3px; margin: 3px 0;">Copy Address</button></p>
					<br>
					<a style="border-radius: 5px; border: 1px solid white; padding: 5px; margin: 5px 0; float: right;" href="${e.features[0].properties.website}" target="_blank">Website</a>
                    </div>`);

				if (popup && map) {
					popup.addTo(map);

					document.getElementById(copyId).addEventListener('click', function () {
						navigator.clipboard.writeText(address);
					});
				}
			});

			map.on('mouseenter', 'clusters', () => {
				map.getCanvas().style.cursor = 'pointer';
			});
			map.on('mouseleave', 'clusters', () => {
				map.getCanvas().style.cursor = '';
			});
		});
	};
	const copyText = (data) => {
		console.log('copying', data);
	};

	// $: if (map) async () => {};
</script>

<div class="map-wrap">
	<div class="map" id="map" bind:this={mapContainer} />
</div>

<style lang="">
	.mapboxgl-popup-content {
		color: #f3f3dd;
		background-color: #91785d;
		border-color: #91785d;
		max-width: 250px;
		box-shadow: 3px 3px 2px #8b5d33;
		font-family: 'Oswald';
	}

	.map-wrap {
		position: relative;
		z-index: 12343;
		width: 100%;
		height: 100%;
	}
	.map {
		position: absolute;
		width: 100%;
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
		background-color: #000;
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

	/* div {
		position: absolute;
		height: 500px;
		width: 1000px;
	} */
</style>
