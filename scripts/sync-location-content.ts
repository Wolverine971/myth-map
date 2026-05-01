// scripts/sync-location-content.ts
// Sync markdown content files with `src/lib/data/locations.json`.
//
// Behavior:
// - For every location in JSON, ensure a markdown file exists at
//   `src/lib/content/locations/{state}/{city-slug}/{location-slug}.md`.
//   New files are seeded with verified facts only — never invented prose.
// - Existing files are NEVER overwritten, with one tiny exception:
//   if `published: true` and `published_at == null`, fill `published_at`
//   with today's date. Nothing else is touched.
// - Reports orphans: markdown files whose id is no longer in JSON.
//
// Usage:
//   pnpm content:sync          # apply
//   pnpm content:sync --dry    # preview only
//   pnpm content:sync --check  # exit non-zero if anything would change

import fs from 'node:fs';
import path from 'node:path';
import {
	CONTENT_ROOT,
	buildSlugMap,
	contentPathFor,
	loadLocations,
	parseFrontmatter,
	seedBody,
	serializeFrontmatter,
	slugify,
	todayIsoDate,
	type Frontmatter,
	type RawLocation
} from './lib/content.js';

const args = new Set(process.argv.slice(2));
const DRY = args.has('--dry');
const CHECK = args.has('--check');

type Action =
	| { kind: 'create'; locId: number; relPath: string; absPath: string; content: string }
	| { kind: 'fill-published-at'; locId: number; relPath: string; absPath: string; date: string }
	| { kind: 'orphan'; absPath: string; relPath: string };

function relative(p: string): string {
	return path.relative(path.join(CONTENT_ROOT, '..', '..', '..'), p);
}

function* walkMarkdown(dir: string): Generator<string> {
	if (!fs.existsSync(dir)) return;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const abs = path.join(dir, entry.name);
		if (entry.isDirectory()) yield* walkMarkdown(abs);
		else if (entry.isFile() && entry.name.endsWith('.md')) yield abs;
	}
}

function buildSeedFrontmatter(loc: RawLocation, slug: string): Frontmatter {
	const today = todayIsoDate();
	return {
		id: loc.id,
		slug,
		name: loc.location.name,
		city: loc.location.city || 'Unknown',
		state: loc.location.state || 'MD',
		seeded_at: today,
		last_modified: today,
		published: false,
		published_at: null
	};
}

function planActions(locations: RawLocation[]): Action[] {
	const slugMap = buildSlugMap(locations);
	const actions: Action[] = [];
	const expectedPaths = new Set<string>();

	for (const loc of locations) {
		const slug = slugMap.get(loc.id)!;
		const fm = buildSeedFrontmatter(loc, slug);
		const abs = contentPathFor(fm);
		expectedPaths.add(abs);

		if (!fs.existsSync(abs)) {
			const content = serializeFrontmatter(fm, seedBody(loc));
			actions.push({
				kind: 'create',
				locId: loc.id,
				relPath: relative(abs),
				absPath: abs,
				content
			});
			continue;
		}

		// File exists — only touch published_at if needed.
		const existing = fs.readFileSync(abs, 'utf8');
		const { data } = parseFrontmatter(existing);
		if (
			data.published === true &&
			(data.published_at === null || data.published_at === undefined)
		) {
			actions.push({
				kind: 'fill-published-at',
				locId: loc.id,
				relPath: relative(abs),
				absPath: abs,
				date: todayIsoDate()
			});
		}
	}

	// Orphan detection.
	for (const abs of walkMarkdown(CONTENT_ROOT)) {
		if (expectedPaths.has(abs)) continue;
		actions.push({ kind: 'orphan', absPath: abs, relPath: relative(abs) });
	}

	return actions;
}

function applyAction(action: Action): void {
	if (action.kind === 'create') {
		fs.mkdirSync(path.dirname(action.absPath), { recursive: true });
		fs.writeFileSync(action.absPath, action.content);
		return;
	}
	if (action.kind === 'fill-published-at') {
		const source = fs.readFileSync(action.absPath, 'utf8');
		const { data, body } = parseFrontmatter(source);
		const merged = { ...data, published_at: action.date } as Frontmatter;
		fs.writeFileSync(action.absPath, serializeFrontmatter(merged, body));
		return;
	}
	// Orphans are only reported, never deleted automatically.
}

function summarize(actions: Action[]): void {
	const created = actions.filter((a) => a.kind === 'create');
	const filled = actions.filter((a) => a.kind === 'fill-published-at');
	const orphans = actions.filter((a) => a.kind === 'orphan');

	if (created.length) {
		console.log(`\n${created.length} file(s) to create:`);
		for (const a of created.slice(0, 10)) console.log(`  + ${a.relPath}`);
		if (created.length > 10) console.log(`  … and ${created.length - 10} more`);
	}
	if (filled.length) {
		console.log(`\n${filled.length} file(s) need published_at backfilled:`);
		for (const a of filled) console.log(`  ~ ${a.relPath} → published_at: ${a.date}`);
	}
	if (orphans.length) {
		console.log(`\n${orphans.length} orphan file(s) (no matching JSON id):`);
		for (const a of orphans) console.log(`  ? ${a.relPath}`);
		console.log('  (orphans are reported, not deleted — clean up by hand)');
	}
	if (!created.length && !filled.length && !orphans.length) {
		console.log('Nothing to do — content is in sync.');
	}
}

function main(): void {
	const locations = loadLocations();
	const actions = planActions(locations);
	summarize(actions);

	const mutating = actions.filter((a) => a.kind !== 'orphan');
	if (CHECK) {
		if (mutating.length > 0) {
			console.error(`\nCHECK FAILED: ${mutating.length} change(s) pending.`);
			process.exit(1);
		}
		return;
	}
	if (DRY) {
		console.log('\nDry run — no files written.');
		return;
	}
	for (const a of mutating) applyAction(a);
	if (mutating.length) console.log(`\nApplied ${mutating.length} change(s).`);
}

main();
