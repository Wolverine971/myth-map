# Map Improvements — Plan & Tracker

Living checklist for the work to elevate the interactive Mapbox map at `/map` and the split view on `/`. Findings come from a review of `src/lib/components/map/map.svelte`, `map-layers.ts`, `map-features.ts`, `map-icons.ts`, and the consumers in `src/routes/+page.svelte`.

We work this in phases. Phase 1 is the quick-win pass that addresses the user-felt "clusters too close / things feel off" symptoms. Later phases are polish and structural cleanup.

---

## Phase 1 — Quick wins (clustering, bounds, icons, gestures) ✅ DONE

The five highest-impact changes. Should land as a single coherent pass and visibly improve the map immediately.

- [x] **1.1 — Lower `clusterMaxZoom` from 16 → 14**
  - File: `src/lib/components/map/map.svelte:183`
  - Why: With `clusterMaxZoom: 16`, two pins ~40px apart on screen stay merged into a "2" bubble even at street zoom. Dropping to 14 lets individual pins reveal at neighborhood/street level, which is what users expect.

- [x] **1.2 — Simplify the cluster-click zoom logic**
  - File: `src/lib/components/map/map.svelte:407-415`
  - Why: The current code does `Math.min(zoom + 2, 16)` to "boost" zoom for big clusters. With `clusterMaxZoom` lowered to 14 the boost becomes both unnecessary and self-defeating (the clamp can match the source's max and refuse to break the cluster). Replace with: just fly to `zoom` returned by `getClusterExpansionZoom`, with a small `+0.5` nudge so the cluster visibly cracks open.

- [x] **1.3 — Add `maxBounds` and raise `minZoom` to 5**
  - File: `src/lib/components/map/map.svelte:108-120` (Map constructor)
  - Why: The site is a DC/MD/DE/VA regional guide. Today users can zoom to z3 and pan to the Pacific. Bound the map to roughly `[[-83, 36], [-74, 41]]` and clamp `minZoom: 5`. Keeps the map feeling like a regional tool.

- [x] **1.4 — Fix icon anchoring + scale icons by zoom**
  - File: `src/lib/components/map/map-layers.ts:130-140` (`unclusteredPointLayer`)
  - Why: `'icon-anchor'` defaults to `'center'`, so the pin sits centered on the coordinate instead of pointing to it with its tip. Set `'icon-anchor': 'bottom'`. Also replace fixed `'icon-size': 0.12` with a zoom-interpolated expression (e.g., `0.10` at z10 → `0.16` at z16) so pins feel right at all zooms.

- [x] **1.5 — Delete redundant `clusterProperties`**
  - File: `src/lib/components/map/map.svelte:185-187`
  - Why: `point_count_abbreviated` is a built-in Mapbox cluster property. Re-defining it via `clusterProperties: { point_count_abbreviated: ['+', ['get', 'point_count']] }` is dead code. Drop the entire `clusterProperties` key.

**Acceptance check for Phase 1:** Open `/map` on desktop and mobile. Two pins at the same intersection should de-cluster by zoom 14. The pin tip should land on the location. The map should stop panning at the regional bounds. No console warnings.

---

## Phase 2 — Mobile gestures & viewport polish ✅ DONE

- [x] **2.1 — Replace `scrollZoom.disable()` with `cooperativeGestures: true`**
  - Files: `src/lib/components/map/map.svelte:108-120` (constructor) and `map.svelte:478-485` (`optimizeForMobile`)
  - Why: The current approach hard-disables scroll-zoom under 768px, which also kills wheel-zoom on tablets. Mapbox's `cooperativeGestures: true` is the modern fix — shows "Use two fingers to move the map" on touch and "Use ⌘+scroll to zoom" on desktop, handling both cases without breaking pinch.
  - Side effect: `optimizeForMobile()` mostly goes away — keep `dragRotate.disable()` and the rotation lock if we still want to suppress rotation on phones.

- [x] **2.2 — Make popup `flyTo` offset viewport-aware**
  - File: `src/lib/components/map/map.svelte:436-447`
  - Why: `offset: [0, -100]` is a fixed pixel offset that pushes the pin off-screen on short viewports (iPhone SE landscape, in-app browsers with toolbars). Compute as a fraction of `map.getCanvas().clientHeight` (e.g., `-Math.min(100, height * 0.18)`).

- [x] **2.3 — Tighten `fadeDuration`**
  - File: `src/lib/components/map/map.svelte:119`
  - Why: 300ms reads slightly sluggish for label transitions. 150–200ms feels snappier without flicker.

---

## Phase 3 — Cluster visual & interaction polish

- [ ] **3.1 — Hover affordance on clusters**
  - Files: `map.svelte:387-395` (event listeners) and `map-layers.ts:71-86` (cluster paint)
  - Why: Clusters only change cursor on hover — no visual feedback. Add a feature-state-driven stroke bump (e.g., `'circle-stroke-width': ['case', ['boolean', ['feature-state', 'hover'], false], 4, 2.5]`) and wire `mousemove`/`mouseleave` handlers that set/clear feature state by `cluster_id`.

- [ ] **3.2 — Re-tune cluster step thresholds**
  - File: `src/lib/components/map/map-layers.ts:30-69`
  - Why: First bucket is labeled "1–4" but Mapbox only clusters at 2+, so it's really "2–4". Reconsider whether the thresholds (5, 10, 25, 50) match the actual density distribution in our data — if most clusters are 2–8, shift the ramp so color variance lives where users see it.

- [ ] **3.3 — Use Promise form of `getClusterExpansionZoom`**
  - File: `src/lib/components/map/map.svelte:407-415`
  - Why: Stylistic. Modern Mapbox returns a Promise. Lets us drop the callback and use `await`.

---

## Phase 4 — Performance & rendering

- [ ] **4.1 — Investigate `.map { visibility: visible !important }`**
  - File: `src/lib/components/map/map.svelte` (style block, ~line 501)
  - Why: `!important` is a smell. It's likely fighting a parent rule from Tailwind/Flowbite or a layout transition. Trace the source and remove the override.

- [ ] **4.2 — Confirm `optimizeDeps` exclusion of `@mapbox/mapbox-sdk` is still needed**
  - File: `vite.config.ts`
  - Why: Per `CLAUDE.md`, the SDK is excluded from optimizeDeps. Verify this is still load-bearing — if not, delete the exclusion to simplify config.

- [ ] **4.3 — Audit icon PNG sizes**
  - Folder: `static/map/`
  - Why: With `icon-size: 0.12` the source PNGs are ~8x larger than rendered. If they're 256–512px each, we're shipping bytes we never see. Resize to 2x of max display size (e.g., target render ≤ 48px → source ~96px).

---

## Phase 5 — Style swap robustness

- [ ] **5.1 — Order layers explicitly after style swap**
  - File: `src/lib/components/map/map.svelte:147-174` (`swapMapStyle`)
  - Why: After `setStyle`, layers re-add in source order, but city/state polygons should sit _under_ clusters and pins. Pass an explicit `beforeId` when re-adding to lock the stack.

- [ ] **5.2 — Restore focus ring filter atomically with style swap**
  - File: `src/lib/components/map/map.svelte:162-173`
  - Why: There's a frame between layers being added and `syncFocusRing` running where the ring shows on the wrong feature. Apply the filter inside the same `style.load` callback before any paint.

---

## Reference — Files touched

- `src/lib/components/map/map.svelte` — Map constructor, event handlers, popup, geolocate, style swap
- `src/lib/components/map/map-layers.ts` — Layer factories, cluster palette, icon layer config
- `src/lib/components/map/map-features.ts` — Feature collection builder
- `src/lib/components/map/map-icons.ts` — Lazy icon loader
- `src/routes/+page.svelte` — Map consumer (split + map-only views)
- `vite.config.ts` — Mapbox optimizeDeps exclusion (Phase 4)

---

## Out of scope (for now)

- Search-as-you-pan / viewport-aware filtering
- Heatmap layer for very dense areas
- Marker clustering at the data layer (Supabase RPC) instead of client-side
- Offline tile caching
- Custom map style (forking outdoors-v12 in Mapbox Studio)

These are all worth doing eventually; not in this sweep.
