# OnlyFans V2 Scraper - Complete Guide

## Overview

V2 scraper is a complete rewrite designed for **sequential numeric ID enumeration** with longitudinal tracking capabilities. Unlike V1 (URL-based batch scraping), V2 systematically scans all OnlyFans creator IDs (1, 2, 3, ...) and maintains historical snapshots for growth analysis.

**Key Features:**
- ✅ Sequential numeric ID scanning with filtering (isperformer, deleted pages)
- ✅ Direct Supabase upsert (bypasses CSV)
- ✅ Historical snapshots for metrics tracking (followers, price, posts over time)
- ✅ Resume capability (continues from last scanned ID)
- ✅ Rate limiting with token bucket algorithm
- ✅ Proxy pool with health scoring and quarantine
- ✅ User-agent rotation (desktop + mobile)
- ✅ Dry-run mode for safe testing
- ✅ Real-time progress tracking with tqdm

## Architecture

### Database Schema

**Extended Tables:**
- `onlyfans_profiles`: Current state (added: first_seen_at, last_seen_at, last_refreshed_at, next_refresh_at, status)
- `onlyfans_profile_snapshots`: Historical metrics (NEW)
- `crawl_runs`: Execution metadata (NEW)
- `scan_progress`: Resume state (NEW)
- `crawl_jobs`: Job sharding (optional, NEW)

### Data Flow

```
ID Scanner → XHR Intercept → Filter Non-Performers → Direct Supabase Upsert
                ↓                       ↓
         Extract Fields         Check Deleted Page
                ↓                       ↓
         Insert Snapshot        Update Progress
```

### Filtering Logic

1. **Non-Performer Filter**: Skip profiles where `isperformer = false`
2. **Deleted Page Detection**: Check for "Sorry this page is not available" text
3. **Valid Creator**: `isperformer = true` AND page loads successfully

## Installation

### 1. Apply Database Migration

```sql
-- In Supabase SQL Editor, run:
-- scripts/migrations/001_v2_snapshots_and_tracking.sql
```

This creates:
- New columns on `onlyfans_profiles`
- `onlyfans_profile_snapshots` table
- `crawl_runs` table
- `scan_progress` table
- Helper functions and indexes

### 2. Install Python Dependencies

```powershell
pip install -r requirements.txt
playwright install chromium
```

New dependencies added:
- `aiohttp` - Async HTTP client for Supabase REST API
- `playwright` - Browser automation (already in V1)
- `tqdm` - Progress bars
- `pandas` - Data processing (already in V1)

### 3. Set Environment Variables

```powershell
# .env file
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
```

**CRITICAL**: Use **service role key** (not anon key) for full permissions.

## Usage

### Basic Scan

```powershell
python scripts/v2_id_scanner.py --cookies cookies.json --start-id 1 --end-id 1000
```

### Dry Run (No Database Writes)

```powershell
python scripts/v2_id_scanner.py --cookies cookies.json --start-id 1 --end-id 100 --dry-run
```

Use dry-run to:
- Test filtering logic
- Validate cookie authentication
- Preview what would be scraped
- Check console output

### With Proxies

```powershell
python scripts/v2_id_scanner.py --cookies cookies.json --start-id 1 --end-id 10000 --proxies http://user:pass@proxy1:port http://user:pass@proxy2:port
```

### Resume from Last Scan

```powershell
# First run: scans IDs 1-5000
python scripts/v2_id_scanner.py --cookies cookies.json --end-id 5000

# Second run: auto-resumes from 5001
python scripts/v2_id_scanner.py --cookies cookies.json --end-id 10000
```

Resume is **enabled by default**. Disable with `--no-resume`.

### Performance Tuning

```powershell
# Faster scanning (use with caution - may trigger rate limits)
python scripts/v2_id_scanner.py --cookies cookies.json --concurrency 5 --rate 2.0

# Safer scanning (slower but less detectable)
python scripts/v2_id_scanner.py --cookies cookies.json --concurrency 1 --rate 0.5
```

**Recommended defaults:**
- `--concurrency 3` - 3 parallel browser contexts
- `--rate 1.0` - 1 request per second (per host)

## CLI Reference

### Required Arguments

| Flag | Description | Example |
|------|-------------|---------|
| `--cookies` | Path to cookies.json | `--cookies cookies.json` |

### ID Range

| Flag | Description | Default | Example |
|------|-------------|---------|---------|
| `--start-id` | Starting OnlyFans ID | 1 | `--start-id 1000` |
| `--end-id` | Ending OnlyFans ID | 1000000 | `--end-id 50000` |

### Performance

| Flag | Description | Default | Example |
|------|-------------|---------|---------|
| `--concurrency` | Concurrent browser contexts | 3 | `--concurrency 5` |
| `--rate` | Requests per second | 1.0 | `--rate 2.0` |

### Proxies

| Flag | Description | Example |
|------|-------------|---------|
| `--proxies` | List of proxy URLs | `--proxies http://proxy1:8080 http://proxy2:8080` |

Proxy format: `http://username:password@host:port`

### Options

| Flag | Description |
|------|-------------|
| `--dry-run` | Preview mode (no database writes) |
| `--no-resume` | Disable resume from last scan |

## Output & Monitoring

### Console Output

```
📍 Resuming from ID 5001
🆔 Crawl run ID: 123e4567-e89b-12d3-a456-426614174000

Scanning IDs: 23%|███▌          | 1150/5000 [19:10<54:21, 1.18id/s, found=47, skipped=983, errors=120]

============================================================
SCAN COMPLETE
============================================================
Total attempted: 5000
Creators found: 247
Non-performers skipped: 4123
Deleted pages: 412
Errors: 218
Success rate: 94.3%

⚠️ Failed IDs saved to failed_ids_v2.json
```

### Failed IDs Log

`failed_ids_v2.json` contains:
```json
{
  "1234": "Timeout after 30s",
  "5678": "Connection refused",
  "9012": "403 Forbidden"
}
```

Use this to:
- Retry failed IDs with different proxies
- Identify systematic errors (e.g., all 403s = bad cookies)
- Debug rate limiting issues

### Database Queries

**Check scan progress:**
```sql
SELECT * FROM scan_progress WHERE id = 1;
```

**View recent crawl runs:**
```sql
SELECT run_id, run_type, started_at, finished_at, 
       total_attempted, total_success, status
FROM crawl_runs
ORDER BY started_at DESC
LIMIT 10;
```

**Growth chart for specific creator:**
```sql
SELECT 
    DATE(captured_at) AS date,
    MAX(favoritedcount) AS followers,
    MAX(subscriberscount) AS subscribers,
    MAX(postscount) AS posts
FROM onlyfans_profile_snapshots
WHERE creator_id = 123456
GROUP BY DATE(captured_at)
ORDER BY date DESC;
```

**Top 10 fastest growing creators (last 30 days):**
```sql
WITH growth AS (
    SELECT 
        creator_id,
        MAX(favoritedcount) - MIN(favoritedcount) AS follower_growth
    FROM onlyfans_profile_snapshots
    WHERE captured_at > NOW() - INTERVAL '30 days'
    GROUP BY creator_id
)
SELECT 
    p.username,
    p.name,
    g.follower_growth,
    p.favoritedcount AS current_followers
FROM growth g
JOIN onlyfans_profiles p ON p.id = g.creator_id
ORDER BY g.follower_growth DESC
LIMIT 10;
```

## Filtering Explained

### isperformer Filter

OnlyFans has two account types:
1. **Performers** (`isperformer = true`) - Creators who sell content
2. **Subscribers** (`isperformer = false`) - Regular users who consume content

V2 scanner **only stores performers** to avoid polluting database with subscriber accounts.

**Example API Response:**
```json
{
  "id": 123456,
  "username": "creator123",
  "isPerformer": true,  // ✅ Store this
  "subscribersCount": 1234
}
```

```json
{
  "id": 789012,
  "username": "subscriber456",
  "isPerformer": false,  // ❌ Skip this
  "subscribersCount": 0
}
```

### Deleted Page Detection

Deleted or unavailable profiles show:
- "Sorry this page is not available"
- "This profile no longer exists"
- HTTP 404 with error page

V2 scanner checks page content for these phrases and skips the ID.

**Stats tracking:**
- `non_performers` - Subscribers (isperformer=false)
- `deleted` - Deleted/unavailable pages
- `creators_found` - Valid performers stored

## Snapshots & Longitudinal Tracking

### Why Snapshots?

Every successful scrape writes TWO records:
1. **Profile upsert** (`onlyfans_profiles`) - Current state (overwrites existing)
2. **Snapshot insert** (`onlyfans_profile_snapshots`) - Historical point-in-time

This enables:
- Growth charts (followers over time)
- Price history tracking
- Post volume trends
- Bundle/promotion analysis

### Snapshot Data Model

```sql
CREATE TABLE onlyfans_profile_snapshots (
    snapshot_id BIGSERIAL PRIMARY KEY,
    creator_id BIGINT NOT NULL,  -- FK to onlyfans_profiles.id
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Key metrics
    favoritedcount BIGINT,
    subscriberscount BIGINT,
    postscount BIGINT,
    subscribeprice NUMERIC(10,2),
    
    -- Bundles and promotions
    bundle1_price NUMERIC(10,2),
    promotion1_price NUMERIC(10,2),
    promotion1_discount INTEGER
);
```

### Snapshot Strategy

**Per-scrape snapshots:**
- ✅ High granularity (exact scrape timestamps)
- ✅ No data loss
- ❌ Large table size (10K creators × 52 weeks = 520K rows/year)

**Daily aggregation (optional):**
```sql
-- Materialized view for daily metrics
CREATE MATERIALIZED VIEW daily_creator_metrics AS
SELECT 
    creator_id,
    DATE(captured_at) AS metric_date,
    MAX(favoritedcount) AS max_favoritedcount,
    MAX(postscount) AS max_postscount
FROM onlyfans_profile_snapshots
GROUP BY creator_id, DATE(captured_at);
```

Refresh daily via cron:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_creator_metrics;
```

## Resume Mechanism

### How It Works

1. **Progress tracking:** After every 100 IDs, scanner updates `scan_progress` table:
   ```sql
   UPDATE scan_progress SET last_id_scanned = 5100 WHERE id = 1;
   ```

2. **Resume on restart:** Next run reads `last_id_scanned` and starts from 5101

3. **Fallback:** If DB update fails, writes to `scan_state.json` (local file)

### Force Resume from Specific ID

```powershell
# Override resume, start from ID 10000
python scripts/v2_id_scanner.py --cookies cookies.json --start-id 10000 --no-resume
```

### Clear Resume State

```sql
-- Reset scan progress
UPDATE scan_progress SET last_id_scanned = 0, max_id_seen = 0 WHERE id = 1;
```

## Rate Limiting & Proxies

### Token Bucket Algorithm

V2 uses **token bucket** for smooth rate limiting:

```python
# 1 request per second, burst of 5
RateLimiter(rate=1.0, burst=5)
```

- **rate**: Average requests per second
- **burst**: Max requests immediately available

**Effect:**
- First 5 requests instant (burst)
- Subsequent requests: 1/sec (rate)
- Tokens refill at `rate` per second

### Proxy Pool Management

**Health scoring:**
- Start: 100 points
- Success: +2 points (max 100)
- Failure: -10 points (min 0)

**Quarantine:**
- 3+ consecutive failures → quarantine
- Quarantine duration: `30s * 2^(failures - 3)`
- Example: 3 failures = 30s, 4 failures = 60s, 5 failures = 120s

**Selection:**
- Always use highest-scoring available proxy
- If all quarantined, wait for first to recover

### Error Classification

| Error Type | Proxy Action | Retry |
|------------|--------------|-------|
| 404 Not Found | Success (page doesn't exist) | No |
| 403 Forbidden | Switch proxy | Yes (1x) |
| 429 Rate Limit | Switch proxy | Yes (1x) |
| 5xx Server Error | Keep proxy | Yes (3x exponential backoff) |
| Timeout | Keep proxy | Yes (3x exponential backoff) |

## Troubleshooting

### "Missing SUPABASE_URL or SUPABASE_KEY"

**Cause:** Environment variables not set

**Solution:**
```powershell
# Create .env file
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# Or export in PowerShell
$env:SUPABASE_URL = "https://your-project.supabase.co"
$env:SUPABASE_KEY = "your-service-role-key"
```

### No Creators Found (All Skipped)

**Cause:** Cookies expired or invalid

**Solution:**
1. Login to OnlyFans in browser
2. Export cookies (use browser extension)
3. Replace `cookies.json`
4. Retry with `--dry-run` to test

### "All proxies quarantined"

**Cause:** All proxies failed 3+ times

**Solution:**
- Wait for quarantine to expire (auto-recovery)
- Reduce rate: `--rate 0.5`
- Check proxy credentials
- Run without proxies: omit `--proxies` flag

### High Error Rate (>10%)

**Possible causes:**
1. **Rate limiting** - Reduce `--rate` and `--concurrency`
2. **Bad proxies** - Remove failing proxies from list
3. **Expired cookies** - Re-login and export new cookies
4. **Network issues** - Check internet connection

**Debug:**
```powershell
# Dry run with 10 IDs to test
python scripts/v2_id_scanner.py --cookies cookies.json --start-id 1 --end-id 10 --dry-run

# Check failed_ids_v2.json for error patterns
cat failed_ids_v2.json | python -m json.tool
```

### Duplicate Snapshots

**Cause:** Running scanner twice on same ID range

**Prevention:**
- Use `--resume` (enabled by default)
- Check `scan_progress` before large runs

**Cleanup (if needed):**
```sql
-- Optional: Add unique constraint to prevent duplicates
CREATE UNIQUE INDEX idx_snapshots_creator_day 
ON onlyfans_profile_snapshots(creator_id, DATE(captured_at));
```

## Production Deployment

### Recommended Setup

**Phase 1: Initial Discovery (ID 1 - 1M)**
```powershell
# Conservative settings for first full scan
python scripts/v2_id_scanner.py \
  --cookies cookies.json \
  --start-id 1 \
  --end-id 1000000 \
  --concurrency 2 \
  --rate 0.5 \
  --proxies http://proxy1 http://proxy2
```

**Phase 2: Weekly Refresh (to be implemented)**
- Use `v2_refresh_orchestrator.py` (Task 9)
- Query profiles where `next_refresh_at < NOW()`
- Re-scrape to update metrics and snapshots

**Phase 3: Incremental Discovery**
- Daily scan from `max(id)` to `max(id) + 10000`
- Find new creator registrations

### Monitoring

**Create dashboard queries:**

```sql
-- Scan progress
SELECT 
    last_id_scanned,
    max_id_seen,
    total_creators_found,
    updated_at
FROM scan_progress;

-- Recent performance
SELECT 
    DATE(started_at) AS date,
    COUNT(*) AS runs,
    SUM(total_success) AS total_success,
    AVG(total_success::float / NULLIF(total_attempted, 0)) AS avg_success_rate
FROM crawl_runs
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;

-- Database size
SELECT 
    pg_size_pretty(pg_total_relation_size('onlyfans_profiles')) AS profiles_size,
    pg_size_pretty(pg_total_relation_size('onlyfans_profile_snapshots')) AS snapshots_size;
```

### Cron Setup (Linux)

```bash
# crontab -e

# Daily incremental scan (1AM)
0 1 * * * cd /path/to/scraper && python scripts/v2_id_scanner.py --cookies cookies.json --resume

# Weekly full refresh (Sunday 2AM) - TO BE IMPLEMENTED
0 2 * * 0 cd /path/to/scraper && python scripts/v2_refresh_orchestrator.py --cookies cookies.json
```

### Windows Task Scheduler

```powershell
# Create daily task
$action = New-ScheduledTaskAction -Execute "python" -Argument "scripts/v2_id_scanner.py --cookies cookies.json --resume" -WorkingDirectory "C:\path\to\scraper"
$trigger = New-ScheduledTaskTrigger -Daily -At 1AM
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "OnlyFans V2 Scanner" -Description "Daily creator scan"
```

## Data Safety Guarantees

### V1 vs V2 Coexistence

- ✅ **V1 scraper still works** - No breaking changes
- ✅ **Shared database** - Both write to `onlyfans_profiles`
- ✅ **Additive schema** - New columns have defaults, V1 ignores them
- ✅ **No data loss** - UPSERT preserves existing rows

### Rollback Plan

```sql
-- If needed, remove V2 columns (not recommended)
ALTER TABLE onlyfans_profiles 
DROP COLUMN IF EXISTS first_seen_at,
DROP COLUMN IF EXISTS last_seen_at,
DROP COLUMN IF EXISTS last_refreshed_at,
DROP COLUMN IF EXISTS next_refresh_at,
DROP COLUMN IF EXISTS status;

-- Drop V2 tables (destructive!)
DROP TABLE IF EXISTS onlyfans_profile_snapshots CASCADE;
DROP TABLE IF EXISTS crawl_runs CASCADE;
DROP TABLE IF EXISTS scan_progress CASCADE;
DROP TABLE IF EXISTS crawl_jobs CASCADE;
```

## Next Steps (Not Yet Implemented)

### Task 9: Weekly Refresh Orchestrator

Create `scripts/v2_refresh_orchestrator.py`:
- Query profiles where `next_refresh_at < NOW()`
- Re-scrape each profile
- Update metrics and insert new snapshot
- Calculate next refresh time based on status

### Task 10: Incremental Discovery

Strategy:
1. Query `SELECT MAX(id) FROM onlyfans_profiles`
2. Scan from `MAX(id) + 1` to `MAX(id) + 10000`
3. Find new creator registrations
4. Update `max_id_seen` in scan_progress

### Dashboard Integration

Build frontend dashboard showing:
- Growth charts per creator
- Top trending creators (fastest growing)
- Price history analysis
- Bundle/promotion patterns

## FAQ

**Q: How long to scan 1 million IDs?**
A: At 1 req/sec with 3 concurrency:
- ~333,333 seconds = ~92 hours = ~4 days

**Q: Can I run multiple scanners in parallel?**
A: Not yet (sharding not implemented in current version). Use single scanner with `--concurrency` flag.

**Q: What happens if scanner crashes mid-run?**
A: Resume automatically picks up from `last_id_scanned` (updated every 100 IDs). Loss: max 100 IDs.

**Q: How much disk space for snapshots?**
A: Rough estimate:
- 10K creators × 52 weeks = 520K rows/year
- ~2KB per row = ~1GB/year

**Q: Can I delete old snapshots?**
A: Yes, safe to delete. Profile table maintains current state.
```sql
-- Delete snapshots older than 1 year
DELETE FROM onlyfans_profile_snapshots WHERE captured_at < NOW() - INTERVAL '1 year';
```

**Q: Does V2 replace V1?**
A: No. V1 is still useful for:
- Ad-hoc URL lists
- Specific creator batches
- Manual scraping tasks

V2 is for **systematic long-term tracking**.

---

**Documentation Version:** 1.0  
**Last Updated:** November 10, 2025  
**Status:** Core scanner complete (Tasks 1-8, 11-12 ✅) | Refresh orchestrator pending (Task 9) | Incremental discovery pending (Task 10)
