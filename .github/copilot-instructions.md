# FansPedia (OnlyFans Search)  Copilot Guide

Quick links: [PATTERNS.md](./PATTERNS.md)  [CHECKLISTS.md](./CHECKLISTS.md)  [ARCHITECTURE.md](./ARCHITECTURE.md)  [QUICKSTART.md](./QUICKSTART.md)  [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## Big Picture
- Production codebase for fanspedia.net. Full-featured OnlyFans search with active creator profiles, categories, and Similar Creators recommendations.
- Same stack as sibling repo: vanilla JS frontend, Vercel serverless backend, Supabase PostgreSQL, Python Playwright scrapers (V1 CSV, V2 direct upsert + snapshots).

## Key Architecture
- Pages: `index.html`, `categories.html`, `category.html`, `creator.html`. Categories are the single source of truth in `config/categories.js` and must be imported with a version: `.../categories.js?v=YYYYMMDD-N`. Bump `?v=` on every change.
- Infinite scroll uses `currentPage,isLoading,hasMore` and a "Load More" button. Images use `images.weserv.nl`, first card eager/high priority.
- API (`api/`): `search.js` (main), `health.js`, `analytics.js`. Creator profiles fully functional with Similar Creators section displaying personalized recommendations.
- Supabase via REST only. Headers: `apikey`, `Authorization: Bearer`, `Prefer: count=exact`. 60s Map cache in `search.js`.
- Search splits `q` by `|` or `,` and ORmatches across `username,name,about` (exclude `location`). Example: `q=goth|gothic|alt`.

## Database Shape (essentials)
- `onlyfans_profiles` (lowercase columns): identity, metrics, flags, bundles, and V2 tracking fields (`first_seen_at,last_seen_at,last_refreshed_at,next_refresh_at,status`).
- `onlyfans_profile_snapshots`, `scan_progress`, `crawl_runs`, `crawl_jobs` used by V2 scrapers.

## Local Dev & Debug
- Start server and test:
```powershell
npm start
curl "http://127.0.0.1:3000/api/search?q=test&page=1&page_size=10"
```
- Creator profiles accessible via `/creator.html?u=username` with full functionality including Similar Creators section with heart button favorites.
- Supabase REST quick check:
```powershell
curl "$env:SUPABASE_URL/rest/v1/onlyfans_profiles?select=id,username&limit=5" -H "apikey: $env:SUPABASE_KEY" -H "Authorization: Bearer $env:SUPABASE_KEY"
```

## Scraping Workflows
- V1 (CSV pipeline):
```powershell
python scripts/mega_onlyfans_scraper_full.py --urls urls.txt --output temp.csv --cookies cookies.json
python scripts/load_csv_to_supabase.py --csv temp.csv --table onlyfans_profiles --batch-size 200 --upsert --on-conflict id --exclude-columns raw_json,timestamp
```
- V2 (direct upsert + snapshots): run migration `scripts/migrations/001_v2_snapshots_and_tracking.sql`, then:
```powershell
python scripts/v2_id_scanner.py --cookies cookies.json --end-id 100000 --concurrency 2 --rate 0.5
python scripts/v2_incremental_discovery.py --cookies cookies.json --buffer-size 5000
python scripts/v2_refresh_orchestrator.py --cookies cookies.json --batch-size 1000
```

## Deploy & Routing
- Deploys to fanspedia.net on push to `main`. Set `SUPABASE_URL` and `SUPABASE_KEY` (service role) in Vercel.
- Creator profiles fully enabled and functional. Category rewrites handled in `vercel.json`. Build sitemaps before deploy: `npm run build:sitemaps` (writes multiple sitemap files in repo root).
- If rewrites are ignored in production, follow `VERCEL_FIX_INSTRUCTIONS.md` (Framework Preset "Other", no Output Directory override, redeploy fresh).

## Conventions & Gotchas
- Do not hardcode categories; import from `config/categories.js` and bump `?v=` across `index.html`, `category.html`, `categories.html`.
- Keep search to `username,name,about`. Use lowercase keys for PostgREST.
- Never commit secrets/data: `.env`, `cookies.json`, `*.csv`, `failed_batch.json`, `failed_ids_v2.json`, `progress_urls.json`.

## Pointers
- Start with `api/search.js`, `config/categories.js`, `creator.html` (profile pages with Similar Creators).
- Copy patterns from PATTERNS: Supabase REST query, debounce + pagination, responsive images, favorites management.
