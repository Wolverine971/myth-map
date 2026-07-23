<!-- docs/blog-automation/automation-plan.md -->

# Tiny Tribe Location Blog Queue

This system mirrors the 9takes blog automation pattern, but the unit of work is a Tiny Tribe location markdown file under `src/lib/content/locations`.

## Files

- `docs/blog-automation/backlog-queue.json` — generated queue of location pages that do not have a real family-guide blog yet.
- `docs/blog-automation/override.json` — pause, force-next, and weekly rate-limit controls.
- `scripts/generate-location-blog-queue.ts` — queue refresh script.
- `.claude/commands/location_blog_creator.md` — writes one researched location blog.
- `.claude/commands/daily-location-blog-creator.md` — unattended queue runner for cron.

## Queue Generation

Run:

```bash
pnpm blog:queue
```

The generator reads every location in `src/lib/data/locations.json`, finds the expected markdown file in `src/lib/content/locations/{state}/{city}/{slug}.md`, and audits the content sections.

A page is considered written only when it has meaningful content in:

- `## Overview`
- `## What to know before you go`
- `## Tips for families`
- `## Best time to visit`
- `## FAQs`
- `## Helpful links`

This means an unpublished but fully drafted location is not re-queued for writing. It can be reviewed and published separately. A public page that is still a thin stub stays in the queue because it is a live quality risk.

## Daily Workflow

The daily Claude Code command does this:

1. Read `docs/blog-automation/override.json`.
2. Stop if paused.
3. Stop if `inProgress` is active and less than 24 hours old.
4. Stop if the weekly rate limit is hit.
5. Refresh `docs/blog-automation/backlog-queue.json`.
6. Select the highest-priority queued location, or `forceNext` if set.
7. Mark the item as `inProgress`.
8. In the current Claude process, follow `.claude/commands/location_blog_creator.md` for the selected key in unattended mode. Do not launch a nested Claude process or background writer.
9. Verify that the markdown file changed and contains the required sections.
10. Move the item to `completed`, `failed`, or back to the queue with an incremented `retryCount`.

## Writing Standard

The writer must read and follow:

- `docs/location-research-brief.md` for the editorial bar, section shape, source hygiene, and quality checklist.
- `docs/location-research-prompt.md` for the structured research checklist and optional frontmatter fields.

The automation writes into the existing location markdown file. It should update `last_modified` and `verified_at` to the research date. It should leave `published: false` unless the command is explicitly run with a publish instruction.

## Cron Schedule

The default schedule is daily at 2:00 AM America/New_York, with a maximum of five successful blogs per week. That matches the 9takes cadence while keeping research volume manageable.

Operational log path:

```bash
logs/blog-automation/cron-YYYY-MM-DD.log
```

The runner sets `HOME=/Users/djwayne` explicitly so Claude can resolve the authenticated `~/.claude` configuration under cron. Run `scripts/run-daily-location-blog-creator.sh --check` to verify the repo, binary, log directory, and Claude authentication together.

## Manual Controls

Pause the runner:

```json
{
	"pause": true,
	"reason": "reviewing drafts before continuing"
}
```

Force a specific next location:

```json
{
	"forceNext": "md/ellicott-city/clarks-elioak-farm"
}
```

The forced key must match `locationKey` in `backlog-queue.json`.
