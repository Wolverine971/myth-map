// src/lib/stores/radarStore.ts
import { writable } from 'svelte/store';
import { DEFAULT_RADAR_LAYERS, type RadarLayer, type RadarResult } from '$lib/types/radar';

export type RadarStatus = 'idle' | 'loading' | 'success' | 'error';

export type RadarState = {
	status: RadarStatus;
	result: RadarResult | null;
	error: string | null;
	lastCenter: { lat: number; lng: number } | null;
	layers: RadarLayer[];
};

export type RadarScanInput = {
	lat: number;
	lng: number;
	ages?: number[];
	layers?: RadarLayer[];
};

const initialState: RadarState = {
	status: 'idle',
	result: null,
	error: null,
	lastCenter: null,
	layers: [...DEFAULT_RADAR_LAYERS]
};

function createRadarStore() {
	const store = writable<RadarState>(initialState);
	let scanId = 0;
	let snapshot = initialState;

	store.subscribe((state) => {
		snapshot = state;
	});

	async function scan(input: RadarScanInput): Promise<RadarResult> {
		const currentScan = ++scanId;
		const layers = input.layers?.length ? input.layers : snapshot.layers;
		store.update((state) => ({
			...state,
			status: 'loading',
			error: null,
			lastCenter: { lat: input.lat, lng: input.lng },
			layers
		}));

		const params = new URLSearchParams({
			lat: String(input.lat),
			lng: String(input.lng),
			minutes: '15,30,60'
		});
		if (input.ages?.length) params.set('ages', input.ages.join(','));
		if (layers.length) params.set('layers', layers.join(','));

		try {
			const response = await fetch(`/api/whats-around?${params.toString()}`);
			if (!response.ok) {
				const message = await response.text();
				throw new Error(message || `Radar scan failed with ${response.status}`);
			}
			const result = (await response.json()) as RadarResult;
			if (currentScan === scanId) {
				store.set({
					status: 'success',
					result,
					error: null,
					lastCenter: result.center,
					layers
				});
			}
			return result;
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Radar scan failed';
			if (currentScan === scanId) {
				store.update((state) => ({
					...state,
					status: 'error',
					error: message
				}));
			}
			throw err;
		}
	}

	function setError(error: string): void {
		store.update((state) => ({ ...state, status: 'error', error }));
	}

	function setLayers(layers: RadarLayer[]): void {
		const next = layers.length ? layers : [...DEFAULT_RADAR_LAYERS];
		store.update((state) => ({ ...state, layers: next }));
	}

	function clear(): void {
		scanId += 1;
		store.set({
			...initialState,
			layers: snapshot.layers
		});
	}

	return {
		subscribe: store.subscribe,
		scan,
		setError,
		setLayers,
		clear
	};
}

export const radarStore = createRadarStore();
