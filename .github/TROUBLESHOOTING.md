# Troubleshooting Guide

## 🔴 Common Errors & Solutions

### "Missing SUPABASE_URL or SUPABASE_KEY env vars"

**Symptoms:**
- API returns 500 error
- Error message in browser console or Vercel logs

**Cause:**
- Environment variables not set
- Wrong variable names used

**Solutions:**

**Local Development:**
1. Create `.env` file in project root:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
```

2. Restart server: `npm start`

**Production (Vercel):**
1. Go to Vercel dashboard → Your Project → Settings → Environment Variables
2. Add both variables (use service role key, NOT anon key)
3. Redeploy: Go to Deployments → Latest → Redeploy

**Verification:**
```powershell
# Test API endpoint
curl http://localhost:3000/api/search?q=test&page=1
# Should return JSON, not error
```

---

### Categories Not Updating in Browser

**Symptoms:**
- Added category to config but doesn't appear on site
- Old category still shows after deletion
- Changes work locally but not on production

**Cause:**
- Browser cache or CDN cache
- Forgot to increment version param

**Solutions:**

1. **Check version param incremented**
   - In `index.html`, `category.html`, `categories.html`
   - Look for: `from '/config/categories.js?v=20251107-1'`
   - Increment: `?v=20251107-2` (or next date/number)

2. **Clear browser cache**
   - Chrome: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or open in Incognito mode

3. **Verify on production**
   - Wait 1-2 minutes for Vercel deploy
   - Check Network tab in DevTools
   - Should see new version param in request

**Prevention:**
- Always increment version when editing `config/categories.js`
- Use same version number in all three HTML files

---

### Scraper Not Capturing Data

**Symptoms:**
- Scraper runs but temp.csv is empty or has few rows
- Console shows URLs visited but no "✅ Captured" messages
- CSV missing expected profiles

**Cause:**
- Expired OnlyFans session (cookies)
- Network interception not working
- Profile URLs incorrect

**Solutions:**

1. **Refresh cookies.json**
   - Login to OnlyFans in browser
   - Export cookies (use browser extension)
   - Replace `cookies.json` with fresh export
   - Format: Array of objects with `name`, `value`, `domain`, `path`

2. **Enable visual debugging**
   ```python
   # In scraper file, change:
   browser = await p.chromium.launch(headless=False)  # Was: headless=True
   ```
   - Watch browser automation
   - Check if pages load correctly
   - Verify login state

3. **Test single URL**
   ```powershell
   python scripts/mega_onlyfans_from_urls.py --urls test.txt --output test.csv --cookies cookies.json --limit 1
   ```
   - Create `test.txt` with one known-good URL
   - Should see capture message in console

4. **Check URL format**
   - Must be full URL: `https://onlyfans.com/username`
   - NOT just username
   - Check for typos

**Verification:**
- Look for "Response handler" errors in console
- Check if `/api2/v2/users/` appears in browser network tab

---

### CSV Upload Failing to Supabase

**Symptoms:**
- `failed_batch.json` created with errors
- Error about invalid JSON or data types
- Upload script crashes mid-batch

**Cause:**
- NaN or infinity values in CSV
- Timestamp format incompatible
- Column name mismatch
- Data type mismatch

**Solutions:**

1. **Use exclude-columns flag**
   ```powershell
   python scripts/load_csv_to_supabase.py --csv temp.csv --table onlyfans_profiles --batch-size 200 --upsert --on-conflict id --exclude-columns raw_json,timestamp,firstpublishedpostdate,joindate,lastseen
   ```

2. **Reduce batch size**
   ```powershell
   --batch-size 50  # Instead of 200
   ```
   - Easier to identify problematic row

3. **Test with 1 row**
   ```powershell
   python scripts/load_csv_to_supabase.py --csv temp.csv --table onlyfans_profiles --limit 1 --batch-size 1 --upsert --on-conflict id
   ```

4. **Check failed_batch.json**
   ```powershell
   cat failed_batch.json | python -m json.tool
   ```
   - Look for specific error message
   - Identify problematic column

5. **Verify service role key**
   - In `.env`: Use service role key (full permissions)
   - NOT anon key (read-only)

**Common Fixes:**
- Timestamp: Exclude timestamp columns
- JSON: Exclude raw_json column
- IDs: Ensure numeric columns are integers, not floats

---

### Search Returns Wrong Results

**Symptoms:**
- Searching "goth" returns unrelated profiles
- Location search shows false positives
- Multi-term search doesn't work

**Cause:**
- Search includes `location` column (false positives like "Gotham")
- Synonyms misconfigured
- Query syntax error

**Solutions:**

1. **Check search columns in api/search.js**
   - Should be: `['username', 'name', 'about']`
   - Should NOT include `location`

2. **Verify synonyms in config/categories.js**
   ```javascript
   const synonymsOverrides = {
     'goth': ['goth', 'gothic'], // NOT 'gotham'
   };
   ```

3. **Test multi-term syntax**
   ```
   q=goth|gothic|alt
   ```
   - Terms separated by | or ,
   - No spaces around separators

4. **Test API directly**
   ```
   http://localhost:3000/api/search?q=goth&page=1&page_size=10
   ```
   - Check JSON response
   - Verify relevant results

**Prevention:**
- Keep synonyms tightly scoped
- Avoid generic terms that match too broadly

---

### Images Not Loading / Broken Images

**Symptoms:**
- Gray placeholder boxes instead of images
- Console errors about weserv.nl
- Slow image loading

**Cause:**
- Image URLs invalid or expired
- Proxy service down
- CORS issues

**Solutions:**

1. **Check image URL in DevTools**
   - Network tab → Find image request
   - Check status code (should be 200)
   - If 404: Original image gone from OnlyFans

2. **Verify weserv.nl proxy**
   - Test: `https://images.weserv.nl/?url=public.onlyfans.com/...&w=320&h=427`
   - Should return image
   - If error: Check proxy service status

3. **Check fallback logic**
   ```javascript
   <img src="..." onerror="this.src='/static/no-image.png'" />
   ```
   - Fallback image should exist in `/static/`

4. **DNS prefetch**
   - Verify in HTML head: `<link rel="preconnect" href="https://images.weserv.nl">`

**Prevention:**
- Always set fallback image
- Use responsive srcset for better fallback

---

### "Load More" Button Not Working

**Symptoms:**
- Button click does nothing
- Button disabled when more results exist
- Button missing entirely

**Cause:**
- `hasMore` flag incorrectly set
- `isLoading` stuck true
- JavaScript error preventing execution

**Solutions:**

1. **Check browser console**
   - Look for JavaScript errors
   - Fix any syntax/reference errors

2. **Check state variables**
   ```javascript
   console.log('currentPage:', currentPage);
   console.log('isLoading:', isLoading);
   console.log('hasMore:', hasMore);
   ```
   - `hasMore` should be true when more results exist
   - `isLoading` should be false when idle

3. **Verify button event listener**
   - Check if `loadMoreBtn.addEventListener` exists
   - Ensure button ID matches: `id="loadMoreBtn"`

4. **Test API manually**
   - Try next page: `?page=2`
   - If returns data, pagination works

**Prevention:**
- Always set `isLoading = false` in finally block
- Update `hasMore` based on data.length === pageSize

---

### Deployment Succeeds But Changes Not Visible

**Symptoms:**
- Vercel shows successful deployment
- Changes visible locally but not on production
- Old version still loading

**Cause:**
- CDN cache
- Deployment targeting wrong branch
- Environment variables missing

**Solutions:**

1. **Hard refresh browser**
   - Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or test in Incognito

2. **Check deployment branch**
   - Vercel dashboard → Deployments
   - Verify deployed from `main` branch
   - Check commit hash matches your latest

3. **Check environment variables**
   - Vercel dashboard → Settings → Environment Variables
   - Ensure `SUPABASE_URL` and `SUPABASE_KEY` set
   - Redeploy if recently changed

4. **Check Vercel build logs**
   - Look for errors during build
   - Verify all files uploaded

5. **Manual redeploy**
   - Vercel dashboard → Deployments → Latest → Redeploy

**Prevention:**
- Wait 2-3 minutes after deploy before testing
- Use versioned URLs for static assets

---

### Mobile Menu Not Opening

**Symptoms:**
- Hamburger icon click does nothing
- Drawer doesn't slide in
- Mobile-only issue

**Cause:**
- JavaScript error on mobile
- Touch event not handled
- CSS z-index issue

**Solutions:**

1. **Test on mobile DevTools**
   - Chrome DevTools → Toggle device toolbar
   - Select mobile device
   - Check console for errors

2. **Verify event listener**
   ```javascript
   mobileMenuToggle.addEventListener('click', openDrawer);
   ```

3. **Check z-index**
   - Drawer should have `z-index: 10001`
   - Overlay should have `z-index: 10000`

4. **Test touch events**
   - Add: `addEventListener('touchstart', ...)`
   - Some mobile browsers need explicit touch handling

**Prevention:**
- Test all interactive elements on mobile
- Use both click and touch events

---

## 🛠️ Debugging Tools

### Browser DevTools
- **Console**: JavaScript errors and logs
- **Network**: API requests and responses
- **Application**: LocalStorage, cookies
- **Performance**: Lighthouse audit

### Vercel Dashboard
- **Deployments**: Build logs and errors
- **Functions**: Serverless function logs
- **Analytics**: Traffic and performance metrics

### Supabase Dashboard
- **Table Editor**: View/edit data
- **SQL Editor**: Run queries
- **Logs**: Database query logs

### Python Debugging
```python
# Add print statements
print(f"Processing URL: {url}")
print(f"Captured row: {row}")

# Enable headless=False
browser = await p.chromium.launch(headless=False)

# Add try-except
try:
    # risky code
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
```

---

## 📞 When All Else Fails

1. **Check recent changes**
   - `git log` to see recent commits
   - `git diff` to see changes
   - `git revert` to undo if needed

2. **Compare with working version**
   - Checkout previous commit
   - Test if issue exists there
   - Narrow down which commit broke it

3. **Fresh clone**
   - Clone repo to new directory
   - Set up from scratch
   - See if issue persists

4. **Check dependencies**
   - `npm install` to refresh Node modules
   - `pip install -r requirements.txt` for Python

5. **Clear all caches**
   - Browser cache
   - Node modules: Delete `node_modules/`, run `npm install`
   - Python cache: Delete `__pycache__/`
