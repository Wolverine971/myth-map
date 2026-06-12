# Daily Location Blog Creator

You are the unattended queue runner for Tiny Tribe Adventures location blogs. Run one location per execution.

## Pre-Approved Operations

- Read and write `docs/blog-automation/backlog-queue.json`
- Read and write `docs/blog-automation/override.json`
- Run `pnpm blog:queue`
- Run Claude Code for one selected location
- Write logs under `logs/blog-automation/`

## Pre-Flight

1. Read `docs/blog-automation/override.json`.
2. If `pause` is `true`, stop with `AUTOMATION PAUSED` and the reason.
3. If `inProgress` in `docs/blog-automation/backlog-queue.json` is set and started less than 24 hours ago, stop with `LOCATION BLOG IN PROGRESS`.
4. If `inProgress` is stale, move it to `failed` with reason `stale inProgress timeout`, clear `inProgress`, and continue.
5. Enforce `override.rateLimit.maxPerWeek`. Reset `currentWeekCount` when `weekStartDate` is outside the current Monday-Sunday week.

## Refresh Queue

Run:

```bash
pnpm blog:queue
```

Then read `docs/blog-automation/backlog-queue.json`.

## Selection

If `override.forceNext` is set, select that `locationKey` from the queue and clear `forceNext`.

Otherwise select the first queue item by priority order.

If the queue is empty, stop with `NO LOCATION BLOGS QUEUED`.

Mark the selected item as:

```json
{
	"...selected item fields": "...",
	"startedAt": "ISO timestamp"
}
```

and write it to `inProgress`.

## Execute Writer

Create the log directory:

```bash
mkdir -p logs/blog-automation
```

Run Claude Code from repo root:

```bash
/Users/djwayne/.local/bin/claude --chrome --dangerously-skip-permissions -p "/location_blog_creator SELECTED_LOCATION_KEY --unattended" 2>&1 | tee -a logs/blog-automation/cron-$(date +%Y-%m-%d).log
```

Replace `SELECTED_LOCATION_KEY` with the exact selected key, for example `md/ellicott-city/clarks-elioak-farm`.

## Verify

After the writer exits:

1. Re-read the selected markdown file.
2. Confirm the required sections have meaningful content:
   - `## Overview`
   - `## What to know before you go`
   - `## Tips for families`
   - `## Best time to visit`
   - `## FAQs`
   - `## Helpful links`
3. Confirm `last_modified` changed to today's date.
4. Confirm `published` is still `false` unless explicitly instructed otherwise.
5. If the file had a `## Parent field note` section before the writer ran (check git diff), confirm it is still present and unmodified, and that `parent_tested`, `last_visited`, and `visit_ages` frontmatter survived. If the writer damaged any of these, restore them from git and log it as a failure condition.

## Queue Update

On success:

- Move the item from `inProgress` to `completed`.
- Add `completedAt`, `durationMinutes`, and `contentPath`.
- Increment `override.rateLimit.currentWeekCount`.
- Clear `inProgress`.

On failure:

- Increment `retryCount`.
- If `retryCount` is less than 3, return the item to `queue`.
- If `retryCount` is 3 or more, move it to `failed`.
- Add `failedAt`, `error`, and `logPath`.
- Clear `inProgress`.

Keep JSON valid and tab-indented.

## Final Output

Report:

```text
LOCATION BLOG AUTOMATION
Status: success | skipped | failed
Selected: location name and key
File: content path
Queue remaining: number
Log: logs/blog-automation/cron-YYYY-MM-DD.log
```
