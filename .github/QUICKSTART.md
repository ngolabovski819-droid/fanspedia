# Quick Start Guide

## Setup (First Time)

### 1. Install Dependencies
```powershell
# Node.js dependencies
npm install

# Python dependencies
pip install -r requirements.txt
```

### 2. Configure Environment
Create `.env` file in project root:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-here
```

### 3. Test Local Server
```powershell
npm start
# Visit http://localhost:3000
```

## Common Development Tasks

### Add a New Category
```powershell
# 1. Edit config/categories.js - add to categories array
# 2. Update version in ALL HTML files (increment from ?v=20251106-2 to ?v=20251107-1)
# 3. Regenerate sitemaps (writes to repo root)
node scripts/build-sitemaps.cjs
# 4. Test locally
npm start
```

### Scrape New Profiles
```powershell
# 1. Ensure cookies.json exists with valid OnlyFans auth
# 2. Run scraper
python scripts/mega_onlyfans_scraper_full.py --urls urls.txt --output temp.csv --cookies cookies.json

# 3. Upload to Supabase
python scripts/load_csv_to_supabase.py --csv temp.csv --table onlyfans_profiles --batch-size 200 --upsert --on-conflict id --exclude-columns raw_json,timestamp

# 4. Check for failures
# If upload fails, check failed_batch.json for details
```

### Debug Search Issues
```powershell
# 1. Start local server
npm start

# 2. Test API directly
# Open browser: http://localhost:3000/api/search?q=test&page=1&page_size=10

# 3. Check console logs
# Look for "Fetching:", "Cache hit:", etc.
```

### Deploy to Production
```powershell
# 1. Commit changes
git add .
git commit -m "Description of changes"

# 2. Push to main branch (triggers Vercel deploy)
git push origin main

# 3. Monitor deployment at vercel.com dashboard
```

## File Reference

### Must Edit for Category Changes
- `config/categories.js` - Add/remove categories here
- `index.html` - Update version param in import
- `category.html` - Update version param in import
- `categories.html` - Update version param in import

### Auto-Generated (Don't Edit Manually)
- `sitemap.xml` - Run `node scripts/generate-sitemap.js`
- `public/sitemap.xml` - Copy of sitemap.xml

### Never Commit
- `.env` - Environment variables
- `cookies.json` - OnlyFans authentication
- `*.csv` - Scraped data files
- `failed_batch.json` - Upload error logs
- `progress_urls.json` - Scraper progress

## Troubleshooting

### "Missing SUPABASE_URL" Error
- Check `.env` file exists in project root
- Verify variables are named correctly (not SUPABASE_SERVICE_ROLE)
- For Vercel: Set in dashboard → Settings → Environment Variables

### Categories Not Updating
- Did you increment version param? (`?v=20251107-1`)
- Clear browser cache or use incognito mode
- Check browser DevTools → Network tab for 304 responses

### Scraper Getting No Data
- Verify `cookies.json` has valid auth cookies
- Check OnlyFans session hasn't expired (login again)
- Enable headless=False to see browser: `browser = await p.chromium.launch(headless=False)`

### CSV Upload Failing
- Use `--exclude-columns raw_json,timestamp` to skip problematic fields
- Reduce `--batch-size` to 50 or lower for debugging
- Check `failed_batch.json` for specific error details
- Verify Supabase service role key (not anon key)
