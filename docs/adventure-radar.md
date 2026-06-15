<!-- docs/adventure-radar.md -->

# Adventure Radar — Design Doc

> **One line:** A button a parent hits anywhere — _"What can we do right now?"_ — that scans the area around them, reads the live conditions, and hands back a ranked, glanceable set of things to do with the kids in the next few hours.
>
> **Status:** Design / pre-build. Companion to [10x-vision.md](./10x-vision.md) and [map-improvements.md](./map-improvements.md).
>
> **In one sentence of lineage:** This is _situational awareness_ — the live, layered, filtered-to-your-intent map the military calls a common operating picture — rebuilt for a parent standing in a parking lot with two restless kids and ninety free minutes.

---

## 1. The problem we're actually solving

The hardest parenting question isn't "where are the good places?" — Tiny Tribe already answers that with curated locations and blog content. The hard question is **situational**:

> _"We have a window. It's drizzling. We've got maybe two hours before the baby naps. We're not at home. Now what?"_

Google Maps can't answer this. It's a directory with routing — it knows _what exists_, not what's _good for a 3-year-old, indoors, close enough, and still open right now_. Nextdoor is a feed. Citizen is fear. **Nobody has built the calm, useful, real-time "what's around me" picture for families** — and that moment happens to a parent dozens of times a year.

Two flavors of the moment carry the whole product:

1. **The weather pivot.** The Saturday plan dies because the sky opened up. Every parent has lived this. Our conditions-aware ranking _is_ the answer: rain → indoor play first, automatically.
2. **The strange-town case.** Visiting grandma, four hours to kill in an unfamiliar city with restless kids. This is where curated + radius + drive-time is magic and Google is hopeless.

Nail those two and Adventure Radar becomes the reason a parent opens Tiny Tribe **twice** — which is the difference between a website and a product.

---

## 2. The vision & end state

**End state:** Adventure Radar is the **personal common operating picture for family adventures.** A parent opens it and, in two seconds, _orients_: here's where I am, here's the bubble I can reach with kids in the car, here's what's worth doing in it right now, already sorted by today's weather, daylight, and the ages of my kids — with the genuinely delightful stuff (a plane passing overhead, a splash pad that's perfect because it's 88°F) surfaced without me asking.

It does three things no competitor does at once:

- **Curation** — a trusted base layer of family-vetted places (the data Tiny Tribe already owns).
- **The merge** — it fuses that curation with free live sources (open map data, weather, events, daylight, aircraft) into one coherent picture. _This is the defensible work._ Anyone can call an API; fusing messy sources into a ranked, age-appropriate, condition-aware answer in real time is the moat.
- **Intent** — it ranks for _the moment you're in_, not for a generic "near me" list.

**Why this is the 10x-for-2x feature:** the expensive parts already exist in this repo — the Mapbox map (`src/lib/components/map/map.svelte`), geolocation with heading (`src/lib/stores/locationStore.ts`), clustering (`map-layers.ts`), location cards (`LocationCard.svelte`), and the curated Supabase location set. Adventure Radar is mostly _new wiring over existing rails_, plus a normalization layer and a ranking pass. We are not building a new app; we are giving the existing map a brain.

---

## 3. What it looks & feels like

### The interaction

1. A single, obvious control floats on the map — a **"What's around us?"** button (radar/target glyph). On mobile it's a fat thumb-target near the bottom.
2. Tap it. The map recenters on the user's live position (`currentLocation`). Three soft **drive-time rings bloom outward** — not dumb mileage circles, but real isochrones ("15 / 30 / 60 min with kids in the car"). The bloom _is_ the loading state: it feels like a scan, not a spinner.
3. As results land, **pins drop in by layer** and a **ranked card stack** slides up from the bottom titled _"Right now near you."_
4. A thin **conditions banner** sits at the top: _"☔️ Light rain · 🌅 2h 14m of daylight left · showing indoor picks first."_ This one line is the soul of the feature — it tells the parent the app _understands the situation_.

### Three scenes

**Scene A — the rainy Saturday.** DJ taps the button at home. Banner: _"Light rain, 41°F — indoor picks first."_ Top three cards are indoor play places within a 20-minute drive, each with a "good for ages 1–5" tag and a one-tap _Add to outing_. The outdoor park two blocks away is _demoted_, not hidden — because the app is smart, not bossy.

**Scene B — the surprise window.** Tuesday, 4:30pm. Banner: _"Clear · only 1h 10m of daylight left — close & outdoors."_ Radar surfaces the nearest playground and a splash pad inside the 15-minute ring, because there's no time to drive far and the sun's about to set.

**Scene C — the strange town.** Visiting family in a city Tiny Tribe has zero curated data for. Radar leans on the live layers (open map playgrounds, libraries, today's family events, a museum) and still hands back a real plan. _The map is never empty._

### The delight cheat

A **"look up!"** layer: live aircraft overhead (free, via OpenSky). It's useless and unforgettable — kids lose their minds over planes, and parents remember the app that created the moment. It costs us almost nothing and it's the screenshot that gets shared.

### Feel, in three words

**Calm. Glanceable. Smart.** No fear, no infinite feed, no fiddling with filters. You read the whole picture in two seconds and you go.

---

## 4. The situational-awareness model (the conceptual core)

Every primitive below maps a military SA concept onto family logic. This is the model the whole feature is built from.

| SA primitive              | What it means here                                        | Source / mechanism                                                                                                |
| ------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Position & heading**    | Where am I, where am I pointed                            | `currentLocation` store (already tracks `lat/lng/heading/accuracy`)                                               |
| **Area of interest (AO)** | The bubble I can actually reach — in _minutes_, not miles | Mapbox **Isochrone API** (driving/walking), 15/30/60 min                                                          |
| **Layers**                | Toggleable _types_ of things, not one flat pile           | indoor play · parks/playgrounds · splash pads · libraries · events · food-with-playground · restrooms · "look up" |
| **Intent filter**         | Show what matters _for this moment_                       | ranking pass over weather + daylight + time-of-day + kid ages (§7)                                                |
| **Freshness / decay**     | Everything is timestamped; stale things fade              | events & weather are live; curated places are evergreen; aircraft expire in seconds                               |
| **Relationships**         | Not just dots — what pairs well, what's clustered         | "playground + coffee nearby," existing clustering, future routing                                                 |
| **Tripwires**             | Tell me when something enters my AO                       | "a new family event opened this weekend within 15 min" (Phase 3 notifications)                                    |
| **Glanceability**         | Read the whole picture in two seconds                     | conditions banner + ranked card stack + layered map                                                               |

---

## 5. Architecture — federated live-query fan-out

We do **not** build an index of the world. We **query sources live, on demand, normalize, rank, and paint** — then cache briefly so repeat taps feel instant. This is deliberately the same shape as a multi-provider integration layer: fan out to N sources with inconsistent/missing APIs, normalize into one schema, reconcile, serve.

```
                         ┌─────────────────────────────────────────┐
  [What's around us?] →  │  GET /api/whats-around                   │
   reads currentLocation │  ?lat&lng&minutes=15,30,60&ages=1,4      │
                         │                                          │
                         │  1. Mapbox Isochrone  → AO polygons      │
                         │  2. fan-out (Promise.allSettled, ~2.5s   │
                         │     per-source timeout):                 │
                         │       • Supabase curated locations (RPC) │
                         │       • OSM Overpass (parks, libraries…) │
                         │       • NWS weather + alerts             │
                         │       • Ticketmaster family events       │
                         │       • OpenSky aircraft (delight)       │
                         │       • suncalc daylight (local, instant)│
                         │  3. normalize → MapEntity[]              │
                         │  4. intent-rank (weather/daylight/ages)  │
                         │  5. cache by geohash-tile (short TTL)    │
                         └─────────────────────────────────────────┘
                                          │
                         ┌────────────────┴───────────────┐
                         ▼                                 ▼
                 map.svelte layers              "Right now near you"
              (GeoJSON sources/pins)             ranked LocationCard stack
                                                  + conditions banner
```

### Where it plugs into the existing code

- **Trigger / position:** read `currentLocation` from `src/lib/stores/locationStore.ts` (already has `lat/lng/heading/accuracy`). Add a `RadarButton.svelte` to the map overlay.
- **Endpoint:** new `src/routes/api/whats-around/+server.ts` (the repo's first real fan-out endpoint).
- **Map render:** extend `src/lib/components/map/map-layers.ts` and `map-features.ts` with a `radarFeatureCollection` and per-layer toggles; reuse clustering.
- **Cards:** reuse `LocationCard.svelte` / `LocationCardSmall.svelte`, driven by the ranked `MapEntity[]`.
- **CTA:** results feed the existing **itinerary** flow (`src/lib/types/itinerary.ts`) — _Add to outing_ is one tap.

### Platform constraints (must design around)

- **Vercel function cap is 10s** (`svelte.config.js`, `nodejs20.x`, `iad1`, 1024 MB). The fan-out must be **parallel with a hard per-source timeout (~2.5s)** via `Promise.allSettled`. A slow source degrades gracefully — it just doesn't show — it never blocks the answer.
- **Caching:** key results by **geohash tile + radius + source** with a short TTL (weather ~10 min, events ~6 h, curated places ~24 h, aircraft = never cached). Start with a Supabase `radar_cache` table or Vercel KV. Caching is what makes the button feel _instant_ on the second tap and keeps us inside free-tier rate limits.
- **Own-location radius query:** add a Supabase RPC `locations_within(lat, lng, meters)` (PostGIS `ST_DWithin`, or a bounding-box prefilter + Haversine sort if PostGIS isn't enabled).

---

## 6. Data sources & APIs

Legitimacy/effort flags: 🟢 free + legal + easy · 🟡 legal but keyed/paid/limited · 🔴 grey/scrape/avoid.

| Source                                            | Layer it powers                                       | How                                                                                    | Auth / cost                 | Freshness | Phase     |
| ------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------- | --------- | --------- |
| 🟢 **Supabase curated locations**                 | Trusted base (the moat)                               | existing DB + new `locations_within` RPC                                               | none (own)                  | evergreen | **1**     |
| 🟢 **Mapbox Isochrone API**                       | AO drive-time rings                                   | `GET /isochrone/v1/mapbox/driving/{lng},{lat}?contours_minutes=15,30,60&polygons=true` | existing `PUBLIC_MAP_KEY`   | n/a       | **1**     |
| 🟢 **NWS `api.weather.gov`**                      | Conditions + alerts (drives ranking)                  | `GET /points/{lat},{lng}` → forecast; `/alerts/active?point=`                          | none (needs `User-Agent`)   | live      | **1**     |
| 🟢 **suncalc** (local)                            | Daylight remaining                                    | `SunCalc.getTimes(now, lat, lng)`                                                      | none (already a dep)        | live      | **1**     |
| 🟢 **OSM Overpass API**                           | Parks, playgrounds, libraries, splash pads, restrooms | POST QL: `node(around:R,LAT,LNG)[leisure=playground];out;`                             | none (rate-limited → cache) | ~days     | **1–2**   |
| 🟡 **Ticketmaster Discovery**                     | Family events nearby                                  | `GET /discovery/v2/events.json?latlong=&radius=&classificationName=family&apikey=`     | free key                    | live      | **2**     |
| 🟢 **OpenSky Network**                            | "Look up!" aircraft overhead (delight)                | `GET /states/all?lamin&lomin&lamax&lomax` (bbox)                                       | anon (rate-limited)         | seconds   | **2**     |
| 🟡 **Socrata / ArcGIS Hub city portals**          | Library story-times, rec events, splash-pad status    | per-city Socrata SoQL APIs                                                             | app token                   | varies    | **3**     |
| 🟡 **macaronikid / local calendars**              | Hyper-local family events                             | ingest (already referenced in README)                                                  | scrape-light/feed           | weekly    | **3**     |
| 🔴 **Facebook Events / Craigslist / Marketplace** | —                                                     | no API, ToS-hostile                                                                    | —                           | —         | **avoid** |

**Note on legality:** the entire MVP (Phase 1–2) runs on free, legal, well-mannered sources. We never need the grey ones for families — the painkiller is _curation + conditions_, not raw volume. Respect each source's terms: send a real `User-Agent` to NWS, cache Overpass aggressively, display Mapbox results on a Mapbox map.

---

## 7. The intent filter (what makes it "smart")

After normalization we have `MapEntity[]`. The ranking pass is where the product's intelligence lives. It's deliberately rules-first (legible, debuggable, free) and can later be augmented by an LLM "explain why" pass.

```
score(entity) =
    base_relevance(entity)                      // curated > open-data; matches kid ages
  + drive_time_bonus(entity)                    // closer (in minutes) ranks higher
  + weather_modifier(entity, conditions)        // rain/cold → indoor +, outdoor −
  + daylight_modifier(entity, minutes_of_light) // low light → outdoor-now +, far −
  + time_of_day_modifier(entity, now)           // near nap/dinner → close & quick +
  + freshness_modifier(entity)                  // a live event happening now +
```

Concrete rules:

- **Rain / < 45°F (NWS):** indoor play, libraries, museums float up; open playgrounds sink (demoted, not hidden).
- **< 90 min of daylight (suncalc):** outdoor-now options inside the _15-min_ ring float up; anything in the 60-min ring sinks.
- **Kid ages (from the request / profile):** age-appropriate tags hard-boost; "big kid only" spots sink for a toddler-aged tribe.
- **Time of day:** within an hour of a typical nap/meal window, bias toward close + quick.
- **Live event happening now/today** inside the AO: gets a freshness boost and a "happening now" badge.

The conditions banner is a _human-readable summary of which modifiers fired_ — that's why it feels like the app "gets it."

---

## 8. The normalization schema

Every source collapses into one shape so the map and cards don't care where data came from.

```ts
// src/lib/types/radar.ts
export type RadarLayer =
	| 'curated' // Tiny Tribe vetted location
	| 'playground'
	| 'park'
	| 'splash_pad'
	| 'library'
	| 'event'
	| 'food_play' // food with a play area
	| 'restroom'
	| 'aircraft'; // the "look up!" delight layer

export interface MapEntity {
	id: string; // stable, source-prefixed: "tta:123", "osm:node/456"
	source: 'tta' | 'osm' | 'ticketmaster' | 'opensky' | 'socrata';
	layer: RadarLayer;
	name: string;
	lat: number;
	lng: number;
	indoor: boolean | null; // drives the weather modifier
	ageTags?: string[]; // e.g. ['0-2','3-5']
	driveMinutes?: number; // which isochrone ring it fell in
	startsAt?: string | null; // events: ISO; null = always-on
	endsAt?: string | null;
	freshAt: string; // when we fetched it (decay/TTL)
	url?: string;
	raw?: unknown; // original payload, for debugging
}

export interface RadarConditions {
	tempF: number | null;
	summary: string; // "Light rain"
	isWet: boolean;
	daylightRemainingMin: number;
	sunsetAt: string; // ISO
	alerts: string[]; // active NWS alerts
}

export interface RadarResult {
	center: { lat: number; lng: number };
	isochrones: GeoJSON.FeatureCollection; // the rings
	conditions: RadarConditions; // → the banner
	entities: MapEntity[]; // already ranked
	generatedAt: string;
	partial: boolean; // true if a source timed out
}
```

---

## 9. Build phases (ship the smallest delightful loop first)

**Phase 1 — the delightful loop (the whole thesis, ~80% existing code).**
Button → Mapbox isochrone rings → curated Supabase locations + OSM parks/playgrounds inside the AO → re-ranked by NWS weather + suncalc daylight → conditions banner + ranked card stack. Two free APIs (Overpass, NWS) and one Mapbox endpoint you already pay for. **This alone proves the product.** Do not build more until this _feels good_.

**Phase 2 — the layers & the delight.** Add family events (Ticketmaster), the "look up!" aircraft layer (OpenSky), toggleable layers on the map, and one-tap _Add to outing_ into the existing itinerary flow. Add geohash-tile caching.

**Phase 3 — the compounding loop.** Tripwires/notifications ("new event in your AO this weekend"), hyper-local calendars (Socrata, macaronikid), **"save & share this scan"** (a shareable adventure plan = built-in distribution), and **travel mode** for the strange-town case. Feed the best scans into the **Thursday email** from [10x-vision.md](./10x-vision.md) — the email becomes _generated_ from real radar data instead of hand-assembled.

---

## 10. The value

**For the parent (why they'll love it):**

- Answers the real question — _"what do we do right now?"_ — at the exact moment of need.
- Removes decision fatigue: it already accounted for the rain, the daylight, the nap, the kids' ages.
- Works in unfamiliar places, so it's the app you reach for _while traveling_, when you need it most.
- Creates moments (the plane overhead, the perfectly-timed splash pad) you remember and screenshot.

**For Tiny Tribe (why it's a business engine):**

- **Retention & frequency.** A directory is visited once; a "what's around me right now" tool is opened every free Saturday. This is the single biggest lever on the metric that matters.
- **A data flywheel.** Every scan + every _Add to outing_ teaches us which places, conditions, and times actually convert — which sharpens curation and the Thursday email.
- **Distribution built in.** "Save & share this scan" turns a private answer into a forwardable artifact — the same compounding mechanic the 10x vision is built on.
- **SEO surface.** Each generated scan/edition becomes an evergreen, deeply-local landing page.

**Why it's defensible (not one-shottable by AI):**
The map is a commodity — Mapbox hands it to anyone, and an AI can scaffold a "pins near me" app in an afternoon. The value is in the parts an AI _can't_ one-shot: a trusted curated base layer you've built by visiting places with your own kids, the real-time **merge** across messy sources, an **intent model** tuned to how a parent actually thinks, and the taste to make the whole thing _calm and glanceable_ instead of a cluttered feed. That judgment is the product. The code is just plumbing.

---

## 11. Open questions & risks

- **Vercel 10s cap.** Mitigated by parallel fan-out + per-source 2.5s timeout + graceful partial results (`partial: true`). Verify the heaviest path (isochrone + Overpass + weather) lands well under budget; if not, split isochrone into its own call.
- **Rate limits & cost.** Overpass and OpenSky are free but rate-limited — caching is mandatory, not optional. Ticketmaster free tier has daily caps. Mapbox isochrone calls count against the Mapbox bill — cache per geohash tile.
- **Cold areas outside the DMV.** Curated data thins out fast beyond DC/MD/DE/VA. Travel mode (Phase 3) must lean harder on the live open-data layers and set expectations ("we don't know this area yet, here's what's public").
- **Mobile GPS UX.** Permission prompts, accuracy, and the "recenter on me" affordance need to feel native. The `currentLocation` store already captures `accuracy` — use it to widen the AO when GPS is rough.
- **Don't over-automate the ranking.** Keep it rules-first and legible at launch. An LLM pass to _write_ the "why we picked this" sentence is a great Phase 2/3 garnish — but the ranking itself should stay debuggable.

---

## Appendix — example endpoint response (abridged)

```jsonc
// GET /api/whats-around?lat=39.16&lng=-76.62&minutes=15,30,60&ages=1,4
{
	"center": { "lat": 39.16, "lng": -76.62 },
	"conditions": {
		"tempF": 41,
		"summary": "Light rain",
		"isWet": true,
		"daylightRemainingMin": 134,
		"sunsetAt": "2026-06-13T20:31:00Z",
		"alerts": []
	},
	"entities": [
		{
			"id": "tta:312",
			"source": "tta",
			"layer": "curated",
			"name": "Earhart's Indoor Playground",
			"lat": 39.17,
			"lng": -76.6,
			"indoor": true,
			"ageTags": ["0-2", "3-5"],
			"driveMinutes": 12,
			"freshAt": "2026-06-13T17:02:00Z",
			"url": "/locations/md/earharts"
		},
		{
			"id": "osm:node/884",
			"source": "osm",
			"layer": "library",
			"name": "Glen Burnie Library",
			"lat": 39.16,
			"lng": -76.61,
			"indoor": true,
			"driveMinutes": 7,
			"freshAt": "2026-06-13T17:02:00Z"
		}
		// ...open playgrounds present but ranked lower because isWet === true
	],
	"isochrones": {
		"type": "FeatureCollection",
		"features": [
			/* 15/30/60-min polygons */
		]
	},
	"generatedAt": "2026-06-13T17:02:01Z",
	"partial": false
}
```
