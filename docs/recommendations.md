# Tiny Tribe Adventures — Recommendations

A roadmap of ideas to make this an amazing activity finder for families. Sequenced roughly by impact.

## Context

- ~250+ curated locations sitting in `src/lib/data/locations.json`
- Mapbox interactive map and a flat `/locations` city-grouped list
- Blog scaffolding via mdsvex (`ParentSurvivalKit.md`, `template.md`) — barely used
- `CLAUDE.md` describes a richer app (itineraries, trips, admin, Supabase auth, multi-state) than what's actually in `src/routes/` today. Decide whether to rebuild that scope or stay lean before investing further.

## Top recommendation

**Bring back the city / county / individual place pages first.** That's the single biggest lever for an activity finder — it turns a curated dataset into hundreds of high-intent SEO landing pages. Everything else compounds off it.

---

## 1. Programmatic SEO pages (do this first)

You have ~250 places × cities × counties × tags. That's hundreds of high-intent landing pages you're leaving on the table.

- `/locations/md/baltimore/science-center` — individual place page, with hours, parking, age range, what to bring, nearby spots, embedded map
- `/locations/md/baltimore` — city hub linking all places, plus a short "what families love about Baltimore" intro
- `/locations/md/howard-county` — county roll-up
- Tag × geo combos: `/things-to-do/indoor-activities-near-me`, `/free-playgrounds-baltimore`, `/rainy-day-activities-dc`
- Generate statically at build (locations are already JSON, prerender is on) — fast, cheap, no DB needed

## 2. Make the data family-specific (the differentiator)

Generic activity sites already exist. Parents want answers Google doesn't surface. Add fields like:

- Age ranges (0–2, 3–5, 6–9, 10+) per place
- Stroller / wagon friendly, changing tables, nursing space, shade
- Bathrooms, food on-site, parking notes, free vs paid breakdown
- Best time to go (weekday morning vs Saturday chaos)
- "How long to plan for" (45 min vs half-day)

## 3. Generated blog posts — only if they're genuinely useful

AI-generated "Top 10 things to do" posts are the lowest-ROI content on the internet right now. What works:

- One post per place with real parent-tested tips, FAQs, "what we wish we'd known"
- Round-ups anchored to a real itinerary ("A perfect Saturday in Annapolis with toddlers")
- Seasonal: pumpkin patches, cherry blossoms, holiday lights — these rank fast and refresh yearly

## 4. Two killer features for retention

- **"Near me, right now"** with weather awareness — rainy → indoor suggestions, hot → splash pads. Parents on a Saturday morning at 9am with bored kids is your entire user base.
- **Itineraries / saved trips** — `CLAUDE.md` says you had these. They're the difference between a directory (visit once) and a tool (come back weekly).

## 5. Smaller wins

- Email digest: "5 things to do this weekend near [zip]" — very high open rates for parents
- User submissions and a "report this is closed" flow — keeps data fresh as you scale
- `LocalBusiness` / `TouristAttraction` JSON-LD on each place page (Google loves it, easy ranking boost)
- Internal linking: every place links to its city + county + 3 nearby places

---

## Suggested first week

If picking just one week of work: rebuild the per-location and per-city pages with proper schema markup and internal linking. That alone could 5–10× organic traffic over 3 months given the curation is already done.
