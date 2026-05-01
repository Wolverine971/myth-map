# SEO Posture & Action Plan

_Last reviewed: 2026-05-01_

This doc captures Tiny Tribe Adventures' current SEO posture, the gaps we
found in audit, and the concrete plan to fix them. It is meant to be a
living document — update it as things land.

## Goals

- Make every page we _do_ have crawlable, properly described, and consistently canonicalized.
- Get the dynamic content (state / city / location pages) into the sitemap so search engines actually discover it.
- Avoid thin / duplicate content penalties for pages that don't have real guide content yet.
- Set the foundation so that when we eventually publish guide markdown, those pages start with maximum SEO benefit.

## Current state at a glance

**Working:**

- Per-page meta via `src/lib/components/shared/SEOHead.svelte` (title, description, canonical, OG, Twitter, theme-color).
- `WebSite` JSON-LD on the homepage.
- `TouristAttraction` JSON-LD on each location detail page (with `PostalAddress` + `GeoCoordinates`).
- `BreadcrumbList` JSON-LD inside the `Breadcrumbs.svelte` component.
- All `/locations/**` routes are statically prerendered at build time.
- `robots.txt` exists with a sitemap reference.

**Broken or missing:**

- Sitemap only contains 5 static URLs — no states, no cities, no locations, no blog posts.
- `noIndex={true}` is passed to `SEOHead` from `+error.svelte` but the prop doesn't exist, so error pages currently say "index, follow".
- Apex vs www mismatch (see below).
- Homepage `WebSite.potentialAction` points at `/search?q=…`, which is not a real route.
- State / city / detail pages hand-roll their breadcrumb HTML, so the `BreadcrumbList` schema in `<Breadcrumbs />` never fires for them.
- No global `Organization` schema.
- 58/58 location markdown files are `published: false`. Each detail page renders a placeholder body, but it's still indexable. **(Content work — deferred, see below.)**

## Domain canonicalization

`tinytribeadventures.com` and `www.tinytribeadventures.com` are two different
URLs to search engines. Right now:

- `static/robots.txt` declares the sitemap on `www.tinytribeadventures.com`.
- `SEOHead.svelte` builds canonicals against `tinytribeadventures.com` (apex).
- `src/routes/sitemap.xml/+server.ts` emits `<loc>` URLs against the apex.

**Decision:** apex is canonical. Everything will point at `tinytribeadventures.com`.

**To finish this, we need (in Vercel, outside the repo):**

1. In the Vercel project's _Domains_ settings, ensure `www.tinytribeadventures.com` is a **redirect** to `tinytribeadventures.com` (not a separate alias).
2. Verify with `curl -I https://www.tinytribeadventures.com` — should return `301 Location: https://tinytribeadventures.com…`.

In the repo:

1. Update `static/robots.txt` to use the apex form for the sitemap declaration.

After that, all three references (canonical tags, sitemap `<loc>`s, robots.txt sitemap line) match.

## What we're fixing now

Scope: code-only fixes that improve the SEO posture for the data we already
have. No content work, no Markdown publishing.

### 1. Sitemap covers all dynamic content

**File:** `src/routes/sitemap.xml/+server.ts`

- Import `listEntries`, `statesAvailable`, `citiesInState` from `src/lib/content/loader.ts`.
- Emit URLs for:
  - Static pages we already have (`/`, `/locations`, `/about`, `/contact`, `/blog`).
  - One URL per state from `statesAvailable()`.
  - One URL per city from `citiesInState(state.slug)` for each state.
  - One URL per location from `listEntries()`.
- Use each entry's `frontmatter.last_modified` as `<lastmod>` instead of today's date for everything.
- Drop pages from the sitemap if their underlying entry is unpublished (see #5).

### 2. Add real `noIndex` support to `SEOHead`

**File:** `src/lib/components/shared/SEOHead.svelte`

- Add `export let noIndex = false;`.
- Conditionally emit `<meta name="robots" content="noindex, nofollow">` when true, else current `index, follow`.
- This unbreaks the existing usage in `src/routes/+error.svelte:79`.
- Also use it from #5 below.

### 3. Align canonical host

**Files:** `static/robots.txt`

- Change the `Sitemap:` line to `https://tinytribeadventures.com/sitemap.xml`.
- (Vercel-side redirect is the other half — see Domain canonicalization above.)

### 4. Fix homepage JSON-LD

**File:** `src/routes/+page.svelte`

- Remove the `potentialAction` block from the `WebSite` schema (we don't have a `/search` route). Optionally rebuild later if a real search page lands.

### 5. Noindex unpublished location detail pages

**Files:** `src/routes/locations/[state]/[city]/[slug]/+page.svelte`

- When `entry.frontmatter.published === false`, pass `noIndex` to `<SEOHead />`.
- Sitemap (#1) should also exclude unpublished entries.
- This prevents 58 thin "we're still writing this guide" pages from cluttering the index.
- Once we publish a guide, the page automatically becomes indexable again — no further code change.

### 6. Wire breadcrumbs through `<Breadcrumbs />` component

**Files:**
- `src/routes/locations/[state]/+page.svelte`
- `src/routes/locations/[state]/[city]/+page.svelte`
- `src/routes/locations/[state]/[city]/[slug]/+page.svelte`

- Replace inline breadcrumb `<nav>` blocks with `<Breadcrumbs items={…} />`.
- This makes the existing `BreadcrumbList` JSON-LD fire on every page, not just whatever currently uses the component.
- Also: visual consistency.

### 7. Add `Organization` JSON-LD globally

**File:** `src/routes/+layout.svelte`

- Emit a single `Organization` JSON-LD block in `<svelte:head>` with:
  - `name`: Tiny Tribe Adventures
  - `url`: `https://tinytribeadventures.com`
  - `logo`: absolute URL to `myth-map.png` (or a dedicated 1:1 brand mark if available)
  - `sameAs`: any social profile URLs we want to associate (add when known).
- This helps Google build a brand entity around the site.

### 8. Add SEO to the contact page

**File:** `src/routes/contact/+page.svelte`

- Add `<SEOHead />` with title / description / canonical.
- Currently the page emits no SEO meta at all.

### 9. Small cleanups in `SEOHead`

**File:** `src/lib/components/shared/SEOHead.svelte`

- Switch Twitter meta tags from `property="twitter:…"` to `name="twitter:…"` (spec compliant).
- Add `<meta property="og:locale" content="en_US">`.
- If we have explicit dimensions for `myth-map.png`, add `og:image:width` / `og:image:height`.
- Drop the global keyword stuffing default (`family activities, kids activities, …`) — Google ignores it and it adds noise. Keep page-specific keywords if pages set them.

## What we are not doing yet (deferred)

These are real SEO levers but they're a separate effort.

- **Writing the guide markdown for the 58 location pages.** This is the highest-value SEO action we can take, but it's content work, not code work. Tracked separately.
- **Building out the blog.** `/blog` currently has one card linking back to `/locations`. mdsvex is wired up but there are no `[slug]` routes for posts. Either build it or remove it from nav / sitemap. Decision deferred.
- **Filling in DC / DE / VA content.** Right now `src/lib/content/locations/` only contains `md/`. The brand copy implies broader coverage. Either expand the content or align the copy. Content decision deferred.
- **`/search` route.** Not building this now. Once we do, restore the `WebSite.potentialAction` JSON-LD on the homepage.
- **`dateModified` inside `TouristAttraction` JSON-LD.** Minor signal. Easy to add later when we revisit the detail pages alongside the guide content work.

## Verification checklist

After the "Now" fixes land:

- [ ] `curl https://tinytribeadventures.com/sitemap.xml` returns URLs for every state, every city, and every published location, with per-entry `<lastmod>`.
- [ ] `curl -I https://www.tinytribeadventures.com` returns `301` to apex.
- [ ] `curl https://tinytribeadventures.com/some-404-page` returns HTML containing `<meta name="robots" content="noindex, nofollow">`.
- [ ] An unpublished location page (e.g. `/locations/md/columbia/playseum`) returns `noindex` and is absent from the sitemap.
- [ ] Each location/state/city page renders a single `BreadcrumbList` JSON-LD block (view source, search for `BreadcrumbList`).
- [ ] Homepage source contains `Organization` and `WebSite` JSON-LD (and no broken `SearchAction`).
- [ ] Run [Google Rich Results Test](https://search.google.com/test/rich-results) on:
  - Homepage
  - One state page (e.g. `/locations/md`)
  - One city page (e.g. `/locations/md/columbia`)
  - One location page (e.g. `/locations/md/baltimore/national-aquarium`)
- [ ] Submit the new sitemap in Google Search Console and Bing Webmaster Tools.

## Future watch items

- When the guide markdown gets published, set `published: true` and confirm those pages drop their `noindex` and pick up `article:published_time` / `article:modified_time` properly.
- When/if `/search` ships, restore the `WebSite.potentialAction` schema.
- Add hreflang only if we ever ship non-English content.
- Consider `LocalBusiness` schema per location once we have hours of operation, phone numbers, and price ranges in structured form. Currently we have address + coords, which is enough for `TouristAttraction`.
