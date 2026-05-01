// scripts/content-status.ts
// Report the state of every location markdown file. Use this before a
// "burst" — e.g. before enriching all Glen Burnie locations.
//
// Usage:
//   pnpm content:status                          # everything
//   pnpm content:status --city "Glen Burnie"     # filter by city
//   pnpm content:status --state MD               # filter by state
//   pnpm content:status --stale                  # only files never hand-edited
//   pnpm content:status --published              # only published
//   pnpm content:status --unpublished            # only drafts
//   pnpm content:status --json                   # machine-readable

import fs from 'node:fs';
import {
	buildSlugMap,
	contentPathFor,
	loadLocations,
	parseFrontmatter,
	type Frontmatter
} from './lib/content.js';

type Row = {
	id: number;
	city: string;
	state: string;
	slug: string;
	name: string;
	exists: boolean;
	published: boolean;
	publishedAt: string | null;
	seededAt: string | null;
	lastModified: string | null;
	daysSinceEdit: number | null;
	neverTouched: boolean;
};

function getArg(name: string): string | undefined {
	const argv = process.argv.slice(2);
	const i = argv.indexOf(name);
	if (i === -1) return undefined;
	const next = argv[i + 1];
	if (!next || next.startsWith('--')) return '';
	return next;
}

function hasFlag(name: string): boolean {
	return process.argv.slice(2).includes(name);
}

function daysBetween(iso: string | null): number | null {
	if (!iso) return null;
	const then = Date.parse(iso);
	if (Number.isNaN(then)) return null;
	const now = Date.now();
	return Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
}

function buildRows(): Row[] {
	const locations = loadLocations();
	const slugMap = buildSlugMap(locations);
	const rows: Row[] = [];

	for (const loc of locations) {
		const slug = slugMap.get(loc.id)!;
		const fmStub = {
			state: loc.location.state || 'MD',
			city: loc.location.city || 'Unknown',
			slug
		};
		const abs = contentPathFor(fmStub);
		if (!fs.existsSync(abs)) {
			rows.push({
				id: loc.id,
				city: fmStub.city,
				state: fmStub.state,
				slug,
				name: loc.location.name,
				exists: false,
				published: false,
				publishedAt: null,
				seededAt: null,
				lastModified: null,
				daysSinceEdit: null,
				neverTouched: false
			});
			continue;
		}
		const source = fs.readFileSync(abs, 'utf8');
		const { data } = parseFrontmatter(source) as { data: Partial<Frontmatter> };
		const seededAt = (data.seeded_at as string) ?? null;
		const lastModified = (data.last_modified as string) ?? null;
		rows.push({
			id: loc.id,
			city: fmStub.city,
			state: fmStub.state,
			slug,
			name: loc.location.name,
			exists: true,
			published: data.published === true,
			publishedAt: (data.published_at as string) ?? null,
			seededAt,
			lastModified,
			daysSinceEdit: daysBetween(lastModified),
			neverTouched: !!seededAt && seededAt === lastModified
		});
	}

	return rows;
}

function applyFilters(rows: Row[]): Row[] {
	const city = getArg('--city');
	const state = getArg('--state');
	const stale = hasFlag('--stale');
	const published = hasFlag('--published');
	const unpublished = hasFlag('--unpublished');

	return rows.filter((r) => {
		if (city !== undefined && r.city.toLowerCase() !== city.toLowerCase()) return false;
		if (state !== undefined && r.state.toLowerCase() !== state.toLowerCase()) return false;
		if (stale && !r.neverTouched) return false;
		if (published && !r.published) return false;
		if (unpublished && r.published) return false;
		return true;
	});
}

function pad(value: string, width: number): string {
	if (value.length >= width) return value.slice(0, width);
	return value + ' '.repeat(width - value.length);
}

function renderTable(rows: Row[]): void {
	if (!rows.length) {
		console.log('No matching rows.');
		return;
	}

	const sorted = [...rows].sort((a, b) => {
		if (a.city !== b.city) return a.city.localeCompare(b.city);
		return a.name.localeCompare(b.name);
	});

	const cols = [
		{ key: 'city', label: 'City', width: 18 },
		{ key: 'name', label: 'Name', width: 38 },
		{ key: 'pub', label: 'Pub', width: 5 },
		{ key: 'last', label: 'Last edit', width: 12 },
		{ key: 'days', label: 'Age', width: 6 },
		{ key: 'note', label: 'Status', width: 18 }
	];

	console.log(cols.map((c) => pad(c.label, c.width)).join('  '));
	console.log(cols.map((c) => '-'.repeat(c.width)).join('  '));

	for (const r of sorted) {
		const note = !r.exists
			? 'MISSING FILE'
			: r.neverTouched
				? 'never touched'
				: r.published
					? 'published'
					: 'draft';
		const cells = [
			pad(r.city, 18),
			pad(r.name, 38),
			pad(r.published ? 'yes' : 'no', 5),
			pad(r.lastModified ?? '—', 12),
			pad(r.daysSinceEdit === null ? '—' : `${r.daysSinceEdit}d`, 6),
			pad(note, 18)
		];
		console.log(cells.join('  '));
	}

	const total = rows.length;
	const published = rows.filter((r) => r.published).length;
	const neverTouched = rows.filter((r) => r.neverTouched).length;
	const missing = rows.filter((r) => !r.exists).length;
	console.log(
		`\n${total} location(s)  |  published: ${published}  |  never touched: ${neverTouched}  |  missing file: ${missing}`
	);
}

function main(): void {
	const rows = applyFilters(buildRows());
	if (hasFlag('--json')) {
		console.log(JSON.stringify(rows, null, 2));
		return;
	}
	renderTable(rows);
}

main();
