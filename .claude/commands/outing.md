# Outing — Field Note Brain Dump

You are taking a field note from DJ, who just had a real outing with his kids. His brain dump is the single most valuable input this project gets: it is the parent-tested ground truth that machine research can never produce. Your job is to capture it losslessly, ask only the follow-ups that matter, and fan it out into every asset the pipeline needs — so the outing becomes the next thing the site releases.

## Invocation

```text
/outing <brain dump — typed or pasted voice-memo transcript>
/outing            (no args: ask him to brain dump, then proceed)
/outing --quick <dump>   (skip all follow-up questions)
```

The dump may be messy, unpunctuated, or rambling. That is expected. Never ask him to clean it up or re-state it.

## Step 1 — Parse the dump

Extract everything present before asking anything:

- Place name(s) — an outing may chain places ("then we grabbed lunch at...")
- When the visit happened (default: assume within the last few days)
- Kids' ages on the visit
- The verdict — would they go back?
- Practical details: parking, bathrooms, shade, crowds, stroller, food, cost surprises, what worked, what flopped, what surprised them
- Anything checkable against the page's operational facts ("I think they close at 5 now")
- Signals for structured frontmatter: `stroller_friendly`, `rainy_day_ok`, `hot_day_ok`, `cold_day_ok`, `noise_level`, `sensory_load`, `season_best`

## Step 2 — Archive the raw note (do this before anything else)

The dump is sacred; everything else is derived and re-derivable. Write it verbatim to:

```text
docs/field-notes/YYYY-MM-DD-<primary-place-slug>.md
```

(date = visit date if known, else today)

```markdown
---
date: YYYY-MM-DD
places: [md/city-slug/place-slug, ...]
ages: [4yo, 18mo]
source: /outing
---

## Raw dump

<the dump, verbatim — never edited, never summarized>

## Follow-up answers

<Q&A from Step 4, if any>
```

Never edit an existing archive file. A repeat visit to the same place gets a new file.

## Step 3 — Match each place against the pipeline

Check, in order:

1. `src/lib/content/locations/{state}/{city-slug}/{slug}.md` (fuzzy-match the name; check `docs/blog-automation/backlog-queue.json` and `src/lib/data/locations.json` for candidates before concluding it's new)
2. The place's `contentState` in the queue

Branch per place:

- **Page written** (drafted or published) → layer the field note onto it (Step 5). No queue change needed.
- **Stub exists, unwritten** → write the field note into the stub (Step 5), then set `override.forceNext` to its `locationKey` in `docs/blog-automation/override.json` — **only if `forceNext` is currently `null`**; otherwise leave it and report the conflict. Tonight's cron writes the full page with the note already in place.
- **Place not in the system** → onboard it (Step 6), then treat as a stub above.
- **Multiple places in one dump** → handle each, and cross-wire `pair_with` in each page's frontmatter (key format `state/city-slug/slug`) since they were chained in a real outing.

## Step 4 — Follow-up questions (the rules)

Skip entirely if `--quick`. Otherwise: **one batch, max 4 questions, never re-ask anything the dump already answered.** Use AskUserQuestion with short options where possible.

Gap priority order — ask only the top gaps:

1. **Would you go back?** (the verdict; most valuable single fact)
2. **What age did it actually work for?** (not who came — who it *worked* for)
3. **First 10 minutes tip** — where to park, which entrance, what to do right away
4. **One warning** — what should another parent know before going?

For structured facts you can *infer* from the dump (e.g. "splash pad" → `hot_day_ok: true`; "we brought the stroller, fine" → `stroller_friendly: yes`), present them as a single confirm/correct list, not open questions. Do not interrogate; if he gives short answers, take them and move on.

Append the answers to the archive file's `## Follow-up answers` section.

## Step 5 — Write the Parent field note onto the page

### The section

Insert as the **first `##` section of the body** (immediately before `## Overview`). Fixed format:

```markdown
## Parent field note

> *Visited June 2026 with a 4-year-old and an 18-month-old.*

**Would we go back?** Yes — but mornings only.
**Best for:** ages 2–6 who like water play
**Watch out for:** no shade after 11am; the splash pad soaks shoes
**First 10 minutes:** park in the Merriweather garage, not the street; bathrooms are behind the stage
```

Optional extra lines when the dump supports them: `**What surprised us:**`, `**Pair with:**`. Write in DJ's voice — plain, specific, honest. No brochure language. Only facts from the dump and his answers; never pad with researched filler.

If the page already has a `## Parent field note` (repeat visit), merge: update the verdict and facts, add an `*Update — June 2026:*` line for what changed. The raw archives preserve each visit separately.

### Frontmatter

Update on every field-noted page:

- `parent_tested: true`
- `last_visited: YYYY-MM-DD` (visit date)
- `visit_ages: [4yo, 18mo]` (display strings)
- `last_modified:` today
- Any structured fields he confirmed in Step 4 (`stroller_friendly`, `rainy_day_ok`, etc.)
- `pair_with` additions from chained places

Preserve all existing fields and the key order used by `src/lib/content/frontmatter.ts` (`FM_KEYS`). Do not touch `published` / `published_at`.

### Field notes outrank research

If the dump contradicts something already on the page (hours, parking, "the upstairs is closed now"), the field note wins. Correct the page body. If the claim is operational and checkable (hours, prices), verify against the official source first when quick to do; if verification is inconclusive, keep DJ's version — he was there.

## Step 6 — Onboarding a brand-new place

1. Add an entry to `src/lib/data/locations.json` under `locations`:
   - `id` and `location.id`: max existing id + 1 (both the same)
   - `name`, `city`, `state`, address fields, `website`, `type` (usually `Activity`), `indoor_outdoor`, `price` — from the dump plus a quick web lookup of the official site
   - `lat`/`lng`: geocode the address via web search. If you cannot get coordinates confidently, ask DJ for the rough cross-street and approximate; note the approximation in `notes`.
2. Run `pnpm content:sync` to seed the markdown stub.
3. Run `pnpm blog:queue` to register it in the backlog.
4. Continue with Step 5 (field note into the stub) and the `forceNext` bump from Step 3.

## Step 7 — Queue the email item

Append to `docs/blog-automation/email-queue.json` (create from this shape if missing):

```json
{
	"lastUpdated": "ISO timestamp",
	"readyThreshold": 3,
	"items": [
		{
			"locationKey": "md/columbia/color-burst-park",
			"name": "Color Burst Park",
			"city": "Columbia",
			"url": "https://tinytribeadventures.com/locations/md/columbia/color-burst-park",
			"bestFor": "ages 2–6 who like water play",
			"knowBeforeYouGo": "no shade after 11am — go in the morning",
			"fieldNote": "docs/field-notes/2026-06-07-color-burst-park.md",
			"addedAt": "YYYY-MM-DD",
			"usedInEmail": null
		}
	]
}
```

One item per field-noted place. Keep JSON valid and tab-indented. Count items where `usedInEmail` is `null` — that's the unsent pool.

## Step 8 — The friend snippet

End by printing a two-sentence text-a-friend snippet in DJ's voice, ready to paste into iMessage. Pattern: one specific practical detail + the link. Example:

```text
We did Color Burst Park with the kids Saturday — splash pad was a hit but zero
shade after 11, go early. Wrote up the practical stuff here:
https://tinytribeadventures.com/locations/md/columbia/color-burst-park
```

## Final report

```text
OUTING CAPTURED
Places: <names and locationKeys>
Archive: docs/field-notes/...
Pages updated: <paths> (parent_tested: true)
Queue: <forceNext set to ... | already written, no bump | forceNext occupied by ...>
Email queue: N of 3 — <"next email is ready to draft" | "X more outings until the next email">
Friend snippet: <above>
```

## Hard rules

- The raw dump is never edited, summarized, or lost. Archive first.
- `parent_tested: true` only goes on pages whose field note came from a real visit described by DJ. Never set it any other way.
- Max 4 follow-up questions, one batch. `--quick` means zero.
- Never flip `published` — publishing stays with the existing review flow.
- Do not invent details to fill the field-note template. A two-line field note from a real visit beats a full template of padding. Omit lines you don't have.
