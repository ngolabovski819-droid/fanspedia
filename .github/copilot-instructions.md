# OnlyFans Scraper & Search Platform - AI Agent Instructions

> **Quick Links**: [Patterns](./PATTERNS.md) | [Checklists](./CHECKLISTS.md) | [Architecture](./ARCHITECTURE.md) | [Quickstart](./QUICKSTART.md) | [Troubleshooting](./TROUBLESHOOTING.md)

## Project Overview
Full-stack OnlyFans creator search platform with dual scraping systems (V1 URL-based, V2 ID-based), Supabase PostgreSQL backend with longitudinal tracking, and Vercel serverless deployment. 9,500+ creator profiles with advanced filtering (verified, price, bundles) and infinite scroll UI.

**Tech Stack**: Vanilla JS (no build step) | Node.js serverless | Python async Playwright | Supabase PostgreSQL with snapshots | Vercel deployment

**Scraping Architecture**: V1 (batch URL scraping) + V2 (sequential ID enumeration with historical snapshots)

## Architecture

### Frontend (HTML/CSS/JS)
- **Static pages**: `index.html` (search), `categories.html` (all categories), `category.html` (single category view)
- **No build step**: Pure vanilla JS with ES6 modules, Bootstrap 5.3.0
- **Category system**: Single source of truth in `config/categories.js` - ALL category changes must be made there
  - Exports: `categories`, `popularCategories`, `compoundCategories`, `synonymsMap`, `categoryToSlug()`, `slugToLabel()`
  - Import pattern: `import { popularCategories, categoryToSlug } from '/config/categories.js?v=YYYYMMDD-N'`
  - **CRITICAL**: When modifying categories, increment version query param to bust cache (e.g., `?v=20251107-1`)
- **Infinite scroll**: Uses `currentPage` variable and "Load More" button (not IntersectionObserver)
- **Image optimization**: First card gets `loading="eager" fetchpriority="high"`, rest use `loading="lazy"`
- **Search**: Queries `/api/search` with params: `q`, `verified`, `bundles`, `price`, `page`, `page_size`

### Backend (Vercel Serverless)
- **API routes** (`api/` folder): `search.js` (main), `health.js`, `analytics.js`
- **Database**: Supabase PostgreSQL via REST API (NOT using `@supabase/supabase-js` client library)
  - Direct `fetch()` calls to `${SUPABASE_URL}/rest/v1/onlyfans_profiles`
  - Headers: `apikey`, `Authorization: Bearer`, `Accept-Profile: public`, `Prefer: count=exact`
- **Environment variables**:
  - `SUPABASE_URL` - Supabase project URL
  - `SUPABASE_KEY` - Service role key (NOT anon key)
- **Caching**: 60-second in-memory cache in `api/search.js` (best-effort, serverless may reset)
- **Multi-term search**: Supports `q=goth|gothic|alt` syntax, searches across `username`, `name`, `about` (NOT `location`)

### Python Scraping (`scripts/`) - Two Systems

**V1 Scrapers (URL-based batch processing)**:
- `mega_onlyfans_scraper_full.py` - Full Playwright-based scraper with retries
- `mega_onlyfans_scraper_retry.py` - Retry failed URLs from `failed_batch.json`
- `mega_onlyfans_from_urls.py` - Scrape specific URL list
- Output to CSV → upload via `load_csv_to_supabase.py`

**V2 Scrapers (Sequential ID enumeration with tracking)**:
- `v2_id_scanner.py` - **Primary scraper**: Sequential numeric ID scan (1→N), filters non-performers, detects deleted pages
- `v2_refresh_orchestrator.py` - **Maintenance**: Weekly profile updates with adaptive scheduling (verified creators refresh more often)
- `v2_incremental_discovery.py` - **Daily discovery**: Scans forward from max known ID to find new registrations
- `v2_shared_utils.py` - Shared utilities: SupabaseClient (direct REST), RateLimiter (token bucket), ProxyPool, UserAgentRotator
- **Direct DB upsert**: Bypasses CSV, writes directly to Supabase with `aiohttp`
- **Historical snapshots**: Every profile update creates snapshot in `onlyfans_profile_snapshots` for growth charts
- **Resume capability**: `scan_progress` table tracks `last_id_scanned` to resume after interruption
- **Filtering logic**: Skip `isperformer=false` + detect "Sorry this page is not available" for deleted accounts

**Data Pipeline**:
- All scrapers intercept `/api2/v2/users/` XHR responses via Playwright's `page.on("response")` handler
- Extract 90+ fields via `extract_fields()` (40 base + V2 tracking columns)
- V1: CSV → batch upload | V2: Direct async upsert with `aiohttp` client
- **Async pattern**: All use `async with async_playwright()` and `context.new_page()` per URL/ID
- **Dependencies**: `playwright`, `pandas`, `aiohttp`, `requests`, `tqdm`, `python-dotenv`

## Development Workflows

### Local Testing
```powershell
# Start local Express server that mimics Vercel
npm start
# Visit http://127.0.0.1:3000
```
Server mounts `api/search.js` at `/api/search` and serves static files from root.

### V1 Scraping Workflow (Legacy URL-based)
1. Set `cookies.json` with OnlyFans auth cookies (format: list of dicts with `name`, `value`, `domain`, etc.)
2. Run scraper: `python scripts/mega_onlyfans_scraper_full.py --urls urls.txt --output temp.csv --cookies cookies.json`
3. Upload to Supabase:
```powershell
python scripts/load_csv_to_supabase.py --csv temp.csv --table onlyfans_profiles --batch-size 200 --upsert --on-conflict id --exclude-columns raw_json,timestamp
```
- **CRITICAL**: Use `--exclude-columns` for problematic timestamp/JSON fields
- Failed batches dump to `failed_batch.json` for debugging

### V2 Scraping Workflow (Modern ID-based with tracking)

**One-Time Setup**:
1. Apply database migration: Run `scripts/migrations/001_v2_snapshots_and_tracking.sql` in Supabase SQL Editor
   - Creates 4 tables: `onlyfans_profile_snapshots`, `crawl_runs`, `scan_progress`, `crawl_jobs`
   - Adds tracking columns to `onlyfans_profiles`: `first_seen_at`, `last_seen_at`, `last_refreshed_at`, `next_refresh_at`, `status`
2. Verify setup: `python scripts/test_v2_setup.py` (checks DB schema, cookies, env vars)
3. Export `cookies.json` from authenticated OnlyFans session (browser DevTools → Application → Cookies)

**Initial Database Population** (1-2 days for 100K IDs):
```powershell
# Test first (dry-run mode, 2 min)
python scripts/v2_id_scanner.py --cookies cookies.json --end-id 100 --dry-run

# Small production run (15 min)
python scripts/v2_id_scanner.py --cookies cookies.json --end-id 1000

# Full production scan (1-2 days, resumes automatically)
python scripts/v2_id_scanner.py --cookies cookies.json --end-id 100000 --concurrency 2 --rate 0.5
```
- **Resume capability**: If interrupted, next run continues from `scan_progress.last_id_scanned`
- **Filtering**: Skips non-performers (`isperformer=false`) and deleted pages automatically
- **Direct upsert**: No CSV intermediate, writes to DB immediately
- **Snapshot creation**: Each profile update creates historical record in `onlyfans_profile_snapshots`

**Daily Maintenance** (15 min):
```powershell
# Find new creator registrations (scans forward from max ID)
python scripts/v2_incremental_discovery.py --cookies cookies.json --buffer-size 5000
```

**Weekly Profile Refresh** (2-3 hours for 1000 profiles):
```powershell
# Update existing creators (queries next_refresh_at < NOW)
python scripts/v2_refresh_orchestrator.py --cookies cookies.json --batch-size 1000
```
- **Adaptive scheduling**: Verified creators refresh weekly, others bi-weekly/monthly
- **Status tracking**: Detects active→inactive→deleted transitions
- **Priority tiers**: `--priority-only` flag for verified/popular creators only

### Deployment
- **Production**: Push to `main` triggers Vercel GitHub Action (`.github/workflows/vercel-deploy.yml`)
- **Environment**: Set `SUPABASE_URL` and `SUPABASE_KEY` in Vercel dashboard → Settings → Environment Variables
- **Rewrites**: `vercel.json` handles `/categories/:slug` → `/category.html` routing
- **Sitemap**: Regenerate with `node scripts/generate-sitemap.js` (writes to `public/sitemap.xml`)

## Critical Conventions

### Category Management
- **NEVER hardcode categories** in HTML files - always import from `config/categories.js`
- Compound categories (e.g., `goth-free`) combine search terms + filters (see `compoundCategories` object)
- Synonym system in `synonymsMap` for better recall (e.g., `pawg` → `['pawg','phat ass white girl',...]`)

### Environment Variables
- **Local**: Use `.env` file (gitignored) with `SUPABASE_URL` and `SUPABASE_KEY`
- **Vercel**: Configure in dashboard - serverless functions auto-inject via `process.env`
- **Python**: Load with `os.getenv('SUPABASE_URL')`, fallback to `dotenv` if needed

### Database Schema
**Main Tables**:
- `onlyfans_profiles` - Current state (lowercase column names):
  - Core: `id`, `username`, `name`, `about`, `location`, `avatar`, `header`
  - Metrics: `subscribeprice`, `favoritedcount`, `subscriberscount`, `postscount`
  - Booleans: `isverified`, `isprivate`, `isperformer`
  - Bundles: `bundle1_price`, `promotion1_price`, `promotion1_discount`
  - V2 tracking: `first_seen_at`, `last_seen_at`, `last_refreshed_at`, `next_refresh_at`, `status`
- `onlyfans_profile_snapshots` - Historical metrics for growth charts:
  - Links via `creator_id` → `onlyfans_profiles.id`
  - Stores: `subscribeprice`, `favoritedcount`, `subscriberscount`, `postscount`, `captured_at`
- `scan_progress` - Resume state (single-row table):
  - `last_id_scanned`, `max_id_seen`, `total_creators_found`, `updated_at`
- `crawl_runs` - Execution metadata for auditing:
  - `run_id`, `run_type`, `started_at`, `total_success`, `status`

**Column Case Convention**: PostgreSQL stores ALL columns as lowercase. `extract_fields()` must output lowercase keys for PostgREST compatibility.

### Search Query Construction
```javascript
// Multi-column OR search across username, name, about
const terms = q.split(/[|,]/).map(s => s.trim()).filter(Boolean);
const cols = ['username','name','about'];
const expressions = terms.flatMap(term => cols.map(c => `${c}.ilike.*${term}*`));
params.set('or', `(${expressions.join(',')})`);
```

### Cache Busting
- `config/categories.js` imports use version query param: `?v=20251106-2`
- Increment version after ANY category changes to force client refresh
- Vercel serves with `Cache-Control: no-cache, no-store, must-revalidate` for dynamic pages

## Common Tasks

### Add New Category
1. Edit `config/categories.js` → add to `categories` array
2. If compound (with filters), add to `compoundCategories` object
3. Add synonyms to `synonymsOverrides` if needed
4. **Update version** in all HTML imports (e.g., `?v=20251106-2` → `?v=20251107-1`)
5. Regenerate sitemap: `node scripts/generate-sitemap.js`

### Fix Search Results
- Check `api/search.js` query construction (lines 34-64)
- Verify Supabase table columns match expected camelCase mapping (lines 100-106)
- Test with `/api/search?q=test&page=1&page_size=10` in browser

### Debug Scraper
- Enable headless=False in scraper: `browser = await p.chromium.launch(headless=False)`
- Check `failed_batch.json` for upload errors
- Validate CSV: `python scripts/verify_counts.py` or `verify_sr.py`

### Performance Optimization
- Frontend: Already uses eager loading for first card, lazy for rest
- Backend: Increase cache TTL in `api/search.js` (currently 60s)
- Database: Supabase auto-indexes on `favoritedcount`, `subscribeprice`

## File Organization
- **Root**: HTML pages, config files (`package.json`, `vercel.json`)
- **api/**: Vercel serverless functions (Node.js)
- **scripts/**: Python scrapers and data tools
- **config/**: Categories configuration (single source of truth)
- **static/**: Fallback images (`no-image.png`)
- **public/**: SEO files (`robots.txt`, `sitemap.xml`)

## Frontend Patterns & Best Practices

### Image Optimization
- **Proxy service**: All OnlyFans images routed through `images.weserv.nl` for caching, resizing, WebP conversion
- **Pattern**: `proxyImg(url, width, height)` generates optimized URLs
- **Responsive images**: `buildResponsiveSources()` creates srcset with [144, 240, 320, 480, 720]px widths
- **Aspect ratio**: Maintain 3:4 ratio (width × 4/3 = height) for all card images
- **Loading strategy**: First card gets `loading="eager" fetchpriority="high"`, rest get `loading="lazy"`

### LocalStorage Usage
- **Theme preference**: `localStorage.getItem('theme')` → 'light' or 'dark'
- **Favorites**: `localStorage.getItem('favorites')` → JSON array of creator IDs
- **Pattern**: Always JSON.parse() with try/catch for favorites
```javascript
let favorites = [];
try {
  const saved = localStorage.getItem('favorites');
  if (saved) favorites = JSON.parse(saved);
} catch (e) { /* ignore */ }
```

### State Management (No Framework)
- **Global variables** in each HTML file:
  - `currentPage` - pagination tracker (starts at 1)
  - `isLoading` - prevents duplicate API calls
  - `hasMore` - indicates more results available
  - `lcpBoostApplied` - tracks first-card optimization
- **Event delegation**: Favorites use `event.target.closest('.favorite-btn')` pattern
- **URL state**: Category pages read slug from `window.location.pathname`

### Search UX Patterns
- **Debouncing**: Header search has 300ms debounce to avoid excessive API calls
- **Active filters**: Visual chips show current filters, removable via click
- **Reset behavior**: "Reset filters" button clears all inputs AND re-triggers search
- **Scroll preservation**: `lockScroll()` / `restoreScroll()` for sticky filter interactions

## Python Scraping Patterns

### Response Interception
All scrapers use Playwright's `page.on("response", handler)` to capture API data:
```python
async def handle_response(response):
    if "/api2/v2/users/" in response.url:
        json_data = await response.json()
        row = extract_fields(json_data)
        rows.append(row)
```

### Error Handling & Retries
- **Retry pattern**: 3 attempts with exponential backoff (`wait * 2`)
- **Failed URLs**: Appended to `failed_urls` list, written to `failed_batch.json`
- **CSV append**: Use `open("temp.csv", "a")` to preserve data on crashes
- **Async context**: Always `async with async_playwright()` for proper cleanup

### Data Cleaning (load_csv_to_supabase.py)
- **NaN handling**: `pandas.replace({np.nan: None})` before JSON serialization
- **Infinity handling**: Replace `±inf` with `None` to avoid JSON errors
- **Float→Int conversion**: Numbers like `563461.0` sent as `563461` (int type)
- **Timestamp normalization**: Convert `+0000` → `+00:00` for PostgreSQL compatibility
- **Column exclusions**: Use `--exclude-columns` for problematic fields (raw_json, timestamp)

## Debugging Workflows

### Frontend Debugging
```powershell
# Test API directly in browser
http://localhost:3000/api/search?q=goth&verified=true&page=1&page_size=10

# Check categories cache
# Open DevTools → Application → Local Storage → see 'theme', 'favorites'

# Force refresh categories.js
# Increment version: /config/categories.js?v=20251107-2
```

### Backend Debugging
```javascript
// api/search.js has console-friendly cache logging
console.log('Cache hit:', cacheKey);
console.log('Fetching:', url);

// Check Supabase REST directly
curl "${SUPABASE_URL}/rest/v1/onlyfans_profiles?select=id,username&limit=5" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

### Python Debugging
```powershell
# Test single profile scrape
python scripts/mega_onlyfans_from_urls.py --urls test_urls.txt --output test.csv --cookies cookies.json --limit 1

# Validate CSV structure
python scripts/verify_counts.py temp.csv

# Test upload with 1 row
python scripts/load_csv_to_supabase.py --csv temp.csv --table onlyfans_profiles --limit 1 --batch-size 1

# Check failed batch details
cat failed_batch.json | python -m json.tool
```

## SEO & Performance

### Sitemap Management
- **Auto-generation**: `node scripts/generate-sitemap.js` creates XML from `config/categories.js`
- **Update frequency**: Run after adding/removing categories
- **URLs included**: Homepage, /categories/, and all category pages (/categories/:slug/)
- **Priority levels**: Homepage (1.0), Categories hub (0.9), Category pages (0.8)

### Meta Tags Pattern
Each page needs:
- Canonical URL (`<link rel="canonical">`)
- OG tags for social sharing
- Structured title: "[Topic] - BestOFGirls | [Context]"
- Description with keyword density (verified, free, subscription, price)

### Cache Headers (vercel.json)
- **Dynamic pages**: `no-store, must-revalidate` (index.html, category.html)
- **Static assets**: `public, max-age=86400` (robots.txt)
- **Categories config**: `no-store` to ensure version param works

## Security Notes
- **Never commit**: `.env`, `cookies.json`, `*.csv`, `failed_batch.json`, `failed_ids_v2.json`, `progress_urls.json`
- **Gitignore check**: Verify `.gitignore` includes all sensitive patterns before scraping
- Use service role key for Supabase (broader permissions needed for upserts)
- Cloudflare DNS configured for `bestonlyfansgirls.net`
- **V2 Scraper**: Rate limiting is critical to avoid IP bans - use `--rate 0.5` (0.5 req/sec) for safety

## Common Gotchas

### ❌ Don't
- Hardcode categories in HTML (use `config/categories.js`)
- Use `location` column in search (causes false positives like "Gotham")
- Forget to increment cache version after category changes
- Use `@supabase/supabase-js` client (we use direct REST API)
- Commit CSV files or cookies.json
- Run V2 scrapers without migration (check with `test_v2_setup.py` first)
- Use anon key for Supabase - V2 requires service role key for direct inserts
- Set concurrency >3 for V2 scrapers (risks rate limiting/bans)

### ✅ Do
- Import categories with versioned URLs: `?v=20251107-1`
- Test search with multi-term syntax: `q=goth|gothic|alt`
- Use `--exclude-columns` for problematic timestamp fields
- Check `failed_batch.json` after CSV uploads
- Run sitemap generator after category changes
- Use `--dry-run` flag when testing V2 scrapers
- Monitor `scan_progress` table to track V2 scraper resume state
- Check `failed_ids_v2.json` for V2 scraping errors

## Additional Resources

- **[PATTERNS.md](./PATTERNS.md)** - Copy-paste code examples for common patterns
- **[CHECKLISTS.md](./CHECKLISTS.md)** - Step-by-step guides for all major tasks
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Design decisions and trade-offs explained
- **[QUICKSTART.md](./QUICKSTART.md)** - Fast setup and common workflows
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Solutions to common errors
- **[README.md](./README.md)** - Documentation overview and navigation

**For implementing features**: Reference PATTERNS.md for reusable code
**For debugging issues**: Check TROUBLESHOOTING.md for solutions
**For step-by-step tasks**: Follow CHECKLISTS.md workflows
**For understanding design**: Read ARCHITECTURE.md rationale
