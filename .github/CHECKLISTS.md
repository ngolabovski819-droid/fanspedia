# Development Checklists

## ✅ Adding a New Category

**Before You Start:**
- [ ] Decide on category name (lowercase, plural if applicable)
- [ ] Identify primary search terms and synonyms
- [ ] Determine if it's a compound category (needs filters)

**Steps:**
1. **Edit `config/categories.js`**
   - [ ] Add category to `categories` array
   - [ ] If compound: Add entry to `compoundCategories` object
   - [ ] Add synonyms to `synonymsOverrides` object
   - [ ] Verify slug will be URL-friendly (no special chars)

2. **Update Cache Versions**
   - [ ] Edit `index.html` - increment `?v=` param in import
   - [ ] Edit `category.html` - increment `?v=` param in import  
   - [ ] Edit `categories.html` - increment `?v=` param in import
   - [ ] Ensure all three files use same version number

3. **Regenerate SEO Files**
   - [ ] Run: `node scripts/generate-sitemap.js`
   - [ ] Verify sitemap.xml updated with new category

4. **Test Locally**
   - [ ] Run: `npm start`
   - [ ] Visit: `http://localhost:3000/categories/`
   - [ ] Verify new category appears in grid
   - [ ] Click category, verify results load
   - [ ] Test search with synonyms
   - [ ] Check mobile dropdown includes category (if in popularCategories)

5. **Deploy**
   - [ ] Commit changes: `git add . && git commit -m "Add [category] category"`
   - [ ] Push to main: `git push origin main`
   - [ ] Monitor Vercel deployment
   - [ ] Test production URL after deploy

**Rollback Plan:**
- If category breaks site, revert commit: `git revert HEAD && git push`

---

## ✅ Scraping New Profiles

**Prerequisites:**
- [ ] Valid `cookies.json` file exists
- [ ] OnlyFans session is active (test by visiting site)
- [ ] Python dependencies installed: `pip install -r requirements.txt`
- [ ] Have list of URLs or ID range

**Steps:**
1. **Prepare Input**
   - [ ] Create `urls.txt` with one URL per line
   - OR [ ] Determine ID range for scanner

2. **Run Scraper**
   - [ ] Choose appropriate scraper:
     - Full scrape: `mega_onlyfans_scraper_full.py`
     - Retry failed: `mega_onlyfans_scraper_retry.py`
     - From URLs: `mega_onlyfans_from_urls.py`
     - ID scanner: `mega_onlyfans_id_scanner.py`
   
   - [ ] Run with options:
     ```powershell
     python scripts/mega_onlyfans_scraper_full.py --urls urls.txt --output temp.csv --cookies cookies.json
     ```
   
   - [ ] Monitor progress (tqdm bar should show)
   - [ ] Check for errors in console

3. **Validate Data**
   - [ ] Run: `python scripts/verify_counts.py temp.csv`
   - [ ] Check row count matches expected
   - [ ] Open CSV in Excel/viewer, spot-check data
   - [ ] Verify critical columns present: id, username, name

4. **Upload to Supabase**
   - [ ] Run upload script:
     ```powershell
     python scripts/load_csv_to_supabase.py --csv temp.csv --table onlyfans_profiles --batch-size 200 --upsert --on-conflict id --exclude-columns raw_json,timestamp
     ```
   
   - [ ] Monitor batch progress
   - [ ] Check for failed batches (written to `failed_batch.json`)

5. **Verify Upload**
   - [ ] Test search on production: Search for newly added username
   - [ ] Check Supabase dashboard for row count increase
   - [ ] If failures exist, debug `failed_batch.json` and retry

6. **Cleanup**
   - [ ] Archive or delete `temp.csv` (DO NOT commit)
   - [ ] Clear `failed_batch.json` after resolving
   - [ ] Update `progress_urls.json` if using incremental scraping

**Troubleshooting:**
- Session expired? Re-login to OnlyFans, export new cookies
- Scraper hanging? Enable headless=False to see browser
- Upload failing? Reduce batch size to 50, use --exclude-columns

---

## ✅ Deploying to Production

**Pre-Deploy Checklist:**
- [ ] All changes tested locally (`npm start`)
- [ ] No console errors in browser DevTools
- [ ] Search functionality works
- [ ] Categories load correctly
- [ ] Images display properly
- [ ] Mobile responsive (test in DevTools)

**Deployment Steps:**
1. **Verify Environment**
   - [ ] Supabase credentials set in Vercel dashboard
   - [ ] Environment variables match `.env.example`

2. **Commit & Push**
   - [ ] Stage changes: `git add .`
   - [ ] Commit with message: `git commit -m "Description"`
   - [ ] Push to main: `git push origin main`

3. **Monitor Deploy**
   - [ ] Watch GitHub Actions tab for workflow run
   - [ ] Check Vercel dashboard for deployment status
   - [ ] Wait for "Deployment successful" confirmation

4. **Post-Deploy Verification**
   - [ ] Visit production URL: `https://bestonlyfansgirls.net`
   - [ ] Test search functionality
   - [ ] Verify new changes appear
   - [ ] Check categories page
   - [ ] Test on mobile device
   - [ ] Run Lighthouse audit (optional)

5. **SEO Update (if categories changed)**
   - [ ] Submit sitemap to Google Search Console
   - [ ] Request reindex of changed pages

**Rollback Plan:**
- Vercel dashboard → Deployments → Find previous version → Promote to Production

---

## ✅ Debugging Search Issues

**Symptom Checklist:**
- [ ] No results returned
- [ ] Wrong results returned
- [ ] Search hanging/not responding
- [ ] Error message displayed
- [ ] Filters not working

**Debugging Steps:**
1. **Check API Response**
   - [ ] Open DevTools → Network tab
   - [ ] Perform search
   - [ ] Find `/api/search` request
   - [ ] Check status code (should be 200)
   - [ ] Inspect response body

2. **Test API Directly**
   - [ ] Copy API URL from Network tab
   - [ ] Open in new browser tab
   - [ ] Verify JSON response structure
   - [ ] Check if data matches expected format

3. **Check Backend Logs**
   - [ ] Local: Check terminal where `npm start` is running
   - [ ] Production: Check Vercel dashboard → Functions → Logs
   - [ ] Look for "Cache hit", "Fetching", errors

4. **Verify Supabase**
   - [ ] Login to Supabase dashboard
   - [ ] Table Editor → onlyfans_profiles
   - [ ] Run manual query matching API params
   - [ ] Verify data exists for search term

5. **Check Frontend State**
   - [ ] Browser console: `currentPage`, `isLoading`, `hasMore`
   - [ ] Check for JavaScript errors
   - [ ] Verify event listeners attached

6. **Common Fixes**
   - [ ] Clear browser cache (Ctrl+Shift+R)
   - [ ] Verify category version params updated
   - [ ] Check environment variables set
   - [ ] Restart local server
   - [ ] Verify Supabase key hasn't expired

---

## ✅ Performance Optimization

**Metrics to Check:**
- [ ] Core Web Vitals (Lighthouse)
- [ ] API response time (<1s target)
- [ ] Image load time
- [ ] Time to Interactive

**Frontend Optimizations:**
- [ ] First card uses `loading="eager"` and `fetchpriority="high"`
- [ ] Other cards use `loading="lazy"`
- [ ] Images use responsive srcset
- [ ] DNS prefetch for external domains
- [ ] Categories.js uses cache version param

**Backend Optimizations:**
- [ ] In-memory cache enabled (60s TTL)
- [ ] Supabase query selects only needed columns
- [ ] Results limited to 50 per page
- [ ] Indexes exist on favoritedcount, subscribeprice

**Database Optimizations:**
- [ ] Verify indexes in Supabase dashboard
- [ ] Add composite index if filtering on multiple columns
- [ ] Check query performance in Supabase logs

**Monitoring:**
- [ ] Vercel Analytics enabled
- [ ] Check function execution time
- [ ] Monitor cold start frequency
- [ ] Track error rate

---

## ✅ Security Audit

**Before Committing:**
- [ ] `.env` file NOT staged
- [ ] `cookies.json` NOT staged
- [ ] No CSV files staged
- [ ] No `failed_batch.json` staged
- [ ] No `progress_urls.json` staged

**Environment Variables:**
- [ ] Production keys different from local
- [ ] Service role key used (not anon key)
- [ ] Keys not logged to console
- [ ] Keys not exposed in client-side code

**API Security:**
- [ ] No CORS issues
- [ ] Rate limiting considered (Vercel auto-handles)
- [ ] No sensitive data in URLs
- [ ] Error messages don't leak credentials

**Data Privacy:**
- [ ] No user tracking without consent
- [ ] LocalStorage only for preferences
- [ ] No cookies for tracking
- [ ] Scraped data from public profiles only

---

## ✅ SEO Checklist

**On-Page SEO:**
- [ ] Title tags unique per page
- [ ] Meta descriptions compelling (<160 chars)
- [ ] H1 tags present on all pages
- [ ] Canonical URLs set
- [ ] OG tags for social sharing

**Technical SEO:**
- [ ] Sitemap.xml generated
- [ ] Robots.txt allows indexing
- [ ] No broken links (check with crawler)
- [ ] Mobile-friendly (Google test)
- [ ] HTTPS enabled

**Content SEO:**
- [ ] Categories have descriptive names
- [ ] Search URLs use clean slugs
- [ ] Alt text on images (where applicable)
- [ ] FAQ sections on category pages

**Monitoring:**
- [ ] Google Search Console connected
- [ ] Submit sitemap to GSC
- [ ] Monitor index coverage
- [ ] Check for crawl errors
- [ ] Track search impressions
