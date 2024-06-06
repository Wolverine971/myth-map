# Myth-Map

A tool for chronically curious families looking for their next adventure!

<img src="./static/myth-map.png" alt="Myth Map Icon" width="200"/>





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
