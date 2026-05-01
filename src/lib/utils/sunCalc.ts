// src/lib/utils/sunCalc.ts
// Thin wrapper around the suncalc package. Computes whether it is currently
// "night" at a given location — used by the theme system to drive auto dark mode.

import SunCalc from 'suncalc';

export type SunPhase = 'day' | 'night';

/**
 * Returns 'night' when the current time is after sunset or before sunrise
 * for the given lat/lng. Falls back to 'day' if the calculation fails.
 *
 * We treat civil dusk (sun ~6° below horizon) as the switching point so
 * the theme flips when it actually starts feeling dark, not the moment
 * the sun is technically below the horizon.
 */
export function getSunPhase(lat: number, lng: number, now: Date = new Date()): SunPhase {
	try {
		const times = SunCalc.getTimes(now, lat, lng);
		const dusk = times.dusk ?? times.sunset;
		const dawn = times.dawn ?? times.sunrise;

		if (!(dusk instanceof Date) || !(dawn instanceof Date)) return 'day';

		// "Night" is between dusk (today) and dawn (tomorrow), wrapping correctly.
		if (now >= dusk) return 'night';
		if (now < dawn) return 'night';
		return 'day';
	} catch {
		return 'day';
	}
}

/**
 * When (in ms from now) should we next re-check the sun phase?
 * Returns the time until the next dawn or dusk, capped at 1 hour for safety
 * (so geo changes don't leave us stuck in the wrong theme for too long).
 */
export function msUntilNextPhaseChange(lat: number, lng: number, now: Date = new Date()): number {
	const ONE_HOUR = 60 * 60 * 1000;
	try {
		const today = SunCalc.getTimes(now, lat, lng);
		const tomorrow = SunCalc.getTimes(new Date(now.getTime() + 24 * 60 * 60 * 1000), lat, lng);
		const candidates = [today.dawn, today.dusk, tomorrow.dawn, tomorrow.dusk]
			.filter((d): d is Date => d instanceof Date)
			.map((d) => d.getTime() - now.getTime())
			.filter((ms) => ms > 0);
		if (candidates.length === 0) return ONE_HOUR;
		return Math.min(Math.min(...candidates), ONE_HOUR);
	} catch {
		return ONE_HOUR;
	}
}
