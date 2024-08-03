# Tiny Tribe Adventures ([here](tinytribeadventures.com))

A tool for chronically curious families looking for their next adventure!

<img src="./static/myth-map.png" alt="Tiny Tribe Adventures Icon" width="200"/>

### Setup steps

1. install pnpm

   `npm install -g pnpm`

2. `pnpm i`
3. Need Env Variables

   `PUBLIC_SUPABASE_URL`
   `PUBLIC_SUPABASE_ANON_KEY`

4. `pnpm run dev`

### Generating SUPABASE TYPES (not required)

<https://supabase.com/docs/guides/api/generating-types>

`npx supabase gen types typescript --project-id "" --schema public > src/schema.ts`

## Design

- Lego map theme- cool dad mode- black colors
- icon is a backpack exploding with activities
