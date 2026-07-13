// scripts/content-seo-audit.ts
// Reports whether location guides are ready to be indexed or need editorial work.
// This is intentionally read-only: publishing still requires a deliberate review.

import fs from 'node:fs';
import {
	buildSlugMap,
	contentPathFor,
	loadLocations,
	parseFrontmatter,
	type Frontmatter
} from './lib/content.js';

type Status = 'published' | 'review' | 'draft' | 'stub' | 'missing';

type AuditRow = {
	id: number;
	name: string;
	city: string;
	status: Status;
	wordCount: number;
	issues: string[];
};

const CORE_SECTIONS = ['Overview', 'What to know before you go', 'Tips for families', 'FAQs'];

function hasFlag(name: string): boolean {
	return process.argv.slice(2).includes(name);
}

function prose(value: string): string {
	return value
		.replace(/<!--[\s\S]*?-->/g, ' ')
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/\[[^\]]+\]\([^)]+\)/g, ' ')
		.replace(/^#{1,6}\s+/gm, ' ')
		.replace(/[*_`>|-]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function wordCount(value: string): number {
	const cleaned = prose(value);
	return cleaned ? cleaned.split(' ').length : 0;
}

function sectionBody(body: string, heading: string): string {
	const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const match = body.match(new RegExp(`^##\\s+${escaped}\\s*$`, 'im'));
	if (!match || match.index === undefined) return '';
	const afterHeading = body.slice(match.index + match[0].length);
	const nextHeading = afterHeading.search(/^##\s+/m);
	return nextHeading === -1 ? afterHeading : afterHeading.slice(0, nextHeading);
}

function audit(): AuditRow[] {
	const locations = loadLocations();
	const slugs = buildSlugMap(locations);

	return locations.map((location) => {
		const loc = location.location;
		const path = contentPathFor({
			state: loc.state || 'MD',
			city: loc.city || 'Unknown',
			slug: slugs.get(location.id)!
		});

		if (!fs.existsSync(path)) {
			return {
				id: location.id,
				name: loc.name,
				city: loc.city || 'Unknown',
				status: 'missing',
				wordCount: 0,
				issues: ['missing content file']
			};
		}

		const source = fs.readFileSync(path, 'utf8');
		const { data, body } = parseFrontmatter(source) as {
			data: Partial<Frontmatter>;
			body: string;
		};
		const words = wordCount(body);
		const issues: string[] = [];
		const emptySections = CORE_SECTIONS.filter(
			(heading) => wordCount(sectionBody(body, heading)) < 8
		);

		if (
			/HUMAN REVIEW|Recommendation:\s*do NOT publish|human should confirm|before publishing|staff confirmation/i.test(
				source
			)
		) {
			issues.push('blocking editorial review note');
		}
		if (!data.verified_at) issues.push('details not verified');
		if (body.match(/^#\s+/m)) issues.push('body contains duplicate H1');
		if (emptySections.length) issues.push(`empty: ${emptySections.join(', ')}`);
		if (words < 300) issues.push(`thin draft (${words} words)`);

		let status: Status;
		if (data.published) {
			status = 'published';
		} else if (words < 80 || data.seeded_at === data.last_modified) {
			status = 'stub';
		} else if (!issues.length) {
			status = 'review';
		} else {
			status = 'draft';
		}

		return {
			id: location.id,
			name: loc.name,
			city: loc.city || 'Unknown',
			status,
			wordCount: words,
			issues
		};
	});
}

function render(rows: AuditRow[]): void {
	const counts = new Map<Status, number>();
	for (const row of rows) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);

	console.log('Location SEO readiness');
	console.log(
		`Published: ${counts.get('published') ?? 0} | Ready for review: ${counts.get('review') ?? 0} | Draft: ${counts.get('draft') ?? 0} | Stub: ${counts.get('stub') ?? 0} | Missing: ${counts.get('missing') ?? 0}`
	);

	const publishedIssues = rows.filter((row) => row.status === 'published' && row.issues.length);
	if (publishedIssues.length) {
		console.log('\nPublished guide warnings');
		for (const row of publishedIssues) {
			console.log(`[CHECK  ] ${row.name} — ${row.city} — ${row.issues.join('; ')}`);
		}
	}

	const actionable = rows
		.filter((row) => row.status !== 'published')
		.sort((a, b) => {
			const rank: Record<Status, number> = {
				review: 0,
				draft: 1,
				stub: 2,
				missing: 3,
				published: 4
			};
			return rank[a.status] - rank[b.status] || b.wordCount - a.wordCount;
		});

	if (!actionable.length) return;
	console.log('\nEditorial queue');
	for (const row of actionable) {
		const issueText = row.issues.length ? row.issues.join('; ') : 'ready for editorial review';
		console.log(
			`[${row.status.toUpperCase().padEnd(7)}] ${row.name} — ${row.city} — ${row.wordCount} words — ${issueText}`
		);
	}
}

const rows = audit();
if (hasFlag('--json')) {
	console.log(JSON.stringify(rows, null, 2));
} else {
	render(rows);
}
