// src/routes/blog/+page.ts
import { listEntries } from '$lib/content/loader';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async () => {
	const guides = listEntries()
		.filter((entry) => entry.frontmatter.published)
		.sort((a, b) =>
			(b.frontmatter.published_at ?? b.frontmatter.last_modified).localeCompare(
				a.frontmatter.published_at ?? a.frontmatter.last_modified
			)
		)
		.map((entry) => ({
			id: entry.id,
			name: entry.frontmatter.name,
			city: entry.frontmatter.city,
			state: entry.frontmatter.state,
			href: `/locations/${entry.stateSlug}/${entry.citySlug}/${entry.slug}`,
			publishedAt: entry.frontmatter.published_at,
			verifiedAt: entry.frontmatter.verified_at ?? null,
			parentTested: !!entry.frontmatter.parent_tested
		}));

	return { guides };
};
