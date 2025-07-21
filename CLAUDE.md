# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tiny Tribe Adventures (tinytribeadventures.com) is a SvelteKit application that helps families discover adventure locations across DC, Maryland, Delaware, and Virginia. It features an interactive Mapbox-powered map, user accounts, itinerary planning, and location management.

## Key Commands

### Development
```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint code
pnpm lint

# Format code with Prettier
pnpm format

# Type checking
pnpm check
```

## Architecture Overview

### Tech Stack
- **Frontend**: SvelteKit 2.5.26, Svelte 4.2.7, TypeScript
- **Styling**: Tailwind CSS 3.4.4, Flowbite Svelte components
- **Database**: Supabase (PostgreSQL with TypeScript types)
- **Maps**: Mapbox GL JS, Mapbox SDK for geocoding
- **Deployment**: Vercel (Node.js 20.x runtime)

### Key Directories
- `src/routes/` - SvelteKit pages and API endpoints
- `src/lib/` - Shared components and utilities
- `src/geographies/` - JSON files containing location data for cities
- `src/blog/` - Blog content in Markdown/MDsveX format
- `supabase/` - Database types and configuration
- `static/` - Images, icons, and static assets

### Important Patterns

1. **Supabase Integration**: The app uses Supabase for auth and database. Type-safe database queries are made using generated types from `src/DatabaseDefinitions.ts`.

2. **Geographic Data**: Location data is stored in JSON files under `src/geographies/`. Each city has its own file with standardized structure.

3. **Map Icons**: Custom SVG icons for different location types are in `static/images/icons/`. The icon mapping is handled in components.

4. **Theme Colors**:
   - Primary: Forest Green (#014421)
   - Secondary: Sandstone (#D2B48C)
   - Accent: Sky Blue (#87CEEB)
   - Tertiary: Rustic Orange (#CD5700)

5. **Routes Structure**:
   - `/admin` - Admin panel for location management
   - `/account` - User account management
   - `/itineraries` - Trip planning features
   - `/locations` - Location browsing and details
   - `/map` - Main interactive map interface

### Development Guidelines

1. **Component Creation**: Follow existing Svelte component patterns. Components should be TypeScript-enabled and use proper prop typing.

2. **Database Queries**: Always use the generated Supabase types for type safety. Check `src/DatabaseDefinitions.ts` for available tables and types.

3. **Styling**: Use Tailwind CSS utilities. Custom styles should follow the established color theme.

4. **Geographic Data**: When adding new locations, follow the existing JSON structure in `src/geographies/`.

5. **Environment Variables**: Required variables are:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`

### Common Tasks

- **Adding a new location type**: Update icon mappings and ensure corresponding SVG exists in `static/images/icons/`
- **Modifying database schema**: Changes should be reflected in Supabase types
- **Adding new pages**: Create in `src/routes/` following SvelteKit conventions
- **Updating geographic data**: Modify JSON files in `src/geographies/`

### Notes
- No test framework is currently configured
- The project uses pnpm as the package manager
- Vite is configured with custom plugins for processing GeoJSON data
- The app is optimized for mobile-first responsive design