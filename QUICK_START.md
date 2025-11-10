# 🚀 Quick Start Cheat Sheet

## One-Time Setup (5 minutes)

### 1️⃣ Database Setup
```sql
-- In Supabase SQL Editor, run:
scripts/migrations/001_v2_snapshots_and_tracking.sql
```

### 2️⃣ Environment Variables
```powershell
# Copy .env.example to .env
copy .env.example .env

# Edit .env file with your credentials
notepad .env
```

### 3️⃣ Validate Setup
```powershell
python scripts/test_v2_setup.py
```

---

## Daily Commands

### 🔍 Find New Creators (15 min)
```powershell
python scripts/v2_incremental_discovery.py --cookies cookies.json --buffer-size 5000
```

### 🔄 Refresh Existing (2-3 hours for 1000 profiles)
```powershell
python scripts/v2_refresh_orchestrator.py --cookies cookies.json --batch-size 1000
```

---

## First-Time Full Scan

### Test (100 IDs - 2 min)
```powershell
python scripts/v2_id_scanner.py --cookies cookies.json --end-id 100 --dry-run
```

### Small Run (1,000 IDs - 15 min)
```powershell
python scripts/v2_id_scanner.py --cookies cookies.json --end-id 1000
```

### Production (100,000 IDs - 1-2 days)
```powershell
python scripts/v2_id_scanner.py --cookies cookies.json --end-id 100000 --concurrency 2 --rate 0.5
```

---

## Troubleshooting Commands

### Check What Needs Fixing
```powershell
python scripts/test_v2_setup.py
```

### Set Env Vars (Quick)
```powershell
$env:SUPABASE_URL = "your-url"
$env:SUPABASE_KEY = "your-key"
```

### Install Missing Dependency
```powershell
pip install aiohttp
```

### Test With Dry Run
```powershell
# Add --dry-run to ANY command to test without saving
python scripts/v2_id_scanner.py --cookies cookies.json --end-id 100 --dry-run
```

---

## Monitoring (Supabase SQL Editor)

### Check Progress
```sql
SELECT * FROM scan_progress;
```

### Count Creators
```sql
SELECT COUNT(*) FROM onlyfans_profiles;
```

### Recent Runs
```sql
SELECT * FROM crawl_runs ORDER BY started_at DESC LIMIT 5;
```

### Top Creators
```sql
SELECT username, favoritedcount 
FROM onlyfans_profiles 
ORDER BY favoritedcount DESC 
LIMIT 10;
```

---

## Common Flags

| Flag | Use Case | Example |
|------|----------|---------|
| `--dry-run` | Test without saving | Always use first! |
| `--concurrency 2` | Slower but safer | Avoid rate limits |
| `--rate 0.5` | 0.5 requests/sec | Avoid detection |
| `--batch-size 100` | Process 100 at a time | Refresh orchestrator |
| `--buffer-size 5000` | Scan 5000 IDs forward | Daily discovery |
| `--priority-only` | Verified creators only | Quick updates |

---

## Safety Tips

✅ **Always test with --dry-run first**
✅ **Start with small ID ranges (100-1000)**
✅ **Use low concurrency (1-2) when learning**
✅ **Check cookies are fresh (re-export if errors)**
✅ **Monitor error rates (should be <10%)**

❌ **Don't use high concurrency (>3) without testing**
❌ **Don't skip --dry-run on production runs**
❌ **Don't use anon key (use service_role key)**

---

## File Checklist

- [x] `cookies.json` exists and valid
- [x] `.env` file with SUPABASE_URL and SUPABASE_KEY
- [x] Migration applied in Supabase
- [x] `python scripts/test_v2_setup.py` shows all ✓

---

## Help Resources

📖 **Full Guide:** `BEGINNER_GUIDE.md`
📖 **Technical Docs:** `V2_SCRAPER_README.md`
🧪 **Test Setup:** `python scripts/test_v2_setup.py`

---

**Quick Question?** 
- Cookies not working? Re-export from OnlyFans
- Database errors? Check .env file has correct credentials
- Script hangs? Try --concurrency 1 --rate 0.3
- No creators found? Run with --dry-run to debug
