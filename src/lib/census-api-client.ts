interface CensusApiConfig {
    baseUrl: string;
    defaultHeaders: Record<string, string>;
}

interface SearchParams {
    q?: string;
    services?: string;
    size?: number;
    facets?: string;
}

interface TypeaheadRequest {
    text: string;
}

export class CensusApiClient {
    private config: CensusApiConfig;

    constructor() {
        this.config = {
            baseUrl: 'https://data.census.gov/api',
            defaultHeaders: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
            }
        };
    }

    private async fetchWithParams(endpoint: string, params?: Record<string, any>): Promise<any> {
        const url = new URL(`${this.config.baseUrl}${endpoint}`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    url.searchParams.append(key, value.toString());
                }
            });
        }

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: this.config.defaultHeaders,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    private async postRequest(endpoint: string, data: any): Promise<any> {
        try {
            const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    ...this.config.defaultHeaders,
                    'content-type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Search endpoints
    async searchWithRelatedResults(params: SearchParams) {
        return this.fetchWithParams('/search', {
            ...params,
            services: 'search:related:featuredresults',
        });
    }

    async searchEntities(params: SearchParams) {
        return this.fetchWithParams('/search', {
            ...params,
            services: 'entities',
        });
    }

    async searchFacets(facetType: string) {
        return this.fetchWithParams('/search', {
            facets: facetType,
            services: 'facets',
        });
    }

    // Geography endpoints
    async getGeographyEntityTypes() {
        return this.fetchWithParams('/explore/facets/geos/entityTypes');
    }

    // Typeahead endpoint
    async getTypeaheadSuggestions(text: string) {
        return this.postRequest('/typeahead', {
            request: { text }
        });
    }

    // Profile endpoints
    async getProfileMetadata(geoId: string, includeHighlights: boolean = false) {
        return this.fetchWithParams('/profile/metadata', {
            g: geoId,
            includeHighlights
        });
    }

    // Table data endpoints
    async getTableData(tableId: string) {
        return this.fetchWithParams('/search/data/table', {
            id: tableId
        });
    }

    // Map data endpoints
    async getMapData(type: string = 'color') {
        return this.fetchWithParams('/mapdata/basemap', {
            type
        });
    }
}
