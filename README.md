# Daymark

A quiet, local-first daily journal for capturing everyday moments. Notes are grouped by date and type, with a simple task list, searchable timeline, tags, and Markdown-friendly writing.

## Features

- **Today page** — keep a day-by-day record of small moments, thoughts, reading notes, exercise, ideas, work, and more.
- **Timeline** — browse past entries by date or search across titles, body text, types, and tags.
- **Type-based organization** — entries are grouped by what they are, while tags add another layer of context.
- **Tasks** — keep a lightweight list next to the journal, with due dates and completed tasks.
- **Markdown-friendly notes** — use plain text, simple lists, and bold markers; export individual entries as Markdown.
- **Local-first privacy** — no account, tracking, analytics, or application server needed for journal entries. Content is stored in this browser's local storage.
- **Backup and restore** — export a Markdown archive and JSON backup, and import a Daymark JSON backup or Markdown text.
- **Responsive layout** — desktop sidebar and mobile navigation.

## Development

Requires Node.js 20+ and npm.

```sh
npm install
npm run dev
npm run build
```

## Storage note

Your journal is saved in the browser on this device. Clearing browser data can remove it. Use **Settings & backup → Export backup** periodically to download your Markdown and JSON copies. This app does not sync notes to a server and does not write directly to an Obsidian vault or filesystem.

## Project status

The previous RunStats Studio application is preserved on branch `backup/runstats-studio-2026-10-26`. The `main` branch now contains Daymark.
