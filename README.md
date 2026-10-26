# RunStats Studio

A Strava-powered running poster generator. The current frontend includes a template gallery and a client-side poster editor/PNG export. The Worker now has the first Strava OAuth and activity API routes; those routes remain unavailable until the D1 database binding and Strava secrets are configured.

## Requirements

- Node.js 20 or newer
- npm
- Cloudflare account for deployment
- Strava API application for OAuth

## Local development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

## Cloudflare and Strava setup

Do not commit secrets, access tokens, refresh tokens, or `.dev.vars`.

1. In the Cloudflare dashboard, create a D1 database named `runstats-studio-db`.
2. Copy its database ID. Add the D1 binding in `wrangler.jsonc` with binding name `DB`, database name `runstats-studio-db`, and that real database ID. Do not use a placeholder ID.
3. Apply migrations to the remote database after the binding is configured:
   `npx wrangler d1 migrations apply runstats-studio-db --remote`
4. Create a Strava API application at the Strava developer settings. Set its Authorization Callback Domain to the deployed Worker hostname (hostname only, no protocol or path).
5. Set these as Cloudflare Worker secrets/variables (never in frontend code):
   - `STRAVA_CLIENT_ID` — the client ID from your Strava API application
   - `STRAVA_CLIENT_SECRET` — the client secret, stored as a secret
   - `STRAVA_REDIRECT_URI` — the full callback URL, for example `https://YOUR-WORKER-HOSTNAME/api/auth/strava/callback`; use your actual deployed hostname
6. In the Strava app, ensure the callback URL's domain matches the Authorization Callback Domain.
7. Deploy the latest `main` branch and check `/api/health`. It should report `databaseConfigured: true` and `stravaConfigured: true`.

OAuth requests ask for `read,activity:read_all`. Access and refresh tokens are stored server-side in D1, not sent to the frontend. The browser receives an HttpOnly session cookie. The application has not yet been tested end-to-end against a real Strava account.

## Project structure

- `src/`: React frontend, UI, template previews, editor and PNG export
- `worker/index.ts`: Cloudflare Worker, OAuth callback, session and activity endpoints
- `migrations/`: D1 SQL migrations
- `wrangler.jsonc`: Cloudflare Worker and static asset configuration

## Development stages

1. Foundation and deployment
2. Interactive template gallery
3. Poster editor and PNG export
4. Strava OAuth and activity API (routes implemented; configuration/testing pending)
5. GPS route rendering
6. Admin template builder
7. Persisted designs, final deployment and end-to-end testing
