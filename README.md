# K Electrical PMS

Vite + React frontend deployed on Vercel, with Supabase handling Postgres, Auth, and migrations.

## Local setup

1. Install dependencies:
   `npm install`
2. Create your local env file:
   `Copy-Item .env.example .env`
3. Fill in `.env` with your Supabase project values.
4. Start the app:
   `npm run dev`

## Supabase setup

1. Create a Supabase project.
2. Log in to the Supabase CLI:
   `npx supabase login`
3. Link this repo to your project:
   `npm run db:link -- --project-ref your-project-ref`
4. Push the tracked schema and policies:
   `npm run db:push`
5. Regenerate TypeScript database types after schema changes:
   `npm run db:types`

## Vercel setup

1. Import this repository into Vercel.
2. Add these environment variables in Vercel Project Settings:
   `VITE_SUPABASE_PROJECT_ID`
   `VITE_SUPABASE_URL`
   `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Deploy the app.

## Supabase auth URLs

In Supabase Auth URL configuration, set:

- Site URL:
  your production domain, for example `https://app.example.com`
- Additional redirect URLs:
  `http://localhost:8080/**`
  your Vercel preview pattern, for example `https://*-your-team.vercel.app/**`
  your production domain pattern if needed

## Useful commands

- `npm run build`
- `npm run preview`
- `npm run db:push`
- `npm run db:reset`
- `npm run db:types`
