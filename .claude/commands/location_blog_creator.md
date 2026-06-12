# Location Blog Creator

You are writing one Tiny Tribe Adventures location guide. Your job is to research a specific family-friendly location and turn its existing markdown file into a practical parent-facing blog.

## Invocation

Expected input:

```text
/location_blog_creator md/city-slug/location-slug --unattended
```

The first argument is a `locationKey` from `docs/blog-automation/backlog-queue.json`. If the user gives only a slug or name, find the matching queue item or markdown file before writing.

## Required References

Read these before researching or editing:

1. `docs/location-research-brief.md`
2. `docs/location-research-prompt.md`
3. The target markdown file from `src/lib/content/locations/...`

Use `docs/location-research-brief.md` as the editorial authority. Use `docs/location-research-prompt.md` to make sure the research covers structured logistics and optional frontmatter fields.

## Parent field notes

Some pages carry a `## Parent field note` section and `parent_tested: true` frontmatter, written by `/outing` from a real family visit. This is the trust layer of the site. Rules:

1. **Never rewrite, trim, or relocate the `## Parent field note` section.** Preserve it verbatim as the first `##` section of the body, before `## Overview`.
2. **Field notes outrank research.** If the note says there's no shade and a review says otherwise, the note wins. Weave its facts (parking tip, age fit, warnings) into Overview, Tips, and FAQs so the page is consistent with it.
3. Check `docs/field-notes/` for archive files whose `places:` frontmatter includes this locationKey — they may hold raw detail that never made it onto the page. Use them as a primary source.
4. Preserve `parent_tested`, `last_visited`, and `visit_ages` frontmatter exactly. Never set `parent_tested: true` yourself — only `/outing` does that.

## Scope

You own one location markdown file only. Do not rewrite unrelated locations, route code, or loaders.

Write into the existing file at:

```text
src/lib/content/locations/{state}/{city-slug}/{slug}.md
```

Preserve required frontmatter fields:

- `id`
- `slug`
- `name`
- `city`
- `state`
- `seeded_at`
- `published_at`

Update:

- `last_modified` to today's date
- `verified_at` to today's date when operational facts are checked
- optional structured fields only when research supports them

Leave `published: false` unless the invocation explicitly asks to publish.

## Research Requirements

Use web research. Prioritize sources in this order:

1. Official website or operating authority
2. Official social accounts for recent closures and seasonal changes
3. County, state, park, museum, or facility pages
4. Recent Google/TripAdvisor/Yelp review patterns for practical parent tips
5. Reddit, local parent blogs, news, and trail databases where relevant

Verify every operational fact that could change: hours, pricing, parking, tickets, outside-food policy, closures, seasonal operations, accessibility, bathrooms, and stroller limitations.

Do not invent. If a detail cannot be verified, leave it out.

## Output Shape

Use the existing headings unless there is a strong reason to add one:

```markdown
## Overview

## What to know before you go

## Tips for families

## Best time to visit

## FAQs

## Helpful links
```

The FAQ format must match the parser:

```markdown
**Question ending in a question mark?**
Answer paragraph.
```

Include 3-8 useful external links in `## Helpful links`. Each link must have a one-clause reason. Do not add review pages there unless there is no official source and the review page is genuinely the best operational source.

## Non-Interactive Mode

Treat the run as unattended if the prompt includes `--unattended`, `--auto`, `--non-interactive`, or if it was called by `/daily-location-blog-creator`.

In unattended mode:

- Do not ask the user questions.
- Make conservative choices.
- Keep `published: false`.
- Add a short HTML comment only if an important limitation needs human review.
- Finish with:

```text
MODE: non-interactive
LOCATION_KEY: md/city-slug/location-slug
FILE: src/lib/content/locations/...
STATUS: draft written, human review required before publishing
LIMITATIONS: none | concise list
```

## Quality Gate

Before saving, self-check:

- At least one official source was used.
- Hours/prices/tickets/parking were checked where applicable.
- There are at least three specific parent tips.
- The page says who should skip this place.
- FAQ has at least five real parent questions.
- Helpful links are live and stripped of tracking parameters.
- No banned brochure phrases from `docs/location-research-brief.md`.
