# RunStats Studio

A Strava-powered running poster studio. Runners connect their Strava account, choose an activity, select a published template, and export a shareable running poster. Admins can create and publish templates through an admin interface.

## Planned stack

- Vite + TypeScript frontend
- Cloudflare Worker API for Strava OAuth and activity data
- Cloudflare D1 for templates and saved designs
- Server-side secrets: `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `SESSION_SECRET`

Never put the Strava client secret in frontend code. Configure secrets in the deployment environment before enabling OAuth.

## Status

Initial project setup; Strava credentials and deployment configuration are required before OAuth can run.
