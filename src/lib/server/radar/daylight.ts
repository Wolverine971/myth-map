// src/lib/server/radar/daylight.ts
import SunCalc from 'suncalc';

export type DaylightResult = {
	daylightRemainingMin: number;
	sunsetAt: string | null;
};

export function getDaylight(lat: number, lng: number, now = new Date()): DaylightResult {
	const times = SunCalc.getTimes(now, lat, lng);
	const sunset = times.sunset;
	const sunsetAt = Number.isNaN(sunset.getTime()) ? null : sunset.toISOString();
	const daylightRemainingMin = sunsetAt
		? Math.max(0, Math.round((sunset.getTime() - now.getTime()) / 60000))
		: 0;

	return {
		daylightRemainingMin,
		sunsetAt
	};
}
