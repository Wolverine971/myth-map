// src/utils/geoDataLoader.ts

type BoundaryCollection = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
type GeoJsonModule = { default: unknown };
type GeoJsonLoader = () => Promise<GeoJsonModule>;

// Keep the browser build bounded to geography that the published location
// dataset can actually request. Variable dynamic imports caused Vite to
// enumerate every city boundary in DC/DE/MD/VA (1,193 files).
const CITY_BOUNDARY_LOADERS: Record<string, GeoJsonLoader> = {
	'md/baltimore': () => import('../geographies/cities/md/baltimore.json'),
	'md/boonsboro': () => import('../geographies/cities/md/boonsboro.json'),
	'md/catonsville': () => import('../geographies/cities/md/catonsville.json'),
	'md/columbia': () => import('../geographies/cities/md/columbia.json'),
	'md/edgewater': () => import('../geographies/cities/md/edgewater.json'),
	'md/elkridge': () => import('../geographies/cities/md/elkridge.json'),
	'md/ellicott-city': () => import('../geographies/cities/md/ellicott-city.json'),
	'md/glen-burnie': () => import('../geographies/cities/md/glen-burnie.json'),
	'md/greenbelt': () => import('../geographies/cities/md/greenbelt.json'),
	'md/highland': () => import('../geographies/cities/md/highland.json'),
	'md/jessup': () => import('../geographies/cities/md/jessup.json'),
	'md/laurel': () => import('../geographies/cities/md/laurel.json'),
	'md/lutherville': () => import('../geographies/cities/md/lutherville.json'),
	'md/severn': () => import('../geographies/cities/md/severn.json'),
	'md/severna-park': () => import('../geographies/cities/md/severna-park.json'),
	'md/sykesville': () => import('../geographies/cities/md/sykesville.json')
};

const STATE_BOUNDARY_LOADERS: Record<string, GeoJsonLoader> = {
	dc: () => import('../geographies/states/boundaries/dc.json'),
	de: () => import('../geographies/states/boundaries/de.json'),
	md: () => import('../geographies/states/boundaries/md.json'),
	va: () => import('../geographies/states/boundaries/va.json')
};

export async function loadCityGeoJSON(
	stateAbbr: string,
	cityName: string
): Promise<BoundaryCollection | null> {
	const key = `${stateAbbr.toLowerCase()}/${cityName.toLowerCase()}`;
	const load = CITY_BOUNDARY_LOADERS[key];
	if (!load) return null;

	try {
		return (await load()).default as BoundaryCollection;
	} catch (error) {
		console.error(`Failed to load city boundary for ${key}:`, error);
		return null;
	}
}

export async function loadStateBoundary(stateAbbr: string): Promise<BoundaryCollection | null> {
	const key = stateAbbr.toLowerCase();
	const load = STATE_BOUNDARY_LOADERS[key];
	if (!load) return null;

	try {
		return (await load()).default as BoundaryCollection;
	} catch (error) {
		console.error(`Failed to load state boundary for ${key}:`, error);
		return null;
	}
}

export function findState(name: string) {
	const lowercaseName = name.toLowerCase();
	return states.find(
		(state) =>
			state.name.toLowerCase() === lowercaseName || state.abr.toLowerCase() === lowercaseName
	);
}

export function getStateAbbreviation(stateName: string) {
	const state = states.find((item) => item.name === stateName);
	return state ? state.abr : null;
}

export function getStateName(stateAbbreviation: string) {
	const state = states.find((item) => item.abr === stateAbbreviation);
	return state ? state.name : null;
}

export const states = [
	{ name: 'District of Columbia', abr: 'DC' },
	{ name: 'Delaware', abr: 'DE' },
	{ name: 'Maryland', abr: 'MD' },
	{ name: 'Virginia', abr: 'VA' }
];
