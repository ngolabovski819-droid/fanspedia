# Complete Beginner's Guide to OnlyFans V2 Scraper

Welcome! This guide will walk you through everything step-by-step. No prior experience required.

---

## 📚 Table of Contents

1. [What This Does](#what-this-does)
2. [Before You Start](#before-you-start)
3. [Setup Steps](#setup-steps)
4. [Understanding the 3 Main Scripts](#understanding-the-3-main-scripts)
5. [How to Use Each Script](#how-to-use-each-script)
6. [Automation Setup](#automation-setup)
7. [Monitoring Your Data](#monitoring-your-data)
8. [Troubleshooting](#troubleshooting)

---

## What This Does

The V2 scraper helps you:
1. **Collect creator profiles** from OnlyFans automatically
2. **Track growth over time** (followers, posts, price changes)
3. **Keep data updated** by re-checking profiles weekly
4. **Find new creators** as they join OnlyFans

Think of it like a robot that:
- Visits creator pages
- Saves their info (username, follower count, price, etc.)
- Checks back later to see how they've grown
- Finds new creators automatically

---

## Before You Start

### What You Need

1. **Python installed** (you already have it ✅)
2. **Supabase account** (free database hosting)
3. **OnlyFans account** (to get authentication cookies)
4. **Basic computer skills** (copy/paste, run commands)

### Important Files You'll Work With

```
onlyfans-scraper/
├── cookies.json                    ← Your OnlyFans login (required)
├── .env                            ← Database credentials (required)
├── scripts/
│   ├── v2_id_scanner.py           ← Main scraper (finds ALL creators)
│   ├── v2_refresh_orchestrator.py ← Updates existing creators
│   ├── v2_incremental_discovery.py← Finds NEW creators daily
│   └── migrations/
│       └── 001_v2_snapshots...sql ← Database setup (run once)
```

---

## Setup Steps

### Step 1: Apply Database Migration

**What this does:** Creates tables in your database to store creator data.

1. Open your Supabase dashboard: https://supabase.com/dashboard
2. Click your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"
5. Open file: `scripts/migrations/001_v2_snapshots_and_tracking.sql`
6. Copy ALL the text from that file
7. Paste into Supabase SQL Editor
8. Click "Run" button (bottom right)
9. Should see "Success. No rows returned"

✅ Done! Your database now has tables for:
- `onlyfans_profiles` (current creator info)
- `onlyfans_profile_snapshots` (history for growth charts)
- `crawl_runs` (tracks each scraping session)
- `scan_progress` (remembers where you left off)

---

### Step 2: Set Environment Variables

**What this does:** Tells the scripts how to connect to your database.

#### Option A: Create .env file (Recommended)

1. In your `onlyfans-scraper` folder, create a new file called `.env`
2. Add these lines (replace with YOUR values):

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key-here
```

**Where to find these values:**
- Login to Supabase dashboard
- Click your project
- Click "Settings" (gear icon) → "API"
- Copy "Project URL" → paste as SUPABASE_URL
- Copy "service_role" key (NOT anon key!) → paste as SUPABASE_KEY

#### Option B: Set in PowerShell (Temporary)

```powershell
$env:SUPABASE_URL = "https://your-project.supabase.co"
$env:SUPABASE_KEY = "your-service-role-key"
```

*Note: This only lasts until you close PowerShell. Use .env file for permanent.*

---

### Step 3: Get OnlyFans Cookies

**What this does:** Lets the scraper login as you (required to see profiles).

1. Login to OnlyFans in Chrome browser
2. Install extension: **"EditThisCookie"** or **"Cookie-Editor"**
3. Click extension icon while on OnlyFans page
4. Click "Export" → copies cookies
5. Create file: `cookies.json` in your `onlyfans-scraper` folder
6. Paste the exported cookies
7. Save file

**Cookie format should look like:**
```json
[
  {
    "name": "sess",
    "value": "abc123...",
    "domain": ".onlyfans.com",
    "path": "/"
  },
  ...more cookies...
]
```

⚠️ **Important:** Cookies expire! If scraper stops working, export fresh cookies.

---

### Step 4: Validate Setup

**What this does:** Checks if everything is configured correctly.

```powershell
python scripts/test_v2_setup.py
```

**Expected output:**
```
✓ Python 3.7+
✓ Playwright
✓ Aiohttp
✓ TQDM
✓ Pandas
✓ SUPABASE_URL
✓ SUPABASE_KEY
✓ cookies.json exists
✓ cookies.json valid format
✓ Migration SQL exists
✓ Supabase REST API
✓ Shared utilities
✓ ID scanner

✓ All checks passed! Ready to run V2 scanner.
```

If you see ✗ (red X), follow the suggestions to fix.

---

## Understanding the 3 Main Scripts

### 1. ID Scanner (`v2_id_scanner.py`)

**Purpose:** Scans ALL OnlyFans creator IDs sequentially (1, 2, 3, 4, ...)

**When to use:**
- First time setup (scan everything)
- Building initial database
- Filling gaps in your data

**How it works:**
1. Visits https://onlyfans.com/1, then /2, then /3, etc.
2. Checks if ID is a creator (not just a subscriber)
3. Saves creator info if valid
4. Skips deleted/unavailable pages
5. Remembers progress (can resume if interrupted)

**Typical run time:**
- 1,000 IDs ≈ 15 minutes
- 10,000 IDs ≈ 2-3 hours
- 100,000 IDs ≈ 1-2 days

---

### 2. Refresh Orchestrator (`v2_refresh_orchestrator.py`)

**Purpose:** Re-checks existing creators to update their stats

**When to use:**
- Weekly (to keep data fresh)
- After initial scan completes
- To track growth over time

**How it works:**
1. Queries database for creators due for refresh
2. Visits each creator's page
3. Updates metrics (followers, posts, price)
4. Creates snapshot (for growth charts)
5. Schedules next refresh based on activity

**Refresh schedule:**
- Verified creators: Every 3 days
- Active creators: Every 7 days
- Inactive creators: Every 14 days
- Deleted creators: Every 30 days

---

### 3. Incremental Discovery (`v2_incremental_discovery.py`)

**Purpose:** Finds NEW creators as they join OnlyFans

**When to use:**
- Daily (after initial scan)
- To catch new sign-ups
- Keep database current

**How it works:**
1. Finds highest creator ID in your database (e.g., 500,000)
2. Scans forward 10,000 IDs (500,001 to 510,000)
3. Adds any new creators found
4. Repeat daily to stay up-to-date

**Example:**
- Day 1: Max ID = 500,000, scan to 510,000
- Day 2: Max ID = 510,000, scan to 520,000
- Day 3: Max ID = 520,000, scan to 530,000

---

## How to Use Each Script

### Script 1: ID Scanner (Initial Scan)

#### Test Run (Safe - No Database Changes)

```powershell
python scripts/v2_id_scanner.py --cookies cookies.json --start-id 1 --end-id 100 --dry-run
```

**What happens:**
- Scans IDs 1-100
- Shows what WOULD be saved
- Makes NO changes to database
- Good for testing

#### Real Run (Small Test)

```powershell
python scripts/v2_id_scanner.py --cookies cookies.json --start-id 1 --end-id 1000
```

**What happens:**
- Scans IDs 1-1000
- Saves valid creators to database
- Takes ~15 minutes
- Creates snapshots for growth tracking

#### Production Run (Large Scale)

```powershell
python scripts/v2_id_scanner.py --cookies cookies.json --end-id 100000 --concurrency 2 --rate 0.5
```

**Flags explained:**
- `--end-id 100000` = scan up to ID 100,000
- `--concurrency 2` = use 2 browser windows (safer, slower)
- `--rate 0.5` = 0.5 requests per second (avoids rate limits)

**Progress display:**
```
Scanning IDs: 23%|███▌      | 230/1000 [03:50<12:20, 1.04id/s, found=12, skipped=218, errors=0]
```
- `23%` = 23% complete
- `230/1000` = scanned 230 out of 1000 IDs
- `found=12` = found 12 valid creators
- `skipped=218` = skipped 218 (subscribers or deleted)
- `errors=0` = no errors

#### Resume Interrupted Scan

If your scan stops (computer restarts, internet drops), just run again:

```powershell
python scripts/v2_id_scanner.py --cookies cookies.json --end-id 100000
```

It automatically resumes from where it left off! ✨

#### Disable Resume (Start Fresh)

```powershell
python scripts/v2_id_scanner.py --cookies cookies.json --start-id 1 --end-id 1000 --no-resume
```

---

### Script 2: Refresh Orchestrator (Weekly Updates)

#### Test Run (Dry Mode)

```powershell
python scripts/v2_refresh_orchestrator.py --cookies cookies.json --dry-run
```

**What happens:**
- Finds creators due for refresh
- Shows what WOULD be updated
- Makes NO changes

#### Real Run (Update 100 Creators)

```powershell
python scripts/v2_refresh_orchestrator.py --cookies cookies.json --batch-size 100
```

**What happens:**
- Queries database for 100 creators needing refresh
- Visits each profile
- Updates metrics (followers, price, posts)
- Creates snapshot for growth tracking
- Schedules next refresh time

#### Priority Mode (Verified Creators Only)

```powershell
python scripts/v2_refresh_orchestrator.py --cookies cookies.json --priority-only
```

**What happens:**
- Only refreshes verified creators (✓ badge)
- Faster, focuses on popular accounts
- Good for daily quick updates

---

### Script 3: Incremental Discovery (Daily New Creators)

#### Test Run (Dry Mode)

```powershell
python scripts/v2_incremental_discovery.py --cookies cookies.json --dry-run
```

**What happens:**
- Finds your highest creator ID
- Shows scan range
- Makes NO changes

#### Real Run (Find New Creators)

```powershell
python scripts/v2_incremental_discovery.py --cookies cookies.json --buffer-size 10000
```

**What happens:**
- Gets max ID from database (e.g., 500,000)
- Scans 500,001 to 510,000
- Adds any new creators found
- Takes ~2-3 hours

#### Smaller Buffer (Faster)

```powershell
python scripts/v2_incremental_discovery.py --cookies cookies.json --buffer-size 5000
```

**What happens:**
- Scans only 5,000 IDs forward
- Faster (~1 hour)
- Good for daily runs

---

## Automation Setup

### Recommended Schedule

**Week 1: Initial Scan**
```powershell
# Scan first 100K IDs (takes 1-2 days)
python scripts/v2_id_scanner.py --cookies cookies.json --end-id 100000 --concurrency 2 --rate 0.5
```

**Week 2+: Maintenance**

**Daily (Morning):**
```powershell
# Find new creators (15 min)
python scripts/v2_incremental_discovery.py --cookies cookies.json --buffer-size 5000
```

**Weekly (Sunday):**
```powershell
# Refresh existing creators (2-3 hours for 1000 profiles)
python scripts/v2_refresh_orchestrator.py --cookies cookies.json --batch-size 1000
```

### Windows Task Scheduler Setup

1. Open "Task Scheduler" (search in Windows)
2. Click "Create Basic Task"
3. Name: "OnlyFans Daily Discovery"
4. Trigger: Daily at 2:00 AM
5. Action: Start a program
   - Program: `python`
   - Arguments: `scripts\v2_incremental_discovery.py --cookies cookies.json --buffer-size 5000`
   - Start in: `C:\Users\nickg\onlyfans-scraper`
6. Click "Finish"

Repeat for weekly refresh (Sundays at 3:00 AM).

---

## Monitoring Your Data

### Check Scan Progress

```sql
-- In Supabase SQL Editor
SELECT * FROM scan_progress;
```

**Output:**
```
last_id_scanned | max_id_seen | total_creators_found | updated_at
50000          | 50000       | 2,347               | 2025-11-10 14:30:00
```

**What it means:**
- Scanned up to ID 50,000
- Found 2,347 valid creators
- Last updated today at 2:30 PM

---

### View Recent Scraping Sessions

```sql
SELECT 
    run_type,
    started_at,
    finished_at,
    total_attempted,
    total_success,
    status
FROM crawl_runs
ORDER BY started_at DESC
LIMIT 10;
```

**Output shows:**
- Type (discovery, refresh, manual)
- When it started/finished
- How many IDs attempted
- How many succeeded
- Status (running, completed, failed)

---

### Count Total Creators

```sql
SELECT COUNT(*) as total_creators FROM onlyfans_profiles;
```

---

### Top 10 Most Popular Creators

```sql
SELECT 
    username,
    name,
    favoritedcount as followers,
    subscribeprice as price,
    isverified
FROM onlyfans_profiles
ORDER BY favoritedcount DESC
LIMIT 10;
```

---

### Growth Chart for Specific Creator

```sql
SELECT 
    DATE(captured_at) as date,
    favoritedcount as followers,
    postscount as posts
FROM onlyfans_profile_snapshots
WHERE creator_id = 123456  -- Replace with actual creator ID
ORDER BY date DESC
LIMIT 30;
```

**Shows:** Last 30 days of follower/post growth

---

## Troubleshooting

### Error: "Missing SUPABASE_URL or SUPABASE_KEY"

**Fix:** Set environment variables (see Step 2 above)

```powershell
# Quick fix (temporary)
$env:SUPABASE_URL = "your-url-here"
$env:SUPABASE_KEY = "your-key-here"
```

---

### Error: "No creators found" (all skipped)

**Cause:** Cookies expired

**Fix:**
1. Login to OnlyFans again
2. Export fresh cookies
3. Replace `cookies.json`
4. Try again

---

### Error: "All proxies quarantined"

**Cause:** Using proxies but they're all failing

**Fix:**
- Run WITHOUT proxies: Remove `--proxies` flag
- Or reduce rate: `--rate 0.3` (slower)

---

### Script Hangs / Freezes

**Fix:**
1. Press Ctrl+C to stop
2. Check internet connection
3. Try with `--concurrency 1` (single browser)
4. Check cookies are valid

---

### High Error Rate (>10%)

**Causes:**
- Rate limiting (going too fast)
- Bad cookies
- Bad proxies

**Fix:**
```powershell
# Slower, safer settings
python scripts/v2_id_scanner.py --cookies cookies.json --concurrency 1 --rate 0.3
```

---

## Quick Reference Card

### Essential Commands

```powershell
# Test setup
python scripts/test_v2_setup.py

# Initial scan (1000 IDs)
python scripts/v2_id_scanner.py --cookies cookies.json --end-id 1000

# Weekly refresh (100 creators)
python scripts/v2_refresh_orchestrator.py --cookies cookies.json --batch-size 100

# Daily discovery (5000 IDs forward)
python scripts/v2_incremental_discovery.py --cookies cookies.json --buffer-size 5000

# Dry run (test mode)
[add --dry-run to any command]
```

---

### Flag Reference

| Flag | What It Does | Example |
|------|-------------|---------|
| `--cookies` | Path to cookies file | `--cookies cookies.json` |
| `--start-id` | Starting ID | `--start-id 1000` |
| `--end-id` | Ending ID | `--end-id 50000` |
| `--concurrency` | Parallel browsers (1-5) | `--concurrency 3` |
| `--rate` | Requests/second (0.3-2.0) | `--rate 0.5` |
| `--batch-size` | Profiles per batch | `--batch-size 100` |
| `--buffer-size` | IDs to scan forward | `--buffer-size 5000` |
| `--dry-run` | Test mode (no saves) | `--dry-run` |
| `--no-resume` | Start from beginning | `--no-resume` |
| `--priority-only` | Verified creators only | `--priority-only` |

---

### File Locations

| File | Purpose |
|------|---------|
| `cookies.json` | Your OnlyFans login |
| `.env` | Database credentials |
| `failed_ids_v2.json` | IDs that failed (created after errors) |
| `failed_refresh_v2.json` | Refresh failures (created after errors) |

---

## Need More Help?

1. **Run validation:** `python scripts/test_v2_setup.py`
2. **Check full docs:** Open `V2_SCRAPER_README.md`
3. **Test with dry-run:** Add `--dry-run` flag to any command
4. **Start small:** Test with 100 IDs first

**Pro tip:** Always test with `--dry-run` first! It shows what would happen without making changes.

---

**Last Updated:** November 10, 2025  
**Version:** 1.0
