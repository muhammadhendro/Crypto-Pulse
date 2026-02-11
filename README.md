# Crypto Pulse – Vercel + Supabase Deployment

This project is now configured for production deployment on **Vercel** with persistence on **Supabase Postgres**.

## What changed for production

- Added `server/persistence.ts` as a persistence abstraction:
  - Uses `DATABASE_URL` (Supabase Postgres) when available.
  - Falls back to in-memory mode when `DATABASE_URL` is not set.
- Backend routes now use persistence helpers for:
  - auth session mapping
  - settings
  - watchlist
  - journal
  - alerts
- Added Vercel serverless API entrypoint at `api/index.ts`.
- Added `vercel.json` routing:
  - `/api/*` -> Node serverless function
  - all other routes -> built Vite SPA

## Required environment variables

Set these in Vercel Project Settings → Environment Variables:

- `DATABASE_URL` = Supabase Postgres connection string (use pooled connection string for production)
- `CRYPTOPANIC_API_KEY` (optional)
- `GLASSNODE_API_KEY` (optional)
- `NODE_ENV=production`

## Supabase setup

No manual migration is required for the app-state/auth tables.
At runtime the app auto-creates:

- `app_state`
- `users`

If you prefer explicit SQL migrations, keep equivalent schema in your Supabase migration workflow.

## Deploy steps (Vercel)

1. Push this repo to GitHub/GitLab.
2. Import project in Vercel.
3. Build command: `vite build` (configured in `vercel.json`)
4. Output directory: `dist/public`
5. Add env vars above.
6. Deploy.

## Notes

- Current auth is lightweight username/password and intended as minimal app auth.
- For stricter production security, replace with Supabase Auth and hashed passwords.


### Why `vite build` on Vercel?

Vercel already builds API functions from `api/index.ts` using `@vercel/node`.
The static site build only needs client assets, so using `vite build` avoids running the custom server bundle step (`script/build.ts`) in Vercel CI.
