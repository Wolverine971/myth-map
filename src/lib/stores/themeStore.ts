// src/lib/stores/themeStore.ts
// Sunset-aware theme system per docs/design-system.md §5.
// Three states: 'light' | 'dark' | 'auto'.
// Resolution order:
//   1. Explicit user choice (light or dark)
//   2. If 'auto' + geolocation available: sunset/sunrise via suncalc
//   3. If 'auto' + no geolocation: prefers-color-scheme
// Effective theme is cached in localStorage so first paint after page reload
// is correct (see src/app.html bootstrap script).

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { currentLocation } from './locationStore';
import { getSunPhase, msUntilNextPhaseChange } from '$lib/utils/sunCalc';

export type ThemePref = 'light' | 'dark' | 'auto';
export type EffectiveTheme = 'light' | 'dark';

const STORAGE_KEY_PREF = 'tta-theme';
const STORAGE_KEY_EFFECTIVE = 'tta-effective-theme';

function readStoredPref(): ThemePref {
	if (!browser) return 'auto';
	const v = localStorage.getItem(STORAGE_KEY_PREF);
	if (v === 'light' || v === 'dark' || v === 'auto') return v;
	return 'auto';
}

export const themePref = writable<ThemePref>(readStoredPref());

// OS preference — kept in sync via media query.
const osPrefersDark = writable<boolean>(
	browser ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
);

if (browser) {
	const mq = window.matchMedia('(prefers-color-scheme: dark)');
	mq.addEventListener('change', (e) => osPrefersDark.set(e.matches));
}

// Re-render trigger so effective theme reactively updates as time passes.
const tick = writable(0);
let nextTickTimeout: ReturnType<typeof setTimeout> | null = null;

function scheduleNextTick() {
	if (!browser) return;
	if (nextTickTimeout) clearTimeout(nextTickTimeout);

	const loc = get(currentLocation);
	let delay = 60 * 60 * 1000; // 1h default
	if (loc) {
		delay = Math.max(60 * 1000, msUntilNextPhaseChange(loc.lat, loc.lng));
	}
	nextTickTimeout = setTimeout(() => {
		tick.update((n) => n + 1);
		scheduleNextTick();
	}, delay);
}

if (browser) {
	scheduleNextTick();
	// Re-schedule when geolocation arrives or changes.
	currentLocation.subscribe(() => scheduleNextTick());
}

// The effective theme — what's actually applied to <html>.
export const effectiveTheme = derived(
	[themePref, osPrefersDark, currentLocation, tick],
	([$pref, $osDark, $loc]): EffectiveTheme => {
		if ($pref === 'light' || $pref === 'dark') return $pref;

		// auto:
		if ($loc) {
			return getSunPhase($loc.lat, $loc.lng) === 'night' ? 'dark' : 'light';
		}
		return $osDark ? 'dark' : 'light';
	}
);

// Apply to DOM + persist whenever the effective theme changes.
if (browser) {
	effectiveTheme.subscribe(($effective) => {
		if ($effective === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
		try {
			localStorage.setItem(STORAGE_KEY_EFFECTIVE, $effective);
		} catch {
			/* ignore */
		}
	});

	themePref.subscribe(($pref) => {
		try {
			localStorage.setItem(STORAGE_KEY_PREF, $pref);
		} catch {
			/* ignore */
		}
	});
}

/** Cycle through light → dark → auto → light. */
export function cycleTheme(): void {
	themePref.update((cur) => (cur === 'light' ? 'dark' : cur === 'dark' ? 'auto' : 'light'));
}

export function setTheme(pref: ThemePref): void {
	themePref.set(pref);
}
