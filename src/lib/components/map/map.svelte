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
						id: i
					},
					geometry: { type: 'Point', coordinates: [location.lng, location.lat] }
				};
			})

			// [
			// 	{
			// 		type: 'Feature',
			// 		properties: {
			// 			region: 'Andhra Pradesh',
			// 			latitude: '15.9128998',
			// 			longitude: '79.7399875',
			// 			scatterLat: '15.9128998',
			// 			scatterLong: '79.7399875',
			// 			count: '0',
			// 			name: "Department of Women's Studies, Sri Padmavati Mahila Visvavidyalayam",
			// 			location: 'https://www.spmvv.ac.in/acad.html',
			// 			type: 'Academic Centre',
			// 			active: 'NA',
			// 			contact: '',
			// 			programs:
			// 				"Department Offers an MA, Mphil and Phd in Women's studies. The Key areas of Research are : 1.Gender and Development\r\n2. Women and Health\r\n3. Socio- Economic and Cultural Status of Women\r\n4. Women and Environmental issues\r\n5. Women and HIV / AIDS\r\n6. Violence against Women\r\n7. Empowerment of Women\r\n8. Gender Mainstreaming",
			// 			keywords: 'Education',
			// 			id: 1
			// 		},
			// 		geometry: { type: 'Point', coordinates: ['79.7399875', '15.9128998'] }
			// 	}
			// ]
		};
		console.log(data);

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

				const name = e.features[0].properties?.name;
				const address = `${e.features[0].properties.address} ${e.features[0].properties.city} ${e.features[0].properties.state} ${e.features[0].properties.zip_code}`;

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
                    <br>
					<h1 style="font-size:2rem;">${name}</h1>
					<br> <p>Address: ${address}</p>
					<br>
					<a style="border-radius: 5px; border: 1px solid white; padding:5px; margin: 5px;" href="${e.features[0].properties.website}" target="_blank">Website</a>
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
