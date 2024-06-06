# Myth-Map

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/main/packages/create-svelte).

### Setup steps

1. install pnpm

   `npm install -g pnpm`
2. `pnpm i`
3. Need Env Variables

    `PUBLIC_SUPABASE_URL`
    `PUBLIC_SUPABASE_ANON_KEY`
4. `pnpm run dev`

### Generating SUPABASE TYPES

<https://supabase.com/docs/guides/api/generating-types>

`npx supabase gen types typescript --project-id "" --schema public > src/schema.ts`
