import { PUBLIC_MAP_KEY } from '$env/static/public';
import mapboxgl from 'mapbox-gl';

// https://docs.mapbox.com/help/glossary/access-token/
mapboxgl.accessToken = PUBLIC_MAP_KEY

const key = Symbol();

export { mapboxgl, key };