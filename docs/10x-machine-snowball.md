# Tiny Tribe Adventures — The Machine Snowball

> Companion to [10x-vision.md](./10x-vision.md) (the north star) and
> [10x-snowball-plan.md](./10x-snowball-plan.md) (the low-effort loop).
>
> This doc corrects the one thing the snowball plan got wrong: it was written
> as if DJ does the work. DJ already built a machine that does the work.

---

## The core finding

The snowball plan prescribes a "45-minute week" of manually upgrading pages.
But this repo already runs a **daily cron** (`scripts/run-daily-location-blog-creator.sh`)
where Claude researches and writes location guides automatically. The output
quality is already at "parent-tested voice" level — shade warnings, parking
fallbacks, "no swings here" caveats — and every page carries structured
frontmatter (`rainy_day_ok`, `stroller_friendly`, `sensory_load`, `pair_with`,
`season_best`).

So the real state of the project, per `docs/blog-automation/backlog-queue.json`:

- 57 locations, 24 written, **12 drafted but unpublished**
- A machine that produces ~1 quality page per day
- **Zero distribution surfaces**: no email capture (the footer has a TODO
  comment, nothing more), no submission form, no topic pages
- Structured frontmatter that nothing on the site surfaces or aggregates

**The bottleneck is not content production. It is that the machine writes and
nothing ships, captures, or compounds.** Content is being produced into a
warehouse with no front door.

The corrected strategy:

> DJ is the **sensor** (real outings, 3-minute notes) and the **approver**
> (5-minute monthly review). The machine is the worker. Every recurring task
> in the snowball plan either gets automated into the existing cron, or gets
> cut.

---

## DJ's total recurring effort under this plan

This is the entire human commitment:

1. **After a real outing** (only when one happens): record a 3-minute voice
   memo or phone note using the field-note template. Drop it in the inbox
   (see Move 3). That's it — no laptop.
2. **Monthly, ~10 minutes**: approve the machine-drafted "3 places" email and
   skim what the cron published that month.
3. **Quarterly, one human-only act**: text five parent friends a link, or
   leave printed cards at one venue. The things a machine genuinely can't do.

Everything else below is **one-time setup**, done as Claude Code sessions
where DJ supervises rather than works. Order matters — each move is ranked by
(compounding value ÷ setup cost).

---

## Move 1 — Open the valve (highest ROI, near-zero cost)

The machine has produced 12 finished drafts that aren't published. That's
3 months of snowball sitting in inventory.

- [ ] Review and publish the 12 drafted-unpublished pages (one session:
      Claude batch-checks each for accuracy red flags, DJ skims, flip
      `published: true`).
- [ ] Confirm published pages are in the sitemap and getting indexed.
- [ ] Add a "publish gate" step to the daily cron skill: a draft that passes
      audit (word count, sections, FAQ count — the audit data already exists
      in the queue JSON) gets published automatically; only failures wait
      for review.

After this move, the existing cron compounds **on its own**: every day, one
more indexed, useful page, zero human minutes.

## Move 2 — Build the front door (one session each, then permanent)

The site captures no demand. Two surfaces, both one-time:

- [ ] **Email capture** — footer + location-page callout, wired to Resend or
      Buttondown. Copy from the snowball plan ("occasional parent-tested
      outing ideas — three practical picks when I have good ones"). No weekly
      promise.
- [ ] **One-place submission form** — a no-code form (Tally) embedded or
      linked: "Send one place your kids loved." The key field: _what should
      another parent know before going?_ Submissions land in email; the cron
      can later fold them into the backlog queue automatically.

## Move 3 — Feed the machine ground truth (the moat-saver)

This is the most important move strategically. The honest risk in the current
setup: the daily automation produces well-_researched_ pages, but the moat in
both vision docs is parent-_tested_. Pure automation drifts toward exactly
what the snowball plan warns against ("generic AI-written roundups") — better
written, but missing the one thing competitors can't copy: _we actually went._

The fix is an ingestion path for DJ's 3-minute captures:

- [ ] Create `docs/field-notes/inbox/` — DJ drops raw voice-memo transcripts
      or pasted phone notes there (or emails them to himself with a known
      subject; the cron can read either).
- [ ] Extend the daily cron skill: if the inbox has a note, process it FIRST —
      match it to its location page, render it as a visually distinct
      **"Parent field note"** callout (Best for / Watch out for / First 10
      minutes), set a `parent_tested: true` frontmatter flag, and queue the
      place as a candidate email item.
- [ ] Pages with `parent_tested: true` get priority placement everywhere —
      topic pages, pair-with links, the email. The machine writes the base
      layer; DJ's notes are the trust layer on top.

One outing → one 3-minute note → the machine turns it into the five assets
the snowball plan wanted (better page, email item, shareable snippet,
citable page, submission prompt). DJ's marginal cost per asset: ~36 seconds.

## Move 4 — Compound the data already being captured

Every page already ships structured facts that nothing aggregates. One-time
code, then it grows automatically as the cron adds pages:

- [ ] **Topic pages generated from frontmatter** — `rainy_day_ok` × city →
      "Rainy-day spots in Columbia"; `stroller_friendly` × county; `season_best`.
      These are exactly the query-shaped pages the AI/search-source play
      needs, and they update themselves as new locations land. Start with
      3–5 for the Howard County wedge, not a combinatorial explosion.
- [ ] **Render `pair_with` as visible cross-links** ("Make it a day") on
      location pages — the loader already reads the field.
- [ ] **Schema.org audit** — SEOHead already exists; one session to verify
      location pages emit complete `LocalBusiness`/`Place` + FAQ markup from
      frontmatter, then it applies to every future page for free.
- [ ] **Email archive as evergreen pages** — when the monthly email ships,
      the cron also commits it as a "3 places for [use case]" post.

## Move 5 — Automate the email itself

- [ ] Monthly scheduled job: draft the "3 places" email from (a) field-noted
      pages first, (b) recently published pages second. Use the snowball
      plan's plain-text format. Save as a draft — **never auto-send**.
- [ ] DJ's monthly 10 minutes: read draft, tweak one sentence so it sounds
      like him, send.
- [ ] Gate (unchanged from snowball plan): don't send until there are 10+
      subscribers; until then the draft doubles as the text-to-friends
      message.

---

## What this changes vs. the snowball plan

| Snowball plan said                             | Machine snowball says                                                                                                                              |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 45-minute manual week upgrading pages          | The cron upgrades pages daily; DJ's week is 0 minutes unless an outing happened                                                                    |
| "Capture beats polish" — write rough notes     | Same, but the note is the _only_ writing DJ ever does                                                                                              |
| Build product surfaces only after manual proof | Mostly right, but wrong for topic pages & schema — those are one-time code against data **already captured**, cheaper to build than to do manually |
| Monthly 2-hour packaging session               | Machine drafts; DJ approves in 10 minutes                                                                                                          |
| Phase gates by manual traction                 | Same gates, kept verbatim                                                                                                                          |

What survives untouched: the geography wedge (Howard County first), the
no-weekly-promise rule, the decision gates, the guiding sentence, all the
copy templates. Those were right.

The one rule this doc adds:

> **Nothing publishes claiming to be parent-tested unless a human note is
> behind it.** Machine pages are honest research; field-noted pages are the
> moat. Never blur the two — the blur is what kills trust in every
> competitor site.

---

## Setup sequence (each = one supervised Claude Code session)

1. Publish the 12-draft backlog + auto-publish gate in the cron. _(~1 hr)_
2. Email capture + submission form. _(~1–2 hrs)_
3. Field-note inbox + cron ingestion. _(~1–2 hrs)_
4. Topic pages + pair-with links + schema audit. _(~2 hrs)_
5. Monthly email drafter. _(~1 hr)_

Roughly one focused weekend of supervision total. After that, the recurring
human cost of the entire growth plan is: notice things on family outings,
talk into a phone for 3 minutes, and spend 10 minutes a month pressing send.
