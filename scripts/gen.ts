// scripts/gen.ts
// Smart "gen" runner.
//
// By default this only formats and path-labels the files you've actually
// touched on the current git branch (committed-since-main + staged + unstaged
// + untracked). This keeps the common case fast instead of scanning the whole
// repo every time.
//
// Pass --all to rescan and reformat everything (the old behavior).
//
// Usage:
//   pnpm gen:all     # changed files only (default)
//   pnpm gen:full    # rescan the entire project
//   tsx scripts/gen.ts --all

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ALL = process.argv.slice(2).includes('--all');
const MAIN_BRANCH = 'main';

function git(args: string[]): string {
	try {
		return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
	} catch {
		// Not a git repo, or the ref doesn't exist — degrade gracefully.
		return '';
	}
}

function run(cmd: string, args: string[]): void {
	console.log(`\n$ ${cmd} ${args.join(' ')}`);
	execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
}

function changedFiles(): string[] {
	const set = new Set<string>();
	const add = (out: string) =>
		out
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean)
			.forEach((f) => set.add(f));

	// Files committed on this branch (diff against the merge-base with main).
	// On main itself the merge-base is HEAD, so this contributes nothing.
	const mergeBase = git(['merge-base', 'HEAD', MAIN_BRANCH]);
	if (mergeBase) add(git(['diff', '--name-only', '--diff-filter=d', mergeBase, 'HEAD']));

	// Uncommitted changes (staged + unstaged), excluding deletions.
	add(git(['diff', '--name-only', '--diff-filter=d', 'HEAD']));

	// Untracked files, respecting .gitignore.
	add(git(['ls-files', '--others', '--exclude-standard']));

	// Keep only files that still exist on disk.
	return [...set].filter((rel) => {
		const abs = path.join(ROOT, rel);
		return fs.existsSync(abs) && fs.statSync(abs).isFile();
	});
}

function main(): void {
	// content:sync is data-driven (JSON → markdown), idempotent, and cheap, so
	// it always runs in full. It may create new markdown files, which is why we
	// compute the changed-file set *after* it runs.
	run('pnpm', ['content:sync']);

	if (ALL) {
		run('pnpm', ['exec', 'prettier', '--write', '.']);
		run('pnpm', ['exec', 'tsx', 'labelFilePaths.ts']);
		return;
	}

	const files = changedFiles();
	if (files.length === 0) {
		console.log('\nNo changed files to format. (Run `pnpm gen:full` to rescan everything.)');
		return;
	}

	console.log(`\nFound ${files.length} changed file(s) on this branch.`);
	// --ignore-unknown lets prettier skip files it doesn't know how to format.
	run('pnpm', ['exec', 'prettier', '--write', '--ignore-unknown', ...files]);
	run('pnpm', ['exec', 'tsx', 'labelFilePaths.ts', ...files]);
}

main();
