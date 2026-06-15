// src/lib/server/radar/nws.ts
import { RADAR_USER_AGENT } from './config';
import { getRadarCache, RadarCacheTTL, setRadarCache } from './cache';

export type WeatherResult = {
	tempF: number | null;
	summary: string;
	isWet: boolean;
	isHot: boolean;
	isCold: boolean;
	alerts: string[];
};

type NwsPointResponse = {
	properties?: {
		forecast?: string;
		forecastHourly?: string;
	};
};

type NwsForecastResponse = {
	properties?: {
		periods?: Array<{
			startTime?: string;
			endTime?: string;
			temperature?: number;
			shortForecast?: string;
		}>;
	};
};

type NwsAlertResponse = {
	features?: Array<{
		properties?: {
			event?: string;
			headline?: string;
		};
	}>;
};

const WET_RE = /\b(rain|drizzle|shower|storm|thunder|snow|sleet|ice|wintry|precip)\b/i;

export async function fetchWeather(
	lat: number,
	lng: number,
	signal: AbortSignal
): Promise<WeatherResult> {
	const cacheKey = `nws:${lat.toFixed(2)}:${lng.toFixed(2)}`;
	const cached = getRadarCache<WeatherResult>(cacheKey);
	if (cached) return cached;

	const point = await fetchJson<NwsPointResponse>(
		`https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`,
		signal
	);
	const forecastUrl = point.properties?.forecastHourly || point.properties?.forecast;
	if (!forecastUrl) throw new Error('NWS point response did not include a forecast URL');

	const [forecast, alerts] = await Promise.all([
		fetchJson<NwsForecastResponse>(forecastUrl, signal),
		fetchJson<NwsAlertResponse>(
			`https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lng.toFixed(4)}`,
			signal
		)
	]);

	const now = Date.now();
	const periods = forecast.properties?.periods ?? [];
	const current =
		periods.find((period) => {
			const start = period.startTime ? Date.parse(period.startTime) : Number.NaN;
			const end = period.endTime ? Date.parse(period.endTime) : Number.NaN;
			return Number.isFinite(start) && Number.isFinite(end) && start <= now && now <= end;
		}) ?? periods[0];

	const tempF = typeof current?.temperature === 'number' ? current.temperature : null;
	const summary = current?.shortForecast || 'Conditions unavailable';
	const alertNames = (alerts.features ?? [])
		.map((feature) => feature.properties?.event || feature.properties?.headline)
		.filter(Boolean)
		.slice(0, 3) as string[];

	const result = {
		tempF,
		summary,
		isWet: WET_RE.test(summary),
		isHot: tempF != null && tempF >= 85,
		isCold: tempF != null && tempF < 45,
		alerts: alertNames
	};

	setRadarCache(cacheKey, result, RadarCacheTTL.nwsForecast);
	return result;
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
	const response = await fetch(url, {
		signal,
		headers: {
			Accept: 'application/geo+json, application/json',
			'User-Agent': RADAR_USER_AGENT
		}
	});
	if (!response.ok) throw new Error(`NWS request failed with ${response.status}`);
	return (await response.json()) as T;
}
