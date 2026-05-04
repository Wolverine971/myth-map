# Location content roadmap

Tracks the work to level up the family location guides at
`src/lib/content/locations/**/*.md`. Most of the prose is in good shape — the
gap is structured data, media, and connections to the rest of the app.

Update this doc as items ship or new gaps surface.

---

## Shipped

These landed together with the first level-up pass.

### Frontmatter accessibility & sensory flags

Optional fields on every location markdown file. All default to "unset" so
existing files keep working without backfill. See
`src/lib/content/frontmatter.ts` for the canonical type.

| Field                   | Values                        | Notes                                                      |
| ----------------------- | ----------------------------- | ---------------------------------------------------------- |
| `stroller_friendly`     | `yes` / `partial` / `no`      | Whether the experience itself rolls, not just the parking. |
| `wheelchair_accessible` | `yes` / `partial` / `no`      | Same — the activity, not just the building.                |
| `nursing_room`          | `true` / `false`              | Dedicated room or family/companion restroom.               |
| `changing_table`        | `true` / `false`              | At least one on-site.                                      |
| `noise_level`           | `quiet` / `moderate` / `loud` | Typical visit, not the worst case.                         |
| `sensory_load`          | `low` / `moderate` / `high`   | Lights, crowds, transitions, unpredictability.             |

### Frontmatter season / weather flags

| Field          | Values                           | Notes                                                      |
| -------------- | -------------------------------- | ---------------------------------------------------------- |
| `season_best`  | `[spring, summer, fall, winter]` | Optional. Omit if year-round.                              |
| `rainy_day_ok` | `true` / `false`                 | Would you bring kids here in steady rain?                  |
| `hot_day_ok`   | `true` / `false`                 | 90°F+ test. Shade, AC, water all count.                    |
| `cold_day_ok`  | `true` / `false`                 | Sub-freezing test. Indoor or genuinely warm-tolerant only. |

### Frontmatter pairings

`pair_with: [md/catonsville/charlsies-bakehouse]` — array of
`state/city-slug/slug` keys (the same keys the loader indexes by). Renders as a
"Pair with" section above "Nearby places" on the slug page. Editorial picks,
not auto-distance.

### Verification surface

`verified_at: 2026-05-01` on the frontmatter. Renders below the article body as
"Operational details verified May 2026. Hours and prices drift — confirm on the
official site before you drive."

Distinct from `last_modified` (which moves on any edit) and `published_at`
(which never changes after first publish). Bump `verified_at` only after
re-checking hours, prices, parking, and food/café state.

### FAQPage schema

The `## FAQs` section in each post is parsed at build time into JSON-LD on the
page (`FAQPage` → `Question` → `acceptedAnswer`). Markdown is stripped to plain
text in the schema; the visible HTML keeps its links and formatting.

Format the parser expects:

```markdown
## FAQs

**Question phrased as a question?**
Answer paragraph.

**Next question?**
Next answer.
```

Blank line between Q/A blocks. Do not put extra subheadings inside `## FAQs`.

### Quick facts card on the slug page

A grid card on `/locations/[state]/[city]/[slug]` that surfaces every populated
accessibility / sensory / weather field as a labeled value or badge. Hidden if
the location has no quick-facts data set yet — so backfill is incremental and
never produces an empty box.

---

## Backfill in progress

Three example locations have full frontmatter today:

- `md/baltimore/science-center.md`
- `md/catonsville/hilton-tire-park.md`
- `md/jessup/monster-mini-golf.md`

The other ~55 locations have prose but no structured flags. Backfill is being
done by re-reading each post and lifting the facts the prose already states.
Don't invent flags for locations whose prose doesn't support them — leave them
unset and let the Quick Facts card stay hidden.

---

## Not yet shipped — Tier 1 (soon)

- **Hero image + photo gallery per location.** No image system yet. The slug
  page renders pure prose, which is the single biggest UX gap. Shape: a hero
  field in frontmatter pointing at a path under `static/images/locations/`,
  plus an optional `gallery: [...]` array. Lazy-load below the fold.
- **Family-of-4 cost line** in the Overview or Quick Facts. One sentence, e.g.
  "Family of 4: ~$104 + $14 parking." No structured field needed yet — just a
  prose convention until pricing is standardized.
- **Sticky / mobile-friendly Quick Facts.** The card is currently inline. On
  mobile, parents scrolling on the playground would benefit from collapsible or
  sticky access to it.
- **More pairings.** Each major city (Baltimore Inner Harbor, Ellicott City,
  Catonsville, Columbia) has obvious editor-pick combos. Add `pair_with` on
  another 10–15 high-traffic locations.

---

## Not yet shipped — Tier 2 (medium effort)

- **Standardize hours and prices into frontmatter fields** so they can power
  filters and `openingHours` / `priceRange` schema. User-acknowledged this is
  slow / will happen gradually as posts are re-verified. Until then, hours and
  prices stay in prose.
- **Sitewide accessibility filter** on `/locations` and `/locations/[state]`:
  e.g. "stroller-friendly", "sensory-low", "indoor". Powered by the new
  frontmatter flags. Wire once ~30+ locations are backfilled.
- **"What should we do today?" feature.** Combine current weather (or a
  user-toggle) with `rainy_day_ok` / `hot_day_ok` / `cold_day_ok` and
  `indoor_outdoor` to surface a short list. Single highest-value derivative
  feature once flags are populated.
- **Tween/teen alternative** at the bottom of any post whose `ages_recommended`
  caps at ~10. One curated link, not a full list.
- **`ages_recommended` as a structured field.** Prose mentions "ages 5 to early
  tweens" but it's not filterable. Possible shape: `ages_min: 5`, `ages_max: 12`.
  Skipped in this pass to stay focused.

---

## Not yet shipped — Tier 3 (bigger investments)

- **Video walkthroughs.** First-person POV walk-throughs are extremely high
  utility for sensory-sensitive families. 30–60 second silent tours.
- **User-submitted tips and photos.** Supabase auth already exists. Light
  version: a single "Was this still accurate?" prompt that pings on N reports.
- **Verified-working pings.** Parents who recently visited tap "still
  accurate as of [date]" — bumps a community-verified date independent of
  `verified_at`.
- **Itinerary-builder integration.** "Add to a trip" CTA on the slug page that
  drops the location into `/itineraries`. Hooks up `pair_with` as the suggested
  next stops.
- **Stroller / wheelchair / sensory icon overlays on the map.** Once flags are
  backfilled, surface them as filter toggles on `/map`.
- **Email/SMS "verify this post" prompt** sent to the editor when
  `verified_at` is older than 6 months. Stale-content dashboard fed by the same
  date.

---

## Conventions

- Keep backfill **conservative**. If the prose doesn't already support a flag,
  leave the flag unset rather than guessing.
- `verified_at` is editorial trust, not a content-edit timestamp. Don't bump it
  for typo fixes. Bump it only after re-checking the operational facts on the
  official site.
- New frontmatter fields should be optional and additive. The loader, sync
  script, and serializer all skip undefined values, so older files keep
  working without churn.
- The `## FAQs` section is now load-bearing for SEO/AEO. Keep the
  `**Question?**` / answer pattern intact. New posts can have anywhere from 4
  to ~12 Q/A pairs.
