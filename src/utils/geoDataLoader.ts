// src/utils/geoDataLoader.ts
// import maryland from '../geographies/cities'
export async function loadCitiesForState(stateAbbr: string) {
	try {
		const indexModule = await import(`../geographies/cities/${stateAbbr.toLowerCase()}/index.json`);
		const cityList = indexModule.default;

		const cityData = await Promise.all(
			cityList.map(async (cityName) => {
				const cityModule = await import(
					`../geographies/cities/${stateAbbr.toLowerCase()}/${cityName}.json`
				);
				return cityModule.default;
			})
		);

		return cityData;
	} catch (error) {
		console.error(`Failed to load cities for state ${stateAbbr}:`, error);
		return [];
	}
}

export async function loadCityGeoJSON(stateAbbr: string, cityName: string) {
	try {
		const cityModule = await import(
			`../geographies/cities/${stateAbbr.toLowerCase()}/${cityName.toLowerCase()}.json`
		);
		const city = cityModule.default;

		return city;
	} catch (error) {
		console.error(`Failed to load cities for state ${stateAbbr}:`, error);
		return [];
	}
}

export async function loadState(stateAbbr: string) {
	try {
		const stateModule = await import(`../geographies/states/${stateAbbr.toLowerCase()}.json`);
		const state = stateModule.default;

		return state;
	} catch (error) {
		console.error(`Failed to load cities for state ${stateAbbr}:`, error);
		return [];
	}
}

/**
 * Load the state outline polygon (FeatureCollection with one Feature) bundled
 * statically under src/geographies/states/boundaries/. Replaces the previous
 * runtime fetch against tigerweb.geo.census.gov.
 */
export async function loadStateBoundary(stateAbbr: string) {
	try {
		const mod = await import(`../geographies/states/boundaries/${stateAbbr.toLowerCase()}.json`);
		return mod.default;
	} catch (error) {
		console.error(`Failed to load boundary for state ${stateAbbr}:`, error);
		return null;
	}
}
export function findState(name: string) {
	const lowercaseName = name.toLowerCase();
	return states.find(
		(s) => s.name.toLowerCase() === lowercaseName || s.abr.toLowerCase() === lowercaseName
	);
}
export function getStateAbbreviation(stateName) {
	const state = states.find((s) => s.name === stateName);
	return state ? state.abr : null;
}

export function getStateName(stateAbbreviation) {
	const state = states.find((s) => s.abr === stateAbbreviation);
	return state ? state.name : null;
}

export const states = [
	{ name: 'District of Columbia', abr: 'DC' },
	{ name: 'Delaware', abr: 'DE' },
	{ name: 'Maryland', abr: 'MD' },
	{ name: 'Virginia', abr: 'VA' }
];
