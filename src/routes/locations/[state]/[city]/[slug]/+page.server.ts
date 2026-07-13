// src/routes/locations/[state]/[city]/[slug]/+page.server.ts
import { error } from '@sveltejs/kit';
import {
	getEntry,
	nearbyEntries,
	pairedEntries,
	routeEntries,
	type LocationEntry
} from '$lib/server/content/loader';
import type { PageServerLoad } from './$types';

export const prerender = true;

export function entries() {
	return routeEntries();
}

function relatedEntry(entry: LocationEntry) {
	return {
		id: entry.id,
		stateSlug: entry.stateSlug,
		citySlug: entry.citySlug,
		slug: entry.slug,
		frontmatter: {
			name: entry.frontmatter.name,
			city: entry.frontmatter.city,
			state: entry.frontmatter.state
		}
	};
}

function overviewDescription(markdown: string, maxLength = 160): string {
	const overview = markdown.match(/(?:^|\n)## Overview\s*\n+([\s\S]*?)(?=\n## |\s*$)/)?.[1];
	const firstParagraph = overview
		?.split(/\n\s*\n/)
		.map((paragraph) => paragraph.trim())
		.find(Boolean);
	if (!firstParagraph) return '';

	const plainText = firstParagraph
		.replace(/<!--[^]*?-->/g, ' ')
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
		.replace(/[*_`~>#]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	if (plainText.length <= maxLength) return plainText;
	const completeSentence = plainText.slice(0, maxLength + 1).match(/^(.{80,}[.!?])(?:\s|$)/)?.[1];
	if (completeSentence) return completeSentence;

	const clipped = plainText
		.slice(0, maxLength - 1)
		.replace(/\s+\S*$/, '')
		.replace(/[,:;\s—-]+$/, '');
	return `${clipped}…`;
}

export const load: PageServerLoad = async ({ params }) => {
	const entry = getEntry(params.state, params.city, params.slug);
	if (!entry) throw error(404, 'Location not found');
	const { body: _body, ...pageEntry } = entry;
	const editorialSummary = entry.frontmatter.published ? overviewDescription(entry.body) : '';
	const nearby = nearbyEntries(entry, 3).map((item) => ({
		...relatedEntry(item),
		distanceMiles: item.distanceMiles
	}));
	const paired = pairedEntries(entry).map((item) => relatedEntry(item));
	return { entry: pageEntry, nearby, paired, editorialSummary };
};
