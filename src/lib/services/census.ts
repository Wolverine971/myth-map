// src/lib/services/census.ts
import type { CensusResponse, TableDataResponse, MetadataResponse } from '../types/census';

class CensusService {
    private baseUrl = 'https://data.census.gov/api';

    private async fetchWithParams(endpoint: string, params?: Record<string, any>): Promise<any> {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    url.searchParams.append(key, value.toString());
                }
            });
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    async search(params: { q: string; size?: number }): Promise<CensusResponse> {
        return this.fetchWithParams('/search', {
            ...params,
            services: 'search:related:featuredresults'
        });
    }

    async getTableData(tableId: string, geographyId: string): Promise<TableDataResponse> {
        // First get the table info
        const tableInfo = await this.fetchWithParams('/search/data/table', {
            id: tableId,
            g: geographyId
        });

        // Then get the actual data
        return this.fetchWithParams('/access/data/table', {
            id: tableId,
            g: geographyId
        });
    }

    async getTableMetadata(tableId: string, geographyId: string): Promise<MetadataResponse> {
        return this.fetchWithParams('/search/metadata/table', {
            id: tableId,
            g: geographyId
        });
    }
}

export const censusService = new CensusService();