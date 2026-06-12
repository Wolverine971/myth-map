# Field notes

Raw brain dumps from real family outings, captured by the `/outing` command. One file per outing, named `YYYY-MM-DD-<primary-place-slug>.md`.

**These files are never edited after capture.** They are the ground truth; everything else — the `## Parent field note` section on location pages, `parent_tested` frontmatter, email-queue items, friend snippets — is derived from them and can be rebuilt at any time.

A page may only carry `parent_tested: true` if a file in this directory documents the visit.

The flow:

```text
outing → /outing brain dump → archive here (verbatim)
       → Parent field note section on the location page
       → override.forceNext bump (unwritten pages jump tonight's cron)
       → email-queue item (3 items = next "3 places" email is ready)
       → text-a-friend snippet
```

See `.claude/commands/outing.md` for the full pipeline and `docs/10x-machine-snowball.md` for why this exists.
