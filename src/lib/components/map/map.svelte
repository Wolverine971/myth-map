<script>
	import { setContext, onMount } from 'svelte';
	import { mapboxgl, key } from './mapboxgl.ts';
	import 'mapbox-gl/dist/mapbox-gl.css';

	export let locations = [];
	let mapContainer;

	setContext(key, {
		getMap: () => map
	});

	let map;
	onMount(() => {
		initMap();
	});

	const initMap = async (container) => {
		map = new mapboxgl.Map({
			container: mapContainer,
			style: 'mapbox://styles/mapbox/dark-v10',
			center: [80.7421, 20.1336],
			zoom: 3
		});
		const resp = await fetch(
			'https://gist.githubusercontent.com/thedivtagguy/0a07453f2081be9c0f5b6fc2a2681a0f/raw/3c41dbbba93f88a78af1cf13e88443d2eed7d6ec/geodata.geojson'
		);

		const data = await resp.json();

		map.on('load', () => {
			console.log('map loaded');
			// Add a new source from our GeoJSON data and
			// set the 'cluster' option to true. GL-JS will
			// add the point_count property to your source data.
			map.addSource('earthquakes', {
				type: 'geojson',
				// Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
				// from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
				data,
				cluster: true,
				clusterMaxZoom: 14, // Max zoom to cluster points on
				clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
			});

			map.addLayer({
				id: 'clusters',
				type: 'circle',
				source: 'earthquakes',
				filter: ['has', 'point_count'],
				paint: {
					// Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
					// with three steps to implement three types of circles:
					//   * Blue, 20px circles when point count is less than 100
					//   * Yellow, 30px circles when point count is between 100 and 750
					//   * Pink, 40px circles when point count is greater than or equal to 750
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
				source: 'earthquakes',
				filter: ['has', 'point_count'],
				layout: {
					'text-field': '{point_count_abbreviated}',
					'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
					'text-size': 12
				}
			});

			map.addLayer({
				id: 'unclustered-point',
				type: 'circle',
				source: 'earthquakes',
				filter: ['!', ['has', 'point_count']],
				paint: {
					'circle-color': 'green',
					'circle-radius': 4,
					'circle-stroke-width': 1,
					'circle-stroke-color': '#fff'
				}
			});

			// inspect a cluster on click
			map.on('click', 'clusters', (e) => {
				const features = map.queryRenderedFeatures(e.point, {
					layers: ['clusters']
				});
				const clusterId = features[0].properties.cluster_id;

				map.getSource('earthquakes').getClusterExpansionZoom(clusterId, (err, zoom) => {
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
				const coordinates = e.lngLat;

				const mag = e.features[0].properties?.mag || e.features[0].properties?.region;
				const tsunami = e.features[0].properties.tsunami === 1 ? 'yes' : 'no';

				// Ensure that if the map is zoomed out such that
				// multiple copies of the feature are visible, the
				// popup appears over the copy being pointed to.
				while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
					coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
				}
				// while (Math.abs(e.lngLat.lng - coordinates[1]) > 180) {
				// 	coordinates2[1] += e.lngLat.lng > coordinates[1] ? 360 : -360;
				// }

				const popup = new mapboxgl.Popup({ offset: [0, 0] }).setLngLat(coordinates)
					.setHTML(`<div class="popup" style="background-color: #000; color: #fff; padding: 5px; border-radius: 5px;">
                    <br>Magnitude: ${mag}<br> <p>Was there a tsunami?: ${tsunami}</p>
                    </div>`);

				if (popup && map) {
					popup.addTo(map);
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

	// $: if (map) async () => {};
</script>

<div class="map-wrap">
	<div class="map" id="map" bind:this={mapContainer} />
</div>

<style>
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
	.mapboxgl-popup {
		visibility: visible !important;
	}
	.mapboxgl-popup-content {
		background-color: #000;
		color: #fff;
		padding: 5px;
		border-radius: 5px;
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
