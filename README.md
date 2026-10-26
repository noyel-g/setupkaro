# RunStats Studio

A Strava-powered running poster generator. Runners will connect their Strava account, choose an activity, select a published template, customize a poster, and export a shareable image. Admins will create and publish templates through an admin interface.

## Current milestone: Step 1 — Foundation

This commit establishes the Vite + React + TypeScript frontend, a Cloudflare Worker API entry point, a D1 schema migration, and deployment configuration. The Strava integration, editor, and template administration are intentionally not enabled yet.

## Requirements

- Node.js 20 or newer
- npm
- A Cloudflare account for deployment (not required for local frontend development)

## Local development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

## Cloudflare setup

1. Create a D1 database named `runstats-studio-db`.
2. Replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.jsonc` with the database ID.
3. Add the required Strava configuration as Worker secrets only when we implement OAuth:
   - `STRAVA_CLIENT_ID`
   - `STRAVA_CLIENT_SECRET`
   - `STRAVA_REDIRECT_URI`
   - `SESSION_SECRET`
4. Build and deploy with `npm run deploy`.

Do not commit credentials or `.dev.vars`. The frontend must never receive the Strava client secret.

## Project structure

- `src/`: React frontend, UI, and poster templates
- `worker/index.ts`: Cloudflare Worker API entry point
- `migrations/`: D1 SQL migrations
- `wrangler.jsonc`: Cloudflare Worker and static asset configuration

## Development stages

1. Foundation
2. Template gallery and UI
3. Poster editor and image export
4. Strava OAuth and activities
5. GPS route rendering
6. Admin template builder
7. Persistence, deployment, and end-to-end testing
