// src/lib/stores/census.ts
import { writable } from 'svelte/store';
import type { CensusResponse } from '$lib/services/census';

interface CensusStore {
    loading: boolean;
    error: string | null;
    data: CensusResponse | null;
    selectedTable: string | null;
}

function createCensusStore() {
    const { subscribe, set, update } = writable<CensusStore>({
        loading: false,
        error: null,
        data: null,
        selectedTable: null
    });

    return {
        subscribe,
        setLoading: (loading: boolean) => update(state => ({ ...state, loading })),
        setError: (error: string | null) => update(state => ({ ...state, error })),
        setData: (data: CensusResponse) => update(state => ({ ...state, data })),
        setSelectedTable: (tableId: string) => update(state => ({ ...state, selectedTable: tableId })),
        reset: () => set({ loading: false, error: null, data: null, selectedTable: null })
    };
}

export const censusStore = createCensusStore();