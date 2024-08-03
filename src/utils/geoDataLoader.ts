// src/utils/geoDataLoader.ts
// import maryland from '../geographies/cities'
export async function loadCitiesForState(stateAbbr: string) {
    try {
        const indexModule = await import(`../geographies/cities/${stateAbbr.toLowerCase()}/index.json`);
        const cityList = indexModule.default;

        const cityData = await Promise.all(cityList.map(async (cityName) => {
            const cityModule = await import(`../geographies/cities/${stateAbbr.toLowerCase()}/${cityName}.json`);
            return cityModule.default;
        }));

        return cityData;
    } catch (error) {
        console.error(`Failed to load cities for state ${stateAbbr}:`, error);
        return [];
    }
}

export async function loadCityGeoJSON(stateAbbr: string, cityName: string) {
    try {
        const cityModule = await import(`../geographies/cities/${stateAbbr.toLowerCase()}/${cityName.toLowerCase()}.json`);
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

export function getStateAbbreviation(stateName) {
    const state = states.find((s) => s.name === stateName);
    return state ? state.abr : null;
}

export function getStateName(stateAbbreviation) {
    const state = states.find((s) => s.abr === stateAbbreviation);
    return state ? state.name : null;
}

export const states = [
    // { name: 'Alabama', abr: 'AL' },
    // { name: 'Alaska', abr: 'AK' },
    // { name: 'Arizona', abr: 'AZ' },
    // { name: 'Arkansas', abr: 'AR' },
    // { name: 'California', abr: 'CA' },
    // { name: 'Colorado', abr: 'CO' },
    // { name: 'Connecticut', abr: 'CT' },
    // { name: 'Delaware', abr: 'DE' },
    // { name: 'Florida', abr: 'FL' },
    // { name: 'Georgia', abr: 'GA' },
    // { name: 'Hawaii', abr: 'HI' },
    // { name: 'Idaho', abr: 'ID' },
    // { name: 'Illinois', abr: 'IL' },
    // { name: 'Indiana', abr: 'IN' },
    // { name: 'Iowa', abr: 'IA' },
    // { name: 'Kansas', abr: 'KS' },
    // { name: 'Kentucky', abr: 'KY' },
    // { name: 'Louisiana', abr: 'LA' },
    // { name: 'Maine', abr: 'ME' },
    { name: 'Maryland', abr: 'MD' },
    // { name: 'Massachusetts', abr: 'MA' },
    // { name: 'Michigan', abr: 'MI' },
    // { name: 'Minnesota', abr: 'MN' },
    // { name: 'Mississippi', abr: 'MS' },
    // { name: 'Missouri', abr: 'MO' },
    // { name: 'Montana', abr: 'MT' },
    // { name: 'Nebraska', abr: 'NE' },
    // { name: 'Nevada', abr: 'NV' },
    // { name: 'New Hampshire', abr: 'NH' },
    // { name: 'New Jersey', abr: 'NJ' },
    // { name: 'New Mexico', abr: 'NM' },
    // { name: 'New York', abr: 'NY' },
    // { name: 'North Carolina', abr: 'NC' },
    // { name: 'North Dakota', abr: 'ND' },
    // { name: 'Ohio', abr: 'OH' },
    // { name: 'Oklahoma', abr: 'OK' },
    // { name: 'Oregon', abr: 'OR' },
    // { name: 'Pennsylvania', abr: 'PA' },
    // { name: 'Rhode Island', abr: 'RI' },
    // { name: 'South Carolina', abr: 'SC' },
    // { name: 'South Dakota', abr: 'SD' },
    // { name: 'Tennessee', abr: 'TN' },
    // { name: 'Texas', abr: 'TX' },
    // { name: 'Utah', abr: 'UT' },
    // { name: 'Vermont', abr: 'VT' },
    // { name: 'Virginia', abr: 'VA' },
    // { name: 'Washington', abr: 'WA' },
    // { name: 'West Virginia', abr: 'WV' },
    // { name: 'Wisconsin', abr: 'WI' },
    // { name: 'Wyoming', abr: 'WY' },
    { name: 'District of Columbia', abr: 'DC' }
];