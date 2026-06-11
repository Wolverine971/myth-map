# Tiny Tribe Adventures — Promotion Strategy

## Context

- **Inventory**: ~57 location pages across ~20 Maryland cities (Baltimore corridor heavy). Only 2 blog posts.
- **Real footprint**: Maryland is the wedge, not full DMV. Expand after MD partnerships compound.
- **Audiences chosen**: Local family bloggers/influencers, local press, partner locations + schools/PTAs.
- **Primary ask**: Cross-promote / partner.
- **Starting assets**: None — building from zero.

## Strategic thesis

The highest-leverage move is **partner cross-promo with locations we already feature**. They're warm (we already link to them), the ask is reciprocal (we feature them deeper, they mention us), and each newsletter mention reaches exactly the right audience. Press and bloggers come _after_ we have partnership social proof.

---

## Phase 1 — Foundation (1–2 days, before any email goes out)

- [ ] **Press/partner one-pager** hosted at `/press`: tagline, map screenshot, founder story, location count, audience, contact.
- [ ] **Pull canonical location list** from `src/lib/content/locations/md/**` + Supabase `locations` table, enriched with public contact emails / website URLs. This becomes the Phase 2 target list.
- [ ] **Set up Resend** (or equivalent) with a dedicated sending domain (e.g., `hello@tinytribeadventures.com`) plus SPF / DKIM / DMARC. Cold email from `gmail.com` is dead on arrival.
- [ ] **UTM-tagged tracking URLs per audience** so we can attribute conversions per channel.

## Phase 2 — Partner locations first (warmest, fastest yes)

The only place to start. For each of the 57 locations:

> "Hey, we feature [National Aquarium] on tinytribeadventures.com and families are discovering you through our map. Want to make it official? We'll publish a richer feature + social post about you — in exchange, would you mention us in your next newsletter / link from your visitor resources page?"

- **Why it works**: ask is concrete (newsletter mention OR backlink), reciprocal, and they're already on the site so it's not cold.
- **Realistic conversion**: 5–15% reply, 3–8 active partnerships.
- **Payoff**: each newsletter mention = hundreds to thousands of impressions to exactly the right audience.
- **Segmentation**: tailor template per location type (museum vs. park vs. attraction vs. private business).

## Phase 3 — Bloggers (after Phase 2 produces social proof)

DMV family blog target list to build:

- Kid Friendly DC
- Our Kids
- Maryland Family magazine
- DC Mom Crowd
- Red Tricycle DC
- Instagram: `@dcfamilyfun`, `@baltimorewithkids`, similar

Pitch: guest post swap + mutual links. ~20–30 personalized emails, expect 2–4 partnerships.

## Phase 4 — Press + schools/PTAs (lower priority, slower payoff)

- **Press**: needs a _story angle_, not a cross-promote. Wait until partnership wins exist, then pitch e.g. "local startup partners with 10 MD museums to help families…". Targets: DCist, Washingtonian, Baltimore Sun, Washington Post On Parenting.
- **Schools/PTAs/libraries**: offer free seasonal "family adventure" content for their newsletters. Slow but durable distribution.

---

## What to skip for now

- **No press in Phase 1** — with 2 blog posts and no partnerships, there's no story. They'll ignore it.
- **No full DMV** — Maryland is the real footprint. Expand after compounding.
- **No mass blasts** — cross-promote asks have to be personalized. 57 individually-tuned emails > 500 templated ones.

---

## Recommended first work block

Start with **Phase 1 + Phase 2 prep**:

1. Build the partner-location email list (pull names, websites, contact emails from location data + light enrichment).
2. Draft personalized email templates per location type (museum / park / attraction / private business).
3. Set up Resend with proper sending domain config.
4. Build the `/press` one-pager.

## Open questions before sending

1. **Sending domain** — `hello@tinytribeadventures.com` or alternative?
2. **Founder story** — one paragraph on why you built this (must come from you; it's the most important line in the pitch).
3. **Inventory source** — include Supabase `locations` table in the list, or just the markdown files?

## Success metrics

- Phase 2: % reply rate, # active partnerships, # newsletter mentions secured, referral traffic from UTM links.
- Phase 3: # blog features, backlinks, referral signups.
- Phase 4: press mentions, school/PTA newsletter placements.
