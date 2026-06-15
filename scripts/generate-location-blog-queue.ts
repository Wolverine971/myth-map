// scripts/generate-location-blog-queue.ts
// Build the unattended blog-writing backlog from location markdown files.

import fs from 'node:fs';
import path from 'node:path';
import { format as formatPrettier } from 'prettier';
import {
	ROOT,
	buildSlugMap,
	contentPathFor,
	loadLocations,
	parseFrontmatter,
	slugify,
	type RawLocation
} from './lib/content.js';

const QUEUE_PATH = path.join(ROOT, 'docs/blog-automation/backlog-queue.json');
const TODAY = new Date().toISOString().slice(0, 10);

type ContentState =
	| 'missing-file'
	| 'unstarted'
	| 'partial'
	| 'published-thin'
	| 'drafted-unpublished'
	| 'published';

type Audit = {
	written: boolean;
	state: ContentState;
	wordCount: number;
	faqCount: number;
	helpfulLinkCount: number;
	missingSections: string[];
};

type QueueItem = {
	id: number;
	locationKey: string;
	slug: string;
	name: string;
	city: string;
	state: string;
	address: string | null;
	contentPath: string;
	published: boolean;
	contentState: ContentState;
	priority: number;
	priorityReason: string;
	estimatedTraffic: 'high' | 'medium' | 'low';
	researchBrief: string;
	researchPrompt: string;
	addedToQueue: string;
	retryCount: number;
	strategicValue: string;
	audit: {
		wordCount: number;
		faqCount: number;
		helpfulLinkCount: number;
		missingSections: string[];
	};
};

type QueueFile = {
	lastUpdated: string;
	stats: {
		totalLocations: number;
		totalWritten: number;
		totalNeedsBlog: number;
		totalPublished: number;
		totalPublishedButThin: number;
		totalDraftedUnpublished: number;
		completionRate: string;
	};
	queue: QueueItem[];
	inProgress: QueueItem | null;
	completed: unknown[];
	failed: unknown[];
	skipped: unknown[];
};

function readExistingQueue(): Partial<QueueFile> {
	if (!fs.existsSync(QUEUE_PATH)) return {};
	return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8')) as Partial<QueueFile>;
}

function rel(absPath: string): string {
	return path.relative(ROOT, absPath);
}

function buildAddress(loc: RawLocation): string | null {
	const l = loc.location;
	if (l.full_address) return l.full_address;
	const addressLine = [l.address_line_1, l.address_line_2].filter(Boolean).join(', ');
	const cityState = [l.city, l.state].filter(Boolean).join(', ');
	const full = [addressLine, cityState, l.zip_code].filter(Boolean).join(' ');
	return full || null;
}

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sectionContent(body: string, heading: string): string {
	const match = new RegExp(`^##\\s+${escapeRegex(heading)}\\s*$`, 'im').exec(body);
	if (!match) return '';
	const rest = body.slice(match.index + match[0].length);
	const nextHeading = rest.search(/^##\s+/m);
	return (nextHeading === -1 ? rest : rest.slice(0, nextHeading)).trim();
}

function stripScaffold(body: string): string {
	return body
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/^#\s+.+$/gm, '')
		.replace(/^\*\*(Address|Website|Type|Setting|Price):\*\*.*$/gim, '')
		.trim();
}

function wordCount(value: string): number {
	return value.match(/[A-Za-z0-9][A-Za-z0-9'’.-]*/g)?.length ?? 0;
}

function bulletCount(value: string): number {
	return value.match(/^\s*[-*]\s+/gm)?.length ?? 0;
}

function faqCount(value: string): number {
	return value.match(/^\*\*[^*\n]+\?\*\*$/gm)?.length ?? 0;
}

function helpfulLinkCount(value: string): number {
	return value.match(/^\s*[-*]\s+\[[^\]]+\]\([^)]+\)/gm)?.length ?? 0;
}

function auditContent(source: string | null, published: boolean): Audit {
	if (!source) {
		return {
			written: false,
			state: 'missing-file',
			wordCount: 0,
			faqCount: 0,
			helpfulLinkCount: 0,
			missingSections: ['file']
		};
	}

	const { body } = parseFrontmatter(source);
	const overview = sectionContent(body, 'Overview');
	const logistics = sectionContent(body, 'What to know before you go');
	const tips = sectionContent(body, 'Tips for families');
	const bestTime = sectionContent(body, 'Best time to visit');
	const faqs = sectionContent(body, 'FAQs');
	const helpfulLinks = sectionContent(body, 'Helpful links');
	const cleanBody = stripScaffold(body);
	const totalWords = wordCount(cleanBody);
	const totalFaqs = faqCount(faqs);
	const totalHelpfulLinks = helpfulLinkCount(helpfulLinks);

	const checks = [
		{ name: 'Overview', ok: wordCount(overview) >= 60 },
		{
			name: 'What to know before you go',
			ok: wordCount(logistics) >= 80 || bulletCount(logistics) >= 5
		},
		{ name: 'Tips for families', ok: wordCount(tips) >= 60 || bulletCount(tips) >= 3 },
		{ name: 'Best time to visit', ok: wordCount(bestTime) >= 35 },
		{ name: 'FAQs', ok: totalFaqs >= 5 },
		{ name: 'Helpful links', ok: totalHelpfulLinks >= 3 }
	];

	const missingSections = checks.filter((check) => !check.ok).map((check) => check.name);
	const written = missingSections.length === 0;
	let state: ContentState = published ? 'published' : 'drafted-unpublished';
	if (!written) {
		state = published ? 'published-thin' : totalWords < 80 ? 'unstarted' : 'partial';
	}

	return {
		written,
		state,
		wordCount: totalWords,
		faqCount: totalFaqs,
		helpfulLinkCount: totalHelpfulLinks,
		missingSections
	};
}

function trafficFor(loc: RawLocation): 'high' | 'medium' | 'low' {
	const name = loc.location.name.toLowerCase();
	const type = (loc.location.type ?? '').toLowerCase();
	if (
		/(aquarium|zoo|science|museum|nasa|state park|farm|skyzone|playseum|train|discovery)/.test(name)
	) {
		return 'high';
	}
	if (/(library|nature center|park|playground|activity)/.test(`${name} ${type}`)) return 'medium';
	return 'low';
}

function priorityFor(loc: RawLocation, audit: Audit, published: boolean): number {
	let score = 0;
	if (audit.state === 'missing-file') score += 100;
	else if (audit.state === 'unstarted') score += 85;
	else score += 65;

	if (published && !audit.written) score += 10;

	const traffic = trafficFor(loc);
	if (traffic === 'high') score += 12;
	if (traffic === 'medium') score += 6;

	const city = (loc.location.city ?? '').toLowerCase();
	if (['baltimore', 'columbia', 'ellicott city', 'laurel'].includes(city)) score += 5;

	if (loc.website || loc.location.website) score += 2;
	return score;
}

function priorityReasonFor(loc: RawLocation, audit: Audit, published: boolean): string {
	if (audit.state === 'missing-file') return 'No markdown file exists for this location yet.';
	if (audit.state === 'unstarted') {
		return `Seeded stub with empty family-guide sections; ${trafficFor(loc)} family-search intent.`;
	}
	const missing = audit.missingSections.join(', ');
	if (published && !audit.written) {
		return `Published page is thin and needs repair; missing ${missing}.`;
	}
	return `Partial draft needs a complete research-and-writing pass; missing ${missing}.`;
}

function strategicValueFor(loc: RawLocation): string {
	const city = slugify(loc.location.city || 'unknown-city');
	const type = slugify(loc.location.type || 'location');
	return `${city}-${type}-cluster`;
}

function existingItemByKey(existing: Partial<QueueFile>): Map<string, Partial<QueueItem>> {
	const map = new Map<string, Partial<QueueItem>>();
	for (const item of existing.queue ?? []) map.set(item.locationKey, item);
	if (existing.inProgress) map.set(existing.inProgress.locationKey, existing.inProgress);
	return map;
}

function keySet(items: unknown[] | undefined): Set<string> {
	const keys = new Set<string>();
	for (const item of items ?? []) {
		if (item && typeof item === 'object' && 'locationKey' in item) {
			const key = (item as { locationKey?: unknown }).locationKey;
			if (typeof key === 'string') keys.add(key);
		}
	}
	return keys;
}

function buildQueue(): QueueFile {
	const existing = readExistingQueue();
	const priorByKey = existingItemByKey(existing);
	const completedKeys = keySet(existing.completed);
	const failedKeys = keySet(existing.failed);
	const locations = loadLocations();
	const slugMap = buildSlugMap(locations);
	const queue: QueueItem[] = [];
	let writtenCount = 0;
	let publishedCount = 0;
	let publishedButThin = 0;
	let draftedUnpublished = 0;

	for (const loc of locations) {
		const slug = slugMap.get(loc.id)!;
		const state = loc.location.state || 'MD';
		const city = loc.location.city || 'Unknown';
		const absPath = contentPathFor({ state, city, slug });
		const source = fs.existsSync(absPath) ? fs.readFileSync(absPath, 'utf8') : null;
		const data = source ? parseFrontmatter(source).data : {};
		const published = data.published === true;
		const audit = auditContent(source, published);
		const locationKey = `${state.toLowerCase()}/${slugify(city)}/${slug}`;

		if (published) publishedCount += 1;
		if (audit.written) writtenCount += 1;
		if (published && !audit.written) publishedButThin += 1;
		if (!published && audit.written) draftedUnpublished += 1;

		if (audit.written || completedKeys.has(locationKey) || failedKeys.has(locationKey)) continue;

		const prior = priorByKey.get(locationKey);
		queue.push({
			id: loc.id,
			locationKey,
			slug,
			name: loc.location.name,
			city,
			state,
			address: buildAddress(loc),
			contentPath: rel(absPath),
			published,
			contentState: audit.state,
			priority: priorityFor(loc, audit, published),
			priorityReason: priorityReasonFor(loc, audit, published),
			estimatedTraffic: trafficFor(loc),
			researchBrief: 'docs/location-research-brief.md',
			researchPrompt: 'docs/location-research-prompt.md',
			addedToQueue: prior?.addedToQueue ?? TODAY,
			retryCount: prior?.retryCount ?? 0,
			strategicValue: strategicValueFor(loc),
			audit: {
				wordCount: audit.wordCount,
				faqCount: audit.faqCount,
				helpfulLinkCount: audit.helpfulLinkCount,
				missingSections: audit.missingSections
			}
		});
	}

	queue.sort(
		(a, b) =>
			b.priority - a.priority || a.city.localeCompare(b.city) || a.name.localeCompare(b.name)
	);

	return {
		lastUpdated: new Date().toISOString(),
		stats: {
			totalLocations: locations.length,
			totalWritten: writtenCount,
			totalNeedsBlog: queue.length,
			totalPublished: publishedCount,
			totalPublishedButThin: publishedButThin,
			totalDraftedUnpublished: draftedUnpublished,
			completionRate: `${((writtenCount / locations.length) * 100).toFixed(1)}%`
		},
		queue,
		inProgress: existing.inProgress ?? null,
		completed: existing.completed ?? [],
		failed: existing.failed ?? [],
		skipped: existing.skipped ?? []
	};
}

async function main(): Promise<void> {
	const dryRun = process.argv.includes('--dry');
	const queue = buildQueue();
	if (!dryRun) {
		fs.mkdirSync(path.dirname(QUEUE_PATH), { recursive: true });
		const formatted = await formatPrettier(JSON.stringify(queue, null, '\t'), {
			parser: 'json',
			useTabs: true,
			singleQuote: true,
			trailingComma: 'none',
			printWidth: 100
		});
		fs.writeFileSync(QUEUE_PATH, formatted);
	}

	console.log(
		[
			`Location blog queue ${dryRun ? 'preview' : 'updated'}: ${rel(QUEUE_PATH)}`,
			`Needs blog: ${queue.stats.totalNeedsBlog}`,
			`Written: ${queue.stats.totalWritten}/${queue.stats.totalLocations} (${queue.stats.completionRate})`,
			`Published but thin: ${queue.stats.totalPublishedButThin}`,
			`Drafted unpublished: ${queue.stats.totalDraftedUnpublished}`
		].join('\n')
	);
}

await main();
