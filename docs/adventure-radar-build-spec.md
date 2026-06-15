<!-- docs/adventure-radar-build-spec.md -->

# Adventure Radar - Build Spec

Status: Phase 1 external-discovery MVP implemented v0.3 - 2026-06-15
Source design doc: [adventure-radar.md](./adventure-radar.md)

## 1. Review Notes

The product direction is strong: the feature should answer "what can we do right now?" from the map, using the user's live position, current conditions, and nearby family-friendly places. The design doc is directionally right about the interaction model and the ranking pass.

There are a few repo reality checks we need to account for before building:

- The current app is static-location driven. `src/routes/+page.server.ts` loads `src/lib/data/locations.json`; there is no active Supabase client, generated `src/schema.ts`, auth hook, or `@supabase/*` dependency in `package.json`.
- There is no current `/map` route. The map lives on `/` as part of list/split/map view modes through `src/routes/+page.svelte` and `src/lib/components/map/map.svelte`.
- `src/lib/types/itinerary.ts` only defines interfaces. There is no implemented itinerary route, store, mutation endpoint, or "Add to outing" workflow yet.
- The current curated data has `indoor_outdoor`, `type`, coordinates, website, and tags, but not reliable hours. Phase 1 should avoid claiming "open now" unless a source explicitly supplies hours.
- `suncalc` and Mapbox are already available. The Mapbox env var in this repo is `PUBLIC_MAP_KEY`, not `PUBLIC_MAPBOX_TOKEN`.
- Vercel's 10 second function cap in `svelte.config.js` makes hard per-source timeouts mandatory.

Build implication: Phase 1 should stay shippable inside the existing JSON-location app, but the radar result set should be external-first. Curated Tiny Tribe locations remain a trusted source, while OSM, Wikipedia, Wikidata, Ticketmaster, and OpenSky are first-class discovery providers with per-source timeouts and skip/error metadata.

## Implementation Status

Phase 1 is implemented on the existing `/` page. The shipped slice includes the `/api/whats-around` endpoint, source fan-out with per-source timeouts, in-memory result cache, static curated-location search, OSM discovery, Wikipedia geosearch, Wikidata notable places, optional Ticketmaster family events, optional OpenSky aircraft, NWS weather, SunCalc daylight, Mapbox isochrone rings, deterministic ranking, map radar layers, radar pins/popups, conditions banner, ranked tray, clear/focus behavior, provider labels, provider skip notes, and compact layer toggles.

Verification completed:

- `pnpm check` - passes with 0 errors and 0 warnings.
- `pnpm lint` - passes.
- `pnpm build` - passes. Build still reports existing non-fatal SvelteKit/Svelte `untrack` warnings and a large chunk warning.
- Local smoke test at `http://localhost:5178/` - homepage renders and the radar tray opens from `SCAN MAP AREA`.
- Local smoke test for default discovery layers returns `200`, ranked Tiny Tribe plus external-provider results, source-status metadata, and `partial: true` when a public provider times out.
- Event-layer smoke test without `TICKETMASTER_API_KEY` returns `200` with `ticketmaster: skipped` and a visible provider note.
- Aircraft-layer smoke test returns `200` with OpenSky aircraft entities when OpenSky responds.
- Invalid coordinate request - returns `400` with `Invalid lat`.
- Browser check confirms external source labels, layer toggles, partial-source banner, and the Ticketmaster missing-key note render in the tray.

Deferred by design: durable cache, Supabase/PostGIS radius search, client local radar cache, itinerary add flow, Socrata/ArcGIS Hub sources, exact per-result travel times, and full mobile breakpoint visual QA.

## 2. MVP Goal

Ship a map-first "What's around us?" scan that:

- Uses geolocation from `currentLocation`.
- Fetches drive-time rings from Mapbox Isochrone.
- Finds external nearby places through OSM, Wikipedia, and Wikidata by default.
- Keeps nearby curated Tiny Tribe locations from `src/lib/data/locations.json` as a blended source rather than the only source.
- Optionally supplements with Ticketmaster family events and OpenSky aircraft when those layers are enabled.
- Fetches NWS weather and calculates daylight.
- Ranks the merged result set with a transparent rules engine.
- Displays a conditions banner, drive-time rings, radar pins, and a ranked tray.
- Degrades gracefully when any live source times out.

MVP non-goals:

- User accounts, saved scans, reminders, tripwires, and notifications.
- Socrata, ArcGIS Hub, and local-calendar ingestion.
- Exact route durations per result. Use isochrone ring buckets for Phase 1.
- "Open now" guarantees.
- Supabase/PostGIS migration, unless data migration is explicitly prioritized first.

## 3. User Stories

- As a parent already looking at the map, I can tap one obvious control to scan around my current position.
- As a parent with a rainy-day problem, I see indoor places ranked ahead of outdoor places without manually changing filters.
- As a parent near sunset, I see close outdoor options boosted and far outdoor options demoted.
- As a parent with weak GPS or a slow API source, I still get a useful partial answer instead of a failed scan.
- As a parent on mobile, I can read the banner, top results, and map in one glance without overlapping controls.

## 4. Proposed Architecture

### Server route

Add:

- `src/routes/api/whats-around/+server.ts`
- `src/lib/types/radar.ts`
- `src/lib/server/radar/config.ts`
- `src/lib/server/radar/geo.ts`
- `src/lib/server/radar/cache.ts`
- `src/lib/server/radar/curated.ts`
- `src/lib/server/radar/mapbox.ts`
- `src/lib/server/radar/nws.ts`
- `src/lib/server/radar/osm.ts`
- `src/lib/server/radar/daylight.ts`
- `src/lib/server/radar/rank.ts`
- `src/lib/server/radar/normalize.ts`

The endpoint orchestrates a bounded fan-out:

1. Validate query params.
2. Start Mapbox isochrone, NWS, OSM, Wikipedia, Wikidata, optional Ticketmaster, optional OpenSky, curated-location, and daylight work in parallel.
3. Apply per-source `AbortController` timeouts.
4. Normalize source payloads into `RadarEntity[]`.
5. Assign each entity to a drive-time ring.
6. Rank entities.
7. Return a `RadarResult` with source health metadata.

### Client state and components

Add:

- `src/lib/stores/radarStore.ts`
- `src/lib/components/radar/RadarButton.svelte`
- `src/lib/components/radar/RadarConditionsBanner.svelte`
- `src/lib/components/radar/RadarResultsTray.svelte`
- `src/lib/components/radar/RadarResultCard.svelte`
- `src/lib/components/radar/RadarLayerToggles.svelte`

Extend:

- `src/lib/components/map/map.svelte`
- `src/lib/components/map/map-layers.ts`
- `src/lib/components/map/map-features.ts`
- `src/routes/+page.svelte`

The page owns the radar store and passes the current radar result into the map. The map owns Mapbox source/layer synchronization. The tray owns card rendering and hover/select state for radar entities.

## 5. API Contract

Request:

```http
GET /api/whats-around?lat=39.2141&lng=-76.7818&minutes=15,30,60&ages=1,4&layers=curated,playground,park,library,splash_pad,restroom
```

Validation:

- `lat`: required number, `-90..90`
- `lng`: required number, `-180..180`
- `minutes`: optional comma list, default `15,30,60`, allowed `5..60`
- `ages`: optional comma list of child ages, allowed `0..17`
- `layers`: optional comma list of enabled radar layers
- Reject requests with impossible coordinates or more than 3 contours.
- Clamp any search radius derived from minutes to a conservative max, initially 80 km.

Response:

```ts
export type RadarSource =
	| 'tta'
	| 'mapbox'
	| 'nws'
	| 'suncalc'
	| 'osm'
	| 'wikipedia'
	| 'wikidata'
	| 'ticketmaster'
	| 'opensky'
	| 'socrata';

export type RadarLayer =
	| 'curated'
	| 'playground'
	| 'park'
	| 'splash_pad'
	| 'library'
	| 'museum'
	| 'attraction'
	| 'event'
	| 'food_play'
	| 'restroom'
	| 'aircraft';

export interface RadarEntity {
	id: string;
	source: RadarSource;
	layer: RadarLayer;
	name: string;
	lat: number;
	lng: number;
	indoor: boolean | null;
	address?: string | null;
	city?: string | null;
	state?: string | null;
	url?: string | null;
	ageTags?: string[];
	driveMinutes?: 15 | 30 | 60 | null;
	distanceMiles?: number;
	startsAt?: string | null;
	endsAt?: string | null;
	freshAt: string;
	score: number;
	reasons: string[];
	raw?: unknown;
}

export interface RadarConditions {
	tempF: number | null;
	summary: string;
	isWet: boolean;
	isHot: boolean;
	isCold: boolean;
	daylightRemainingMin: number;
	sunsetAt: string | null;
	alerts: string[];
}

export interface RadarSourceStatus {
	source: RadarSource;
	status: 'ok' | 'cached' | 'timeout' | 'error' | 'skipped';
	durationMs?: number;
	message?: string;
}

export interface RadarResult {
	center: { lat: number; lng: number };
	minutes: number[];
	isochrones: GeoJSON.FeatureCollection;
	conditions: RadarConditions;
	entities: RadarEntity[];
	sourceStatus: RadarSourceStatus[];
	generatedAt: string;
	partial: boolean;
	cacheKey: string;
}
```

## 6. Data Sources

### Phase 1 sources

Curated Tiny Tribe locations:

- Source file: `src/lib/data/locations.json`.
- Filter by bounding box first, then Haversine distance.
- Normalize `location.indoor_outdoor` into `indoor`.
- Normalize `location.type`, tags, and name patterns into radar layers.
- Use existing `hrefForId(id)` where possible for details links.

Mapbox Isochrone:

- Use `PUBLIC_MAP_KEY`.
- Fetch server-side from `/isochrone/v1/mapbox/driving/{lng},{lat}`.
- Request `contours_minutes=15,30,60&polygons=true`.
- Use returned polygons for map rings.
- Use point-in-polygon checks to assign entities to the smallest containing ring.

NWS:

- Call `/points/{lat},{lng}` to discover forecast URLs.
- Fetch current-ish forecast period and active alerts.
- Send a real `User-Agent`.
- Add a private env var for production contact info, for example `RADAR_USER_AGENT`.

SunCalc:

- Use existing `suncalc` dependency.
- Calculate sunset and daylight remaining in server code.

OSM Overpass:

- Query a layer-scoped set:
  - `leisure=playground`
  - `leisure=park`
  - `amenity=library`
  - `amenity=toilets`
  - `amenity=cafe`
  - `amenity=ice_cream`
  - `shop=ice_cream`
  - `shop=bakery`
  - `tourism=museum`
  - `tourism=attraction`
  - `tourism=theme_park`
  - `tourism=zoo`
  - `tourism=aquarium`
  - `tourism=picnic_site`
  - `leisure=splash_pad` where present
  - `playground=splash_pad` where present
- Keep radius conservative and cache aggressively.
- Treat names as optional. Use a generic label only when necessary.

Wikipedia:

- Use MediaWiki geosearch for fast, keyless nearby notable pages.
- Current title classification maps to museum, attraction, park, and library layers.
- Link directly to the English Wikipedia page.
- Keep this source bounded to 50 results and a 10 km radius.

Wikidata:

- Use WDQS geospatial search for notable nearby places.
- Current classes map to museum, attraction, and park layers.
- Prefer an English Wikipedia article URL when present, otherwise link to the Wikidata entity.
- Keep this source bounded to 50 results and rely on per-source timeouts because WDQS can be slower than OSM.

Ticketmaster Discovery:

- Optional source gated by `TICKETMASTER_API_KEY`.
- Only called when the `event` layer is enabled.
- Uses `classificationName=family`, date ascending, and a conservative radius.
- Missing key returns a skipped source note instead of failing the scan.

OpenSky:

- Optional source called only when the `aircraft` layer is enabled.
- Uses a bounding-box query derived from the scan radius.
- Short TTL keeps aircraft data fresh without hammering the public endpoint.

### Phase 2+ sources

- Socrata/ArcGIS Hub for city-specific events and splash-pad statuses.
- Macaroni KID or local calendars only through legal feeds or manually approved ingestion.

## 7. Ranking Model

Keep ranking deterministic and inspectable. Every score contribution should produce a short reason code.

Initial weights:

```ts
score =
	baseSourceScore +
	layerScore +
	driveRingScore +
	weatherScore +
	daylightScore +
	ageScore +
	freshnessScore;
```

Suggested starting rules:

- Curated Tiny Tribe place: `+28`
- OSM public place: `+30`
- Ticketmaster family event: `+32`
- Wikipedia nearby page: `+28`
- Wikidata notable place: `+28`
- OpenSky aircraft: `+12`
- Museum: `+14`
- Attraction: `+12`
- Food/snack stop: `+8`
- Event: `+16`
- Aircraft: `+6`
- Indoor on wet/cold day: `+25`
- Outdoor on wet/cold day: `-20`
- Splash pad or water play above 85 F: `+20`
- Outdoor inside 15 minute ring with under 90 minutes of daylight: `+20`
- Any 60 minute ring result with under 90 minutes daylight: `-20`
- 15 minute ring: `+25`
- 30 minute ring: `+12`
- 60 minute ring: `+4`
- Library on wet/cold day: `+20`
- Unknown indoor/outdoor status during bad weather: `-5`, not a hard penalty.

Banner text should be generated from fired modifiers, not hand-written independently. Examples:

- `Light rain, 41 F - indoor picks first.`
- `Clear - 1h 10m of daylight left, close outdoor picks first.`
- `Hot afternoon - splash pads and indoor breaks boosted.`

## 8. Map Rendering

Add dedicated Radar sources rather than mixing with `shownLocations`:

- `radar-isochrones`
- `radar-entities`

Add layers:

- `radar-isochrone-fill`
- `radar-isochrone-outline`
- `radar-clusters`
- `radar-cluster-count`
- `radar-unclustered-point`
- Optional `radar-selected-ring`

Layering:

- Isochrone fills sit above base map and below existing location markers.
- Radar pins sit above existing location markers while the scan tray is active.
- Existing `shownLocations` remains untouched so normal filtering continues to work.

Icons:

- Reuse existing map images where available:
  - `playground.png`
  - `park1.png`
  - `splash-pad.png`
  - `library.png`
  - `mythmap.png`
- Use a simple circle fallback for layers without an icon.

Interaction:

- Click radar pin: select matching radar card and open a compact popup.
- Hover radar card: set a radar focus ring on the map.
- Clear scan: remove radar sources/layers or set them to empty collections.

## 9. UI Requirements

Radar button:

- Visible only when map is visible or immediately switches the user into map mode.
- Uses a radar/target icon from the existing icon library if available.
- Mobile thumb target near the bottom of the map, above the results tray safe area.
- States: idle, locating, scanning, partial, error.

Conditions banner:

- One line when possible.
- Shows weather summary, temperature, daylight, and ranking rationale.
- If weather fails, show daylight-only copy and mark the result partial.

Results tray:

- Mobile: bottom sheet with a collapsed peek and draggable/scrollable body.
- Desktop split view: right or bottom panel depending on available space.
- First screen should show top 3 results without extra taps.
- Cards show name, layer, drive ring, why this ranked, and a details/website CTA.
- Do not show "Add to outing" until the itinerary implementation exists.

Layer toggles:

- MVP can default to all Phase 1 layers.
- If included in Phase 1, keep toggles compact: curated, outdoor, indoor, facilities.

Empty states:

- No curated results but external results exist: "We do not have Tiny Tribe guides here yet, but public family places are nearby."
- No live source results: show closest curated locations within a larger fallback radius.
- Geolocation denied: ask the user to enable location or use the map center as the scan point.

## 10. Caching

Phase 1A:

- Server in-memory cache, best effort only.
- Result and source caches are keyed by rounded coordinates and request options.
- This improves repeat taps in a warm server process but does not guarantee rate-limit protection on serverless cold starts.

Phase 1B before broad production use:

- Add durable cache via Vercel KV or a Supabase `radar_cache` table.
- Cache by rounded tile key, minutes, enabled layers, and source.
- Do not store precise raw user coordinates.

Suggested TTLs:

- Isochrone: 24 hours.
- Curated locations: 15 minutes while static JSON is the source, 24 hours after durable cache.
- OSM: 24 hours.
- Wikipedia: 24 hours.
- Wikidata: 24 hours.
- Ticketmaster: 15 minutes.
- OpenSky: 30 seconds.
- NWS forecast: 10 minutes.
- NWS alerts: 5 minutes.
- SunCalc: no remote cache needed.

## 11. Privacy And Safety

- Do not persist exact scan coordinates in Phase 1.
- Round cache keys to a coarse tile.
- Avoid logging full-precision lat/lng in server logs.
- The UI must clearly communicate partial results when live data fails.
- Weather alerts should inform ranking and banner text, but avoid alarmist styling.

## 12. Build Breakdown

### Phase 0 - Repo alignment

- [x] Decide whether Phase 1 uses static JSON or starts with a Supabase migration. Decision: static JSON first.
- [ ] Confirm production `PUBLIC_MAP_KEY` has Isochrone access.
- [x] Add `RADAR_USER_AGENT` or equivalent to `.env.example`.
- [x] Decide whether radar launches from `/` map mode or gets a dedicated route later. Decision: launch from `/`.

### Phase 1A - Backend slice

- [x] Add `src/lib/types/radar.ts`.
- [x] Add query validation for `/api/whats-around`.
- [x] Add Haversine, bounding-box, and point-in-polygon helpers.
- [x] Add Mapbox Isochrone provider with timeout.
- [x] Add NWS forecast/alerts provider with timeout.
- [x] Add SunCalc provider.
- [x] Add static curated-location provider.
- [x] Add OSM Overpass provider with layer-scoped fetching.
- [x] Add Wikipedia geosearch provider.
- [x] Add Wikidata notable-place provider.
- [x] Add optional Ticketmaster family-events provider.
- [x] Add optional OpenSky aircraft provider.
- [x] Add normalization helpers for curated, OSM, Wikipedia, Wikidata, Ticketmaster, and OpenSky entities.
- [x] Add ranking engine with reason codes.
- [x] Add source-status metadata and partial-result behavior.
- [x] Add lightweight route-level checks through local endpoint smoke tests.

### Phase 1B - Client slice

- [x] Add `radarStore.ts` with idle/loading/success/error states.
- [x] Add `RadarButton.svelte`.
- [x] Add `RadarConditionsBanner.svelte`.
- [x] Add `RadarResultsTray.svelte`.
- [x] Add `RadarResultCard.svelte`.
- [x] Add `RadarLayerToggles.svelte`.
- [x] Wire scan trigger into `src/routes/+page.svelte`.
- [x] Add radar props/events to `map.svelte`.
- [x] Add radar sources and layers to `map-layers.ts`.
- [x] Add radar GeoJSON builders to `map-features.ts`.
- [x] Add radar pin click and card hover synchronization.
- [x] Add clear-scan behavior.

### Phase 1C - UX polish and hardening

- [ ] Mobile layout QA for map-only and split views.
- [ ] Loading animation using isochrone/ring bloom, with reduced-motion fallback. Current implementation uses tray skeleton loading.
- [x] Partial-source messaging.
- [x] Empty-state copy.
- [x] Keyboard focus and screen-reader labels.
- [ ] Error telemetry/logging that does not expose precise location.
- [x] `pnpm check`, `pnpm lint`, `pnpm build`, and route-level smoke verification.

### Phase 2 - Delight and conversion

- [x] Add layer toggles if deferred from Phase 1. Completed in Phase 1.
- [ ] Add durable cache.
- [ ] Add Socrata/ArcGIS Hub municipal data providers.
- [ ] Build actual "Add to outing" workflow.
- [ ] Add top-N exact route duration lookup if Mapbox costs are acceptable.

### Phase 3 - Compounding loop

- [ ] Saved/shareable scans.
- [ ] Notification tripwires.
- [ ] Travel mode outside curated regions.
- [ ] Local calendar ingestion.
- [ ] Thursday email integration from radar scan data.
- [ ] SEO-safe generated pages for selected public scans.

## 13. Acceptance Criteria For Phase 1

- [x] Tapping "What's around us?" scans the current user location when available and falls back to the current map center when GPS is unavailable.
- [x] If Mapbox, NWS, OSM, Wikipedia, or Wikidata times out, the endpoint still returns available results and `partial: true`.
- [x] The map can render 15/30/60 minute rings from Mapbox when Isochrone responds.
- [x] Curated indoor places outrank outdoor places when NWS reports wet or cold conditions.
- [x] Outdoor nearby places outrank far places near sunset.
- [x] Existing list/map filters continue to work after clearing a scan.
- [ ] Mobile view has no overlapping geolocation, radar, tray, and Mapbox controls. Needs visual QA in Browser/Playwright.
- [x] The UI never claims a place is open unless the source provides hours.
- [x] `pnpm check` passes.
- [x] `pnpm lint` passes.
- [x] `pnpm build` passes.

## 14. Open Questions

- Where should child ages come from before accounts/profiles exist: a small local preference picker, query params only, or no age ranking in MVP?
- How much Mapbox Isochrone usage is acceptable before durable caching is mandatory?
- Which contact email should be used in the NWS `User-Agent`?
- Should OSM be enabled by default at launch or limited to explicit layers while source quality is reviewed?
- Should a dedicated `/radar` route be added after the `/` integration proves useful?
