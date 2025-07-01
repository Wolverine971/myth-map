// src/utils/lazy.ts
import type { ComponentType } from 'svelte';
import { writable, get } from 'svelte/store';

export function lazy(loadComponent: () => Promise<{ default: ComponentType }>) {
    const componentStore = writable<ComponentType | null>(null);
    let loading = false;

    async function load() {
        if (loading) return;

        const storeValue = get(componentStore);
        if (storeValue) return;

        loading = true;
        try {
            const module = await loadComponent();
            componentStore.set(module.default);
        } catch (error) {
            console.error('Error loading component:', error);
        } finally {
            loading = false;
        }
    }

    return { componentStore, load };
}