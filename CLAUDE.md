# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tiny Tribe Adventures (tinytribeadventures.com) is a SvelteKit application that helps families discover adventure locations across DC, Maryland, Delaware, and Virginia. It features an interactive Mapbox-powered map, Supabase-backed user accounts, itinerary planning, and admin location management.

## Key Commands

```bash
pnpm dev                # Vite dev server
pnpm build              # Production build (Vercel adapter)
pnpm preview            # Preview production build
pnpm check              # svelte-kit sync && svelte-check (type check)
pnpm check:watch        # Type check in watch mode
pnpm lint               # prettier --check . && eslint .
pnpm format             # Prettier write
pnpm label-paths        # Run labelFilePaths.ts to add/refresh `// path/to/file` headers in source files
```

There is no test framework configured. Package manager is **pnpm** (>=7.13), Node **>=18** (deploy target Node 20).

### Regenerating Supabase types

The Database type is imported from `src/schema.ts` (see `src/app.d.ts`). To regenerate:

```bash
npx supabase gen types typescript --project-id "ivskdkbujlthefzqdkdl" --schema public > src/schema.ts
```

Note: `src/schema.ts` is gitignored / generated; do not hand-edit. The previous CLAUDE.md referenced `src/DatabaseDefinitions.ts` — that file does not exist; use `src/schema.ts`.

## Architecture

### Tech Stack
- **SvelteKit 2 + Svelte 4 + TypeScript**, Vite 5
- **Tailwind 3** + Flowbite Svelte + lucide-svelte
- **Supabase** (`@supabase/ssr` for server, `@supabase/supabase-js` for browser) for auth + Postgres
- **Mapbox GL JS** + `@mapbox/mapbox-sdk` for the interactive map and geocoding
- **mdsvex** for `.svx` / `.md` blog content
- **Vercel adapter** — runtime `nodejs20.x`, region `iad1`, 1024 MB, 10s max duration (configured in `svelte.config.js`)

### Path aliases (svelte.config.js)
- `$components` → `src/lib/components`
- `$ui` → `src/lib/ui`
- `$utils` → `src/lib/utils`
- Standard SvelteKit `$lib`, `$app/*`, `$env/*` are also available.

### Auth flow (`src/hooks.server.ts`)
Two handles run via `sequence(supabase, authGuard)`:
1. `supabase` — creates a per-request server client, populates `event.locals.supabase`, `getUser`, `safeGetSession`. `safeGetSession` validates the JWT via `getUser()` (do not trust `getSession()` alone).
2. `authGuard` — redirects unauthenticated users away from `/private/**` to `/auth`, and authenticated users away from `/auth` to `/private`.

`event.locals` types live in `src/app.d.ts` (`App.Locals`). The browser-side singleton lives in `src/lib/supabaseClient.ts`. Prefer `event.locals.supabase` in `+page.server.ts` / `+layout.server.ts` so cookies flow correctly.

### Data layer
- Server `+page.server.ts` / `+layout.server.ts` files load locations, tags, and `location_tags` from Supabase.
- `src/lib/stores/dataManager.ts` is a singleton that mirrors that data into `localStorage` via `cacheStore.ts` (`CacheKeys`, `CacheTTL`). It exposes derived stores for `locations`, `tags`, `locationTags`, plus `cityDataCache` (per-state city lists, lazy-imported from `src/geographies/cities/<state>/index.json`) and `searchCacheManager`.
- When mutating location/tag data, call `dataManager.invalidateLocations()` (or appropriate cache key) so the next load refetches.

### Geographic data
- `src/geographies/cities/<state>/<city>.json` and `src/geographies/states/*` hold GeoJSON for boundaries.
- `geoJsonPlugin.js` is a Vite transform that **decimates GeoJSON polygon rings to every 10th coordinate at build/transform time** for any imported `.json`. This is destructive simplification — if you need full-fidelity coordinates for a JSON import, fetch it at runtime instead of importing it.
- `vite-plugin-generate-city-index.js` + `generateCityIndex.js` exist to (re)build city `index.json` files. The plugin is currently commented out in `vite.config.ts`; run `node generateCityIndex.js` manually if you add cities.

### Build config notes (`vite.config.ts`)
- `assetsInlineLimit: 0` — assets stay as separate files (matters for icon SVGs).
- Manual chunk: `vendor-ui` bundles `flowbite-svelte` + `flowbite-svelte-icons`.
- `@mapbox/mapbox-sdk` is excluded from `optimizeDeps` and should be loaded on demand.
- Sourcemaps are enabled in production builds.

### Routes overview
- `/` — landing
- `/map` — main interactive Mapbox view
- `/locations`, `/locations/add`, `/locations/states`, `/locations/zipcodes` — browse/add
- `/itineraries`, `/trips` — trip planning (uses `svelte-dnd-action`)
- `/admin`, `/admin/users` — admin tools
- `/account`, `/login`, `/register` — auth/account
- `/blog` — mdsvex content (`src/blog/`)
- `/api/comments`, `/api/send-calendar-invites`, `/api/send-invites` — server endpoints (Google APIs via `googleapis` lib)
- `/sitemap.xml` — dynamic sitemap; `prerender.entries` in `svelte.config.js` includes `'*'`, `/blog`, `/locations`

### Theme colors
- Primary Forest Green `#014421`
- Secondary Sandstone `#D2B48C`
- Accent Sky Blue `#87CEEB`
- Tertiary Rustic Orange `#CD5700`

### Required env vars
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

(Public prefix is `PUBLIC_` per `svelte.config.js`. Server-only Google credentials are needed for the calendar/invite endpoints.)

## Conventions

- Source files start with a `// path/to/file` header comment, maintained by `pnpm label-paths`. Re-run after large moves/renames.
- Prefer `event.locals.supabase` in `*.server.ts` files over the browser singleton.
- Always use generated types from `src/schema.ts` for Supabase queries.
- Mobile-first responsive design — check small breakpoints first.
- Map icons live in `static/images/icons/`; the location-type → icon mapping is in components, not a central registry — search before adding a new type.
