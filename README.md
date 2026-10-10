# FitLog

A fast gym logger for people who train the same routines every week. Start a routine and every exercise is prefilled from your last session, adjusted by what you decided then (stay / go up / go down). Tap once to log it, or open the row to tweak. Works offline; syncs across devices when signed in.

Live at [fitlog.sindriax.dev](https://fitlog.sindriax.dev).

## Features

- Routines with one-tap logging, rest timer and a finish summary (records, changes, next steps)
- Per-machine weight steps learned from your history, plus saved machine settings and notes
- Body weight tracking, weekly recap, streaks and progress charts per machine
- Import from plain gym notes or a JSON backup; export via the share sheet
- Offline-first PWA with background sync and email magic-link sign-in
- English and Spanish

## Stack

- SvelteKit 5 (runes), Tailwind CSS 4, Vite PWA
- Cloudflare Workers serving the static app and a small JSON API
- Cloudflare D1 for storage, Email Routing for sign-in links
- Data lives on the device and syncs in the background; last write wins per item

## Development

```bash
npm install
npm run dev               # app only, no API
npm run db:migrate:local  # once, creates the local D1 schema
npm run cf:dev            # app + worker; sign-in links are printed to the console
npm test
```

Worker config is in `wrangler.jsonc`. The comma-separated list of emails allowed to sign in is the `ALLOWED_EMAILS` secret (`wrangler secret put ALLOWED_EMAILS`), or a line in `.dev.vars` locally. Deploy with `npm run cf:deploy` after `npm run db:migrate:remote`.
