// src/routes/blog/+page.ts
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = async () => {
	return { blogs: [] };
};
