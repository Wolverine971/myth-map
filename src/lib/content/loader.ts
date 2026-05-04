// src/lib/content/loader.ts
// Build-time loader for location markdown content. Uses Vite's
// import.meta.glob to inline every markdown file at build, parses frontmatter
// once, and exposes lookup helpers used by routes (entries(), getContent).

import { marked } from 'marked';
import locationsData from '$lib/data/locations.json';
import { parseFrontmatter, type Frontmatter } from './frontmatter';

export type RawLocation = {
	id: number;
	website?: string;
	location: {
		id: number;
		name: string;
		address_line_1?: string;
		address_line_2?: string;
		city?: string;
		state?: string;
		zip_code?: string;
		full_address?: string;
		website?: string;
		type?: string;
		indoor_outdoor?: string;
		price?: string;
		notes?: string;
		lat?: number;
		lng?: number;
	};
};

export type Faq = { question: string; answer: string };

export type LocationEntry = {
	id: number;
	stateSlug: string;
	citySlug: string;
	slug: string;
	frontmatter: Frontmatter;
	body: string;
	bodyHtml: string;
	faqs: Faq[];
	location: RawLocation;
};

export type RouteEntry = {
	state: string;
	city: string;
	slug: string;
};

const LOCATIONS = (locationsData as { locations: RawLocation[] }).locations;
const LOCATIONS_BY_ID = new Map<number, RawLocation>(LOCATIONS.map((l) => [l.id, l]));

const RAW_MARKDOWN = import.meta.glob('./locations/**/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

export function citySlug(city: string): string {
	return city
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/['’`]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function buildIndex(): Map<string, LocationEntry> {
	const out = new Map<string, LocationEntry>();
	for (const [path, raw] of Object.entries(RAW_MARKDOWN)) {
		const { data, body } = parseFrontmatter(raw);
		if (typeof data.id !== 'number' || !data.slug || !data.city || !data.state) {
			console.warn(`[content] skipping ${path}: missing required frontmatter`);
			continue;
		}
		const location = LOCATIONS_BY_ID.get(data.id);
		if (!location) {
			console.warn(`[content] skipping ${path}: id ${data.id} not in locations.json`);
			continue;
		}
		const stateSlug = data.state.toLowerCase();
		const cs = citySlug(data.city);
		const key = `${stateSlug}/${cs}/${data.slug}`;
		const fm = data as Frontmatter;
		const bodyHtml = fm.published ? (marked.parse(body, { async: false }) as string) : '';
		const faqs = fm.published ? extractFaqs(body) : [];
		out.set(key, {
			id: fm.id,
			stateSlug,
			citySlug: cs,
			slug: fm.slug,
			frontmatter: fm,
			body,
			bodyHtml,
			faqs,
			location
		});
	}
	return out;
}

const INDEX = buildIndex();

const INDEX_BY_ID = new Map<number, LocationEntry>([...INDEX.values()].map((e) => [e.id, e]));

export function getEntry(state: string, city: string, slug: string): LocationEntry | null {
	return INDEX.get(`${state.toLowerCase()}/${city}/${slug}`) ?? null;
}

export function getEntryById(id: number): LocationEntry | null {
	return INDEX_BY_ID.get(id) ?? null;
}

export function hrefForId(id: number): string | null {
	const e = INDEX_BY_ID.get(id);
	if (!e) return null;
	return `/locations/${e.stateSlug}/${e.citySlug}/${e.slug}`;
}

export function listEntries(): LocationEntry[] {
	return [...INDEX.values()];
}

export function entriesForCity(stateSlug: string, citySlugValue: string): LocationEntry[] {
	const ss = stateSlug.toLowerCase();
	return [...INDEX.values()].filter((e) => e.stateSlug === ss && e.citySlug === citySlugValue);
}

export function entriesForState(stateSlug: string): LocationEntry[] {
	const ss = stateSlug.toLowerCase();
	return [...INDEX.values()].filter((e) => e.stateSlug === ss);
}

export function citiesInState(
	stateSlug: string
): Array<{ name: string; slug: string; count: number }> {
	const groups = new Map<string, { name: string; count: number }>();
	for (const e of entriesForState(stateSlug)) {
		const existing = groups.get(e.citySlug);
		if (existing) existing.count += 1;
		else groups.set(e.citySlug, { name: e.frontmatter.city, count: 1 });
	}
	return [...groups.entries()]
		.map(([slug, v]) => ({ slug, name: v.name, count: v.count }))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export function statesAvailable(): Array<{ slug: string; abbreviation: string; count: number }> {
	const groups = new Map<string, number>();
	for (const e of INDEX.values()) {
		groups.set(e.stateSlug, (groups.get(e.stateSlug) ?? 0) + 1);
	}
	return [...groups.entries()]
		.map(([slug, count]) => ({ slug, abbreviation: slug.toUpperCase(), count }))
		.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function publishedSlugSet(): Set<string> {
	const out = new Set<string>();
	for (const e of INDEX.values()) {
		if (e.frontmatter.published) out.add(`${e.stateSlug}/${e.citySlug}/${e.slug}`);
	}
	return out;
}

export function routeEntries(): RouteEntry[] {
	return [...INDEX.values()].map((e) => ({
		state: e.stateSlug,
		city: e.citySlug,
		slug: e.slug
	}));
}

export function nearbyEntries(
	entry: LocationEntry,
	limit = 3
): Array<LocationEntry & { distanceMiles: number }> {
	const lat = entry.location.location.lat;
	const lng = entry.location.location.lng;
	if (typeof lat !== 'number' || typeof lng !== 'number') return [];

	const others: Array<LocationEntry & { distanceMiles: number }> = [];
	for (const candidate of INDEX.values()) {
		if (candidate.id === entry.id) continue;
		const cl = candidate.location.location;
		if (typeof cl.lat !== 'number' || typeof cl.lng !== 'number') continue;
		const distanceMiles = haversineMiles(lat, lng, cl.lat, cl.lng);
		others.push({ ...candidate, distanceMiles });
	}
	others.sort((a, b) => a.distanceMiles - b.distanceMiles);
	return others.slice(0, limit);
}

export function pairedEntries(entry: LocationEntry): LocationEntry[] {
	const pairs = entry.frontmatter.pair_with;
	if (!pairs || pairs.length === 0) return [];
	const out: LocationEntry[] = [];
	const seen = new Set<number>([entry.id]);
	for (const raw of pairs) {
		const key = raw.trim().toLowerCase();
		const e = INDEX.get(key);
		if (!e || seen.has(e.id)) continue;
		seen.add(e.id);
		out.push(e);
	}
	return out;
}

function extractFaqs(body: string): Faq[] {
	const headingMatch = body.match(/^##\s+FAQs?\s*$/im);
	if (!headingMatch || headingMatch.index === undefined) return [];
	const after = body.slice(headingMatch.index + headingMatch[0].length);
	const nextHeading = after.match(/^##\s/m);
	const section = nextHeading?.index !== undefined ? after.slice(0, nextHeading.index) : after;

	const faqs: Faq[] = [];
	const re = /\*\*([^*\n][^*]*?\?)\*\*\s*\n+([\s\S]+?)(?=\n\s*\n\s*\*\*|\s*$)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(section)) !== null) {
		const question = m[1].trim();
		const answer = stripInlineMarkdown(m[2].trim());
		if (question && answer) faqs.push({ question, answer });
	}
	return faqs;
}

function stripInlineMarkdown(s: string): string {
	return s
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/\*\*([^*]+)\*\*/g, '$1')
		.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/\s+/g, ' ')
		.trim();
}

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const R = 3958.7613;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}
