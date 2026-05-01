// src/lib/content/frontmatter.ts
// Pure frontmatter parser/serializer for our location markdown files. Used by
// both the runtime loader and the Node sync/status scripts. No fs, no Node-only
// APIs — safe to import anywhere.

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
};

export const FM_KEYS: ReadonlyArray<keyof Frontmatter> = [
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

function unquote(value: string): string {
	const trimmed = value.trim();
	if (trimmed.length >= 2 && trimmed[0] === '"' && trimmed[trimmed.length - 1] === '"') {
		return trimmed.slice(1, -1).replace(/\\"/g, '"');
	}
	return trimmed;
}

function parseScalar(raw: string): string | number | boolean | null {
	const v = raw.trim();
	if (v === 'null' || v === '') return null;
	if (v === 'true') return true;
	if (v === 'false') return false;
	if (/^-?\d+$/.test(v)) return Number(v);
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

function serializeValue(value: string | number | boolean | null): string {
	if (value === null) return 'null';
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	if (typeof value === 'number') return String(value);
	if (/[:#"\n]/.test(value) || value.trim() !== value) {
		return `"${value.replace(/"/g, '\\"')}"`;
	}
	return value;
}

export function serializeFrontmatter(data: Frontmatter, body: string): string {
	const lines = ['---'];
	for (const key of FM_KEYS) {
		lines.push(`${key}: ${serializeValue(data[key] as never)}`);
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
