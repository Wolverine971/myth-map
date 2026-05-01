# Location Research Brief

Hand this document to a research agent (or use it yourself) before filling out a location markdown file at `src/lib/content/locations/{state}/{city}/{slug}.md`. It defines what to look for, where to look, how to write, and what good output looks like.

## Mission

Turn a thin stub into the single best page on the internet for a parent deciding whether to bring their kids to this place. Not a brochure. Not an SEO listicle. A trusted-friend brief.

## Audience

The reader is one of:

- **Tired weekend parent at 9am**, kids already bored, deciding right now whether to drive 20 minutes for this place. Wants logistics first, vibes second.
- **Trip planner**, two weeks out, building an itinerary. Wants hours, cost, age fit, and how long it actually takes.
- **First-time visitor with toddlers**, anxious about the unknowns: stroller? changing tables? snacks allowed? meltdown escape routes?

Every section should pass the "would this answer the question I'd text my friend?" test.

## The research checklist

Gather these data points before writing. Not all will apply to every location — note what doesn't apply, but don't invent. **If you cannot verify something, leave it out. Never guess.**

### Logistics (must-have)

- **Hours** — by day of week. Note seasonal differences (summer vs winter). Last admission vs closing.
- **Cost** — exact prices for adults, kids, toddlers, infants. Note free days, member rates, group discounts. Hidden costs (parking, lockers, special exhibits).
- **Address + getting there** — the actual entrance (sometimes different from the mailing address). Nearest highway exit.
- **Parking** — free or paid? Lot or street? How early does it fill on weekends? Any overflow lots? Stroller-distance from parking to the activity?
- **Reservations / tickets** — required, recommended, or walk-up? Online vs at-door price difference? Refund policy?
- **Accessibility** — wheelchair / stroller paths? Stairs-only sections? ADA bathrooms? Sensory-friendly hours?
- **Bathrooms** — yes/no, where, clean reputation, changing tables, family rooms, nursing space.
- **Food** — on-site cafe, vending, picnic-allowed, outside food rules, nearby food options.
- **Cell signal / wifi** — relevant for parents working or for emergency contact.

### Family fit

- **Age sweet spot** — what age range gets the most out of it? When do kids age out? When are kids too young?
- **Time investment** — minimum to feel "worth it" (45 min? 2 hours?), maximum before kids melt down (3 hours? all day?).
- **Indoor vs outdoor** — what portion of the visit is each? Weather contingency.
- **Stroller / wagon** — fully usable? partial? not at all?
- **Carrier-friendly** — for under-2s.
- **Crowd profile** — who shows up? local families, tourists, school groups, retirees, party renters?

### What makes it special

- **The thing people come for** — the headline activity. Be specific.
- **Hidden gems** — the parts most visitors miss.
- **Photo spots** — without being cynical about it.
- **Seasonality** — does it change a lot by season? Is there a "best time of year"?
- **Companion places** — what parents pair it with on the same trip (food, another park, a museum).

### Tips that actually help

These are the gold. The "what we wish we'd known" tier.

- "Park in lot B — lot A fills by 10am Saturdays."
- "The splash pad shuts off at 6pm sharp."
- "Bring water shoes — gravel hurts."
- "The free playground is behind the paid zoo gate; you can use it without paying."
- "Avoid the 11am Saturday crush from birthday parties."
- "There's a quiet shaded bench behind exhibit 4 — best meltdown recovery spot."
- "Bring quarters for the lockers / the train ride / the binoculars."

If you can find five of these for a location, the page is already worth visiting.

### Cautions / honest mediocrity

- Common complaints (read between the entitled-Yelp-reviewer noise).
- What this place is *not* good for (e.g., "not great for under-3s", "skip if you hate crowds").
- Closures, renovations, or known issues currently affecting the visit.

Saying a place isn't right for everyone builds trust. Don't oversell.

## Where to research

In rough order of trust:

1. **Official website** — hours, prices, calendar, FAQs, accessibility page. Treat these as authoritative *but* check the timestamp/recency.
2. **Official social media (last 30 days)** — closures, weather changes, new exhibits, real-time gotchas.
3. **Google Maps reviews** — sort by *most recent*. Search the review text for "kids", "stroller", "parking", "bathroom". 4-star reviews are usually more honest than 5-star.
4. **Reddit** — search `"<place name>" with kids` and the local subreddit (`r/baltimore`, `r/maryland`, `r/washingtondc`, etc.). Long threads beat headlines.
5. **TripAdvisor / Yelp** — filter to "families" / "with kids". Skim, don't trust any single review.
6. **Local mom blogs / Facebook mom groups** — gold for tactical tips. Search `"<place name> site:macaronikid.com"` etc.
7. **County / parks-and-rec sites** — hours, programs, alerts for public parks.
8. **AllTrails / Hiking Project** — for trail-based locations (length, elevation, stroller-friendliness).
9. **Atlas Obscura / local newspapers** — for quirks and history that make the page interesting.
10. **Recent news** — closures, ownership changes, scandals, renovations.

### Source hygiene

- **Recency matters more than depth.** Hours and prices change. Prefer info from the last 6–12 months. Anything older, verify.
- **Three-source rule for facts.** Don't put a price or an hour in the page based on a single source. Cross-check at least one against the official site.
- **Distinguish facts from opinions.** "Closed Mondays" is a fact. "Best playground in Howard County" is an opinion — only quote if widely echoed and clearly framed.
- **Beware of stale review patterns.** A "they raised prices and now it's awful" review from 2019 isn't useful in 2026.

## Voice and tone

- **Mom-friend-text voice.** Practical, warm, specific, occasionally dry. Not bubbly. Not corporate.
- **Concrete over abstract.** "Bring water shoes" beats "wear appropriate footwear." "Park in lot B" beats "ample parking available."
- **First-person plural is fine but optional.** "We've found weekday mornings are quietest" is OK; the page doesn't need to pretend a specific family wrote it.
- **Don't oversell.** If something is mid, say what it is and isn't. Trust compounds.
- **No invented testimonials.** No "Sarah, mom of three, says…" unless Sarah actually said it somewhere we can link.
- **Skip the cliche openers.** Do not write "Looking for a fun family activity?" or "Located in the heart of…" Cut anything that sounds like a brochure.
- **One job per sentence.** Long sentences with three clauses are a smell — split them.

### Words and phrases to avoid

- "Fun for the whole family" — meaningless.
- "Hidden gem" — overused; show, don't claim.
- "Something for everyone" — almost never true.
- "Nestled," "boasts," "showcases" — brochure language.
- "Memories that will last a lifetime" — burn it.
- AI-hedge words: "might," "could," "may want to," "perhaps." If we don't know, leave it out.

## Output structure

Each location markdown file already has a frontmatter block and stub headings. Use those headings; don't invent new top-level sections without reason.

```markdown
## Overview

## What to know before you go

## Tips for families

## Best time to visit

## FAQs
```

### Overview (1–2 short paragraphs)

What it is. Who it's for. What makes it different from the other 50 places like it. Lead with specifics, not adjectives. End with a sentence about who *shouldn't* bother (e.g., "skip if your kids are under 3 — most of it is too physical").

### What to know before you go (skimmable list)

The logistics block. Bullets, not prose. Cover (where applicable):

- Hours (with seasonal notes)
- Cost (broken down by age / type)
- Tickets / reservations
- Parking
- Bathrooms / changing tables
- Food rules
- Stroller-friendliness
- Accessibility
- What to bring (sunscreen, water shoes, quarters, snacks, sun hat)

If a row doesn't apply, omit it. Don't write "Parking: N/A."

### Tips for families (the gold tier)

5–10 specific tips. Each one should answer "what do I wish I'd known?" Bullet form. No fluff.

If a section can't honestly hit 3+ specific tips, it's better to leave fewer than to pad.

### Best time to visit

- Time of day: early-bird advantages, late-day shifts.
- Day of week: weekday vs weekend split.
- Season: when does it shine, when is it skippable.
- Weather contingency: indoor backup? closed in rain? splash pad season?

### FAQs

5–8 questions parents actually ask. Mine real review threads for these. Examples:

- Is there parking?
- How long should we plan for?
- Can I bring my own snacks?
- Is it stroller-friendly?
- Is there a place to nurse / change a baby?
- Is it appropriate for a [age]-year-old?
- Are dogs allowed?
- Is it okay in the rain?

Answers should be 1–3 sentences. If "we don't know," skip the question — don't fake an answer.

## Quality bar

A page is ready to flip `published: true` when:

- Every fact in it is verified against at least one trustworthy source, with at least one fact cross-checked against the official site.
- It contains at least 3 specific, tactical tips that aren't on the official site.
- The tone passes the "mom-friend-text" test on a re-read.
- It tells the reader what the place is *not* good for, in addition to what it is good for.
- It does not contain any invented quotes, testimonials, or family anecdotes.
- It does not contain any of the banned phrases above.

## Frontmatter and publishing flow

Don't touch the existing frontmatter shape. Specifically:

- Update `last_modified` to today's date (`YYYY-MM-DD`) any time you make a meaningful edit.
- Leave `published` as `false` until the page meets the quality bar above. Then flip to `true` and run `pnpm content:sync` — that auto-fills `published_at`.
- `seeded_at` never changes. It's the "first created" timestamp.
- `id`, `slug`, `name`, `city`, `state` are derived from `locations.json` and managed by the sync script. Don't hand-edit them.

## Anti-patterns (real examples to avoid)

**Bad:**

> Located in the heart of Baltimore, the Maryland Science Center is a fun-filled destination that offers something for everyone! Whether you're looking for a rainy day activity or a memorable family outing, you'll find a hidden gem inside this iconic building.

This is brochure goo. Cut every word.

**Better:**

> Three floors of hands-on physics and biology exhibits in Inner Harbor, plus a planetarium and an IMAX. Sweet spot is ages 4–10; younger kids will need a lot of supervision around the higher exhibits, and tweens get bored after about 90 minutes unless there's a special exhibit on.

That's specific, useful, and tells the reader who it's for and who it isn't.

---

## Workflow shortcut for AI agents

When asked to enrich a location:

1. Read this brief end-to-end before starting.
2. Read the current markdown file at the location's path.
3. Run searches in the order in the "Where to research" section, taking notes on each data point in the checklist.
4. Cross-check the official site for at least one logistic fact before writing.
5. Draft the page using the existing section headings.
6. Self-review against the quality bar checklist before saving.
7. Update `last_modified` to today's date. Leave `published` as `false` for human review unless explicitly told otherwise.
