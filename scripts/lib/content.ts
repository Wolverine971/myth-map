// scripts/lib/content.ts
// Shared helpers for the location-content tooling (sync + status).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export {
	parseFrontmatter,
	serializeFrontmatter,
	type Frontmatter
} from '../../src/lib/content/frontmatter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../..');
export const LOCATIONS_JSON = path.join(ROOT, 'src/lib/data/locations.json');
export const CONTENT_ROOT = path.join(ROOT, 'src/lib/content/locations');

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

export function loadLocations(): RawLocation[] {
	const raw = fs.readFileSync(LOCATIONS_JSON, 'utf8');
	const parsed = JSON.parse(raw);
	return parsed.locations as RawLocation[];
}

export function slugify(value: string): string {
	return value
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/['’`]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function todayIsoDate(): string {
	return new Date().toISOString().slice(0, 10);
}

export function contentPathFor(fm: { state: string; city: string; slug: string }): string {
	return path.join(CONTENT_ROOT, fm.state.toLowerCase(), slugify(fm.city), `${fm.slug}.md`);
}

// --- seed template ---------------------------------------------------------
// IMPORTANT: only seed verified facts from locations.json. Never invent prose,
// hours, parking notes, age ranges, etc. Empty stub headings are intentional.

export function seedBody(loc: RawLocation): string {
	const l = loc.location;
	const addressLine = [l.address_line_1, l.address_line_2].filter(Boolean).join(', ');
	const cityState = [l.city, l.state].filter(Boolean).join(', ');
	const fullAddress = [addressLine, cityState, l.zip_code].filter(Boolean).join(' ');

	const lines: string[] = [];
	lines.push(`# ${l.name}`);
	lines.push('');
	if (fullAddress) lines.push(`**Address:** ${fullAddress}`);
	if (loc.website) lines.push(`**Website:** [${loc.website}](${loc.website})`);
	if (l.type) lines.push(`**Type:** ${l.type}`);
	if (l.indoor_outdoor) lines.push(`**Setting:** ${l.indoor_outdoor}`);
	if (l.price) lines.push(`**Price:** ${l.price}`);
	lines.push('');
	lines.push(
		'<!-- Fill the sections below with parent-tested details. Delete any sections you do not need. -->'
	);
	lines.push('');
	lines.push('## Overview');
	lines.push('');
	lines.push('## What to know before you go');
	lines.push('');
	lines.push('## Tips for families');
	lines.push('');
	lines.push('## Best time to visit');
	lines.push('');
	lines.push('## FAQs');
	lines.push('');
	return lines.join('\n');
}

// Produce a stable, collision-resistant slug per (city, slug) pair.
export function buildSlugMap(locations: RawLocation[]): Map<number, string> {
	const used = new Map<string, number>(); // key = `${cityKey}::${slug}` -> first id
	const result = new Map<number, string>();
	for (const loc of locations) {
		const base = slugify(loc.location.name || `location-${loc.id}`);
		const cityKey = slugify(loc.location.city || 'unknown');
		const key = `${cityKey}::${base}`;
		const prior = used.get(key);
		if (prior === undefined) {
			used.set(key, loc.id);
			result.set(loc.id, base);
		} else {
			// Collision: keep first as-is, append id to subsequent.
			result.set(loc.id, `${base}-${loc.id}`);
		}
	}
	return result;
}
