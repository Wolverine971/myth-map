// src/lib/content/frontmatter.ts
// Pure frontmatter parser/serializer for our location markdown files. Used by
// both the runtime loader and the Node sync/status scripts. No fs, no Node-only
// APIs — safe to import anywhere.

export type AccessLevel = 'yes' | 'partial' | 'no';
export type NoiseLevel = 'quiet' | 'moderate' | 'loud';
export type SensoryLoad = 'low' | 'moderate' | 'high';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export type Frontmatter = {
	id: number;
	slug: string;
	name: string;
	city: string;
	state: string;
	seeded_at: string;
	last_modified: string;
	published: boolean;
	published_at: string | null;

	// Operational verification — separate from last_modified so editorial
	// touch-ups don't reset the trust signal. Update only when hours, prices,
	// parking, etc. have been re-checked.
	verified_at?: string | null;

	// Accessibility & sensory.
	stroller_friendly?: AccessLevel;
	wheelchair_accessible?: AccessLevel;
	nursing_room?: boolean;
	changing_table?: boolean;
	noise_level?: NoiseLevel;
	sensory_load?: SensoryLoad;

	// Season & weather suitability.
	season_best?: Season[];
	rainy_day_ok?: boolean;
	hot_day_ok?: boolean;
	cold_day_ok?: boolean;

	// Curated pairings — array of "state/city-slug/slug" keys from the loader
	// index. Used to surface "pair with" suggestions on the page.
	pair_with?: string[];
};

const REQUIRED_FM_KEYS: ReadonlyArray<keyof Frontmatter> = [
	'id',
	'slug',
	'name',
	'city',
	'state',
	'seeded_at',
	'last_modified',
	'published',
	'published_at'
];

const OPTIONAL_FM_KEYS: ReadonlyArray<keyof Frontmatter> = [
	'verified_at',
	'stroller_friendly',
	'wheelchair_accessible',
	'nursing_room',
	'changing_table',
	'noise_level',
	'sensory_load',
	'season_best',
	'rainy_day_ok',
	'hot_day_ok',
	'cold_day_ok',
	'pair_with'
];

export const FM_KEYS: ReadonlyArray<keyof Frontmatter> = [...REQUIRED_FM_KEYS, ...OPTIONAL_FM_KEYS];

function unquote(value: string): string {
	const trimmed = value.trim();
	if (trimmed.length >= 2 && trimmed[0] === '"' && trimmed[trimmed.length - 1] === '"') {
		return trimmed.slice(1, -1).replace(/\\"/g, '"');
	}
	return trimmed;
}

type ScalarValue = string | number | boolean | null | string[];

function parseScalar(raw: string): ScalarValue {
	const v = raw.trim();
	if (v === 'null' || v === '') return null;
	if (v === 'true') return true;
	if (v === 'false') return false;
	if (/^-?\d+$/.test(v)) return Number(v);
	if (v.startsWith('[') && v.endsWith(']')) {
		const inner = v.slice(1, -1).trim();
		if (!inner) return [];
		return inner
			.split(',')
			.map((s) => unquote(s))
			.filter((s) => s.length > 0);
	}
	return unquote(v);
}

export function parseFrontmatter(source: string): {
	data: Partial<Frontmatter>;
	body: string;
} {
	if (!source.startsWith('---')) return { data: {}, body: source };
	const end = source.indexOf('\n---', 3);
	if (end === -1) return { data: {}, body: source };
	const header = source.slice(3, end).replace(/^\n/, '');
	const body = source.slice(end + 4).replace(/^\n/, '');
	const data: Record<string, unknown> = {};
	for (const line of header.split('\n')) {
		if (!line.trim() || line.trim().startsWith('#')) continue;
		const colon = line.indexOf(':');
		if (colon === -1) continue;
		const key = line.slice(0, colon).trim();
		const value = line.slice(colon + 1);
		data[key] = parseScalar(value);
	}
	return { data: data as Partial<Frontmatter>, body };
}

function serializeValue(value: unknown): string {
	if (value === null) return 'null';
	if (Array.isArray(value)) {
		return `[${value.map((v) => serializeValue(v)).join(', ')}]`;
	}
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	if (typeof value === 'number') return String(value);
	const s = String(value);
	if (/[:#"\n,[\]]/.test(s) || s.trim() !== s) {
		return `"${s.replace(/"/g, '\\"')}"`;
	}
	return s;
}

export function serializeFrontmatter(data: Frontmatter, body: string): string {
	const lines = ['---'];
	for (const key of FM_KEYS) {
		const value = data[key];
		if (value === undefined) continue;
		lines.push(`${key}: ${serializeValue(value)}`);
	}
	lines.push('---', '');
	const trimmedBody = body.startsWith('\n') ? body.slice(1) : body;
	return `${lines.join('\n')}\n${trimmedBody}`;
}

export function isFullFrontmatter(data: Partial<Frontmatter>): data is Frontmatter {
	return (
		typeof data.id === 'number' &&
		typeof data.slug === 'string' &&
		typeof data.name === 'string' &&
		typeof data.city === 'string' &&
		typeof data.state === 'string'
	);
}
