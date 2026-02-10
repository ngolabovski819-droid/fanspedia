# FansPedia — Copilot Guide (Concise)

Quick links: [PATTERNS.md](./PATTERNS.md) • [CHECKLISTS.md](./CHECKLISTS.md) • [ARCHITECTURE.md](./ARCHITECTURE.md) • [QUICKSTART.md](./QUICKSTART.md) • [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## Big Picture
- Production site for `fanspedia.net`. Vanilla HTML/JS frontend + Vercel serverless API + Supabase. Similar stack to sibling repo.
- Includes creator pages (`creator.html`) with Similar Creators recommendations and favorites.

## Frontend
- Pages: `index.html`, `categories.html`, `category.html`, `creator.html`.
- Categories single source: `config/categories.js`. Always import with `?v=YYYYMMDD-N` and bump across all HTML when editing.
- Infinite scroll: `currentPage,isLoading,hasMore` + “Load More”. First image eager/high priority; others lazy. Use `buildResponsiveSources()`.
- Favorites: LocalStorage only; use event delegation pattern.

## Backend API
- Files: `api/search.js`, `api/health.js`, `api/analytics.js`.
- Supabase via REST with `apikey` + bearer; 60s in-memory Map cache.
- Search OR-matches `username,name,about` for `q` split by `|` or `,`. Exclude `location`. Example: `q=goth|gothic|alt`.

## Database
- `onlyfans_profiles` with lowercase columns including V2 tracking fields.
- `onlyfans_profile_snapshots`, `scan_progress`, `crawl_runs`, `crawl_jobs` support snapshots and scheduling.

## Scraping
- V1: `mega_onlyfans_scraper_full.py` → CSV → `load_csv_to_supabase.py --exclude-columns raw_json,timestamp`.
- V2: migrate `scripts/migrations/001_v2_snapshots_and_tracking.sql`; run `v2_id_scanner.py`, `v2_incremental_discovery.py`, `v2_refresh_orchestrator.py`.
- Intercept `/api2/v2/users/`; skip `isperformer=false`; resume via `scan_progress`.

## Local Dev
- Start: `npm start` → test `http://127.0.0.1:3000/api/search?q=test&page=1`.
- Creator page: `/creator.html?u=username` shows profile + Similar Creators.
- Supabase sanity curl as in sibling repo.

## Deployment & SEO
- Set `SUPABASE_URL` + `SUPABASE_KEY` in Vercel. Push to `main` to deploy.
- Sitemaps: `npm run build:sitemaps` creates multiple sitemap files in repo root.
- If rewrites ignored, follow `VERCEL_FIX_INSTRUCTIONS.md` (Framework "Other", no Output Directory override) and redeploy.

## Conventions & Gotchas
- Never hardcode categories; import module and bump `?v=`.
- Keep PostgREST keys lowercase; avoid `location` in search.
- Do not commit secrets/data files (`.env`, `cookies.json`, CSVs, failures/progress logs).

## Pointers
- Start with `api/search.js`, `config/categories.js`, `creator.html`.
- Reuse patterns from PATTERNS: Supabase query, debounce + pagination, responsive images, favorites bar.
