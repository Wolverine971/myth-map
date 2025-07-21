// src/lib/stores/userPreferencesStore.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { cacheManager, CacheKeys, CacheTTL } from './cacheStore';
import type { FilterState } from '$lib/types/filters';

export interface UserPreferences {
	// Search and filter preferences
	defaultState: { name: string; abr: string } | null;
	defaultCity: string | null;
	preferredTags: string[];
	itemsPerPage: number;
	
	// UI preferences
	defaultView: 'gallery' | 'map';
	theme: 'light' | 'dark' | 'auto';
	
	// Accessibility preferences
	reducedMotion: boolean;
	highContrast: boolean;
	
	// Location and map preferences
	showDistances: boolean;
	distanceUnit: 'miles' | 'kilometers';
	mapZoomLevel: number;
	
	// Notification preferences
	showNotifications: boolean;
	notificationPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const defaultPreferences: UserPreferences = {
	defaultState: { name: 'Maryland', abr: 'MD' },
	defaultCity: null,
	preferredTags: [],
	itemsPerPage: 20,
	defaultView: 'gallery',
	theme: 'light',
	reducedMotion: false,
	highContrast: false,
	showDistances: true,
	distanceUnit: 'miles',
	mapZoomLevel: 10,
	showNotifications: true,
	notificationPosition: 'top-right'
};

class UserPreferencesManager {
	private store = writable<UserPreferences>(defaultPreferences);
	private preferences: UserPreferences = defaultPreferences;

	constructor() {
		if (browser) {
			this.loadPreferences();
			this.setupMediaQueryListeners();
		}
	}

	private loadPreferences() {
		const cached = cacheManager.get<UserPreferences>(CacheKeys.USER_PREFERENCES);
		if (cached) {
			this.preferences = { ...defaultPreferences, ...cached };
			this.store.set(this.preferences);
		}
	}

	private savePreferences() {
		cacheManager.set(CacheKeys.USER_PREFERENCES, this.preferences, CacheTTL.USER_PREFS);
	}

	private setupMediaQueryListeners() {
		// Detect user's motion preference
		const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		if (motionQuery.matches) {
			this.updatePreference('reducedMotion', true);
		}
		motionQuery.addEventListener('change', (e) => {
			this.updatePreference('reducedMotion', e.matches);
		});

		// Detect user's contrast preference
		const contrastQuery = window.matchMedia('(prefers-contrast: high)');
		if (contrastQuery.matches) {
			this.updatePreference('highContrast', true);
		}
		contrastQuery.addEventListener('change', (e) => {
			this.updatePreference('highContrast', e.matches);
		});

		// Detect user's color scheme preference
		const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
		if (this.preferences.theme === 'auto') {
			this.applyTheme(colorSchemeQuery.matches ? 'dark' : 'light');
		}
		colorSchemeQuery.addEventListener('change', (e) => {
			if (this.preferences.theme === 'auto') {
				this.applyTheme(e.matches ? 'dark' : 'light');
			}
		});
	}

	private applyTheme(theme: 'light' | 'dark') {
		if (!browser) return;
		
		if (theme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	updatePreference<K extends keyof UserPreferences>(
		key: K,
		value: UserPreferences[K]
	): void {
		this.preferences = { ...this.preferences, [key]: value };
		this.store.set(this.preferences);
		this.savePreferences();

		// Apply theme changes immediately
		if (key === 'theme') {
			if (value === 'auto') {
				const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				this.applyTheme(prefersDark ? 'dark' : 'light');
			} else {
				this.applyTheme(value as 'light' | 'dark');
			}
		}

		// Apply accessibility changes immediately
		if (key === 'reducedMotion') {
			document.documentElement.style.setProperty(
				'--animation-duration',
				value ? '0ms' : '300ms'
			);
		}
	}

	updatePreferences(updates: Partial<UserPreferences>): void {
		this.preferences = { ...this.preferences, ...updates };
		this.store.set(this.preferences);
		this.savePreferences();

		// Apply any theme or accessibility changes
		if ('theme' in updates) {
			if (updates.theme === 'auto') {
				const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				this.applyTheme(prefersDark ? 'dark' : 'light');
			} else {
				this.applyTheme(updates.theme as 'light' | 'dark');
			}
		}

		if ('reducedMotion' in updates) {
			document.documentElement.style.setProperty(
				'--animation-duration',
				updates.reducedMotion ? '0ms' : '300ms'
			);
		}
	}

	getPreferences(): UserPreferences {
		return this.preferences;
	}

	resetToDefaults(): void {
		this.preferences = { ...defaultPreferences };
		this.store.set(this.preferences);
		this.savePreferences();
		
		// Apply default theme
		this.applyTheme('light');
		document.documentElement.style.setProperty('--animation-duration', '300ms');
	}

	// Export preferences for backup
	exportPreferences(): string {
		return JSON.stringify(this.preferences, null, 2);
	}

	// Import preferences from backup
	importPreferences(preferencesJson: string): boolean {
		try {
			const imported = JSON.parse(preferencesJson);
			const validPreferences = { ...defaultPreferences, ...imported };
			this.updatePreferences(validPreferences);
			return true;
		} catch (error) {
			console.error('Failed to import preferences:', error);
			return false;
		}
	}

	// Get recent search terms and filters (for autocomplete/suggestions)
	getSearchHistory(): string[] {
		const history = cacheManager.get<string[]>('search_history') || [];
		return history.slice(0, 10); // Return last 10 searches
	}

	addSearchTerm(term: string): void {
		if (!term.trim()) return;
		
		const history = this.getSearchHistory();
		const updated = [term, ...history.filter(t => t !== term)].slice(0, 10);
		cacheManager.set('search_history', updated, CacheTTL.USER_PREFS);
	}

	clearSearchHistory(): void {
		cacheManager.delete('search_history');
	}

	// Save current filter state for restoration
	saveFilterState(filterState: FilterState): void {
		cacheManager.set('last_filter_state', filterState, CacheTTL.USER_PREFS);
	}

	// Get last saved filter state
	getLastFilterState(): FilterState | null {
		return cacheManager.get<FilterState>('last_filter_state');
	}

	// Clear saved filter state
	clearFilterState(): void {
		cacheManager.delete('last_filter_state');
	}

	// Check if we should restore filters (e.g., within last 30 minutes)
	shouldRestoreFilters(): boolean {
		const lastState = this.getLastFilterState();
		if (!lastState) return false;
		
		// Check if filter state was saved recently (within 30 minutes)
		const lastActivity = cacheManager.get<number>('last_activity_time');
		if (!lastActivity) return false;
		
		const timeSinceActivity = Date.now() - lastActivity;
		return timeSinceActivity < 30 * 60 * 1000; // 30 minutes
	}

	// Update last activity time
	updateActivityTime(): void {
		cacheManager.set('last_activity_time', Date.now(), CacheTTL.USER_PREFS);
	}

	subscribe = this.store.subscribe;
}

// Create singleton instance
export const userPreferences = new UserPreferencesManager();