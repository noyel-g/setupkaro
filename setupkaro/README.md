# RunStats Studio

A lightweight, responsive running-poster editor. Built with Vite and plain JavaScript so it is easy to maintain and deploy.

## Features

- Live poster preview
- Editable headline, distance, unit, duration, pace, elevation, heart rate, date/route and runner name
- Six palettes and three layout styles
- Portrait, story, square and landscape export formats
- Optional background photo (kept in the browser; not uploaded)
- Toggle individual stats
- High-resolution PNG export (2× canvas resolution)
- Save/load/delete up to 20 designs using browser local storage
- Responsive editor for desktop and mobile

## Requirements

- Node.js 20+ recommended
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build

```bash
npm run build
npm run preview
```

The production site is generated in `dist/`.

## Deploy to Cloudflare Pages (free static hosting)

1. Push this project to a GitHub repository.
2. In Cloudflare, open **Workers & Pages → Create → Pages → Connect to Git**.
3. Choose the repository.
4. Set build command to `npm run build`.
5. Set build output directory to `dist`.
6. Deploy.

You do not need a database for the current version. The editor is client-side and design saves stay in the visitor's browser. Add Cloudflare D1 only if you later need user accounts, cross-device design syncing, shared public galleries, or cloud-stored projects. If you add any of those features, use a server-side Worker/API for database access; never put database credentials in browser code.

## Replace an existing Astro repository

This is a clean standalone Vite project, not an Astro page. To use it as a complete replacement, back up the current repository, replace the old project files with these files, then commit and deploy. Do not just copy `index.html` into the old Astro `src/pages` folder.
