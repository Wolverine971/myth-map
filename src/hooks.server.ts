// src/hooks.server.ts
import { redirect, type Handle } from '@sveltejs/kit';

const LOCATIONS_PREFIX = '/locations';
const STATES_PREFIX = '/locations/states';

function slugifyState(s: string): string {
	return s.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function slugifySegment(s: string): string {
	return decodeURIComponent(s)
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/['’`]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function normalizeLocationSegments(segments: string[]): string[] {
	const out: string[] = [];
	if (segments[0]) out.push(slugifyState(segments[0]));
	if (segments[1]) out.push(slugifySegment(segments[1]));
	if (segments[2]) out.push(slugifySegment(segments[2]));
	return out;
}

export const handle: Handle = async ({ event, resolve }) => {
	// NOTE: do not destructure `search` from event.url here — accessing
	// url.search throws on prerendered routes. Read it lazily below.
	const pathname = event.url.pathname;

	// Old `/locations/states/...` URLs → canonical `/locations/...`
	if (
		pathname.toLowerCase().startsWith(STATES_PREFIX + '/') ||
		pathname.toLowerCase() === STATES_PREFIX
	) {
		const rest = pathname.slice(STATES_PREFIX.length).split('/').filter(Boolean);
		const normalized = normalizeLocationSegments(rest);
		const target = LOCATIONS_PREFIX + (normalized.length ? '/' + normalized.join('/') : '');
		throw redirect(301, target + event.url.search);
	}

	// Mixed-case `/locations/<state>[/<city>[/<slug>]]` → lowercase canonical
	if (pathname.startsWith(LOCATIONS_PREFIX + '/')) {
		const rest = pathname.slice(LOCATIONS_PREFIX.length).split('/').filter(Boolean);
		if (rest.length >= 1 && rest.length <= 3) {
			const normalized = normalizeLocationSegments(rest);
			if (normalized.every(Boolean) && normalized.join('/') !== rest.join('/')) {
				throw redirect(301, LOCATIONS_PREFIX + '/' + normalized.join('/') + event.url.search);
			}
		}
	}

	return resolve(event);
};
