// src/lib/types/census.ts

export interface CensusInstance {
    provider: string;
    vintage: string;
    description: string;
    id: string;
    program: string;
    type: string;
    dataset: string;
}

export interface CensusTable {
    instances: CensusInstance[];
    table: string;
    program: string;
}

export interface CensusResponse {
    response: {
        tables: {
            total: number;
            tables: CensusTable[];
        };
        featuredresults?: {
            estimate: string;
            label: string;
            geoName: string;
            dataSource: string;
        };
    };
}

export interface TableDataResponse {
    response: {
        data: any[][];
        dataAPIURI: string;
        objectId: string;
        tableName: string;
        metadataAPIURI: string;
    };
}

export interface MetadataResponse {
    response: {
        metadataContent: {
            title: string;
            dataset: {
                name: string;
                vintage: string;
            };
            measures: Array<{
                id: string;
                label: string;
                unit_type: {
                    unit_type_label: string;
                    id: string;
                };
            }>;
            notes: Array<{
                hidden: boolean;
                content: string;
            }>;
        };
    };
}