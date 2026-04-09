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
- `npm run android:sync`
- `npm run preview`
- `npm run db:push`
- `npm run db:reset`
- `npm run db:types`

## Android APK without Android Studio

This repo is already wired for Android with Capacitor:

- `capacitor.config.ts`
- `android/app/build.gradle`

The web app build and Android sync were verified with:

- `npm run build`
- `npx cap sync android`

### Fastest shipping path

Use GitHub Actions to build the APK so you do not need Android Studio installed locally.

1. In GitHub, open Settings > Secrets and variables > Actions.
2. Add these secrets:
   `VITE_SUPABASE_PROJECT_ID`
   `VITE_SUPABASE_PUBLISHABLE_KEY`
   `VITE_SUPABASE_URL`
3. Open the `Android APK` workflow in Actions.
4. Run it manually, or push to `main` or `master`.
5. Download the `kelectrical-pms-debug-apk` artifact.
6. Install `app-debug.apk` on the phone.

### What to expect on Android

- Android packages the same React frontend, so the screens, routes, and general UI feel stay aligned with the web app.
- Android uses the non-Electron app path, which is the same layout branch used by the browser version.
- Electron-only local document storage and native desktop menu hooks do not exist on Android yet.
- PDF sharing should work well on Android because the app already uses `navigator.share` when supported.
- A debug APK is fine for internal distribution tomorrow. For broader external distribution or Play Store upload, add release signing next.
