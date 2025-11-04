# Cloudflare Worker Setup for robots.txt Override

## Problem
Cloudflare's managed robots.txt injects a non-standard `Content-signal` directive that causes PageSpeed Insights errors.

## Solution
Deploy a Cloudflare Worker to intercept `/robots.txt` requests and serve a clean, standards-compliant version.

## Setup Instructions

### 1. Create the Worker

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account → **Workers & Pages**
3. Click **Create Application** → **Create Worker**
4. Name it: `robots-txt-override`
5. Click **Deploy**

### 2. Edit the Worker Code

1. After deployment, click **Edit Code**
2. Delete all existing code
3. Copy and paste the entire contents of `cloudflare-worker-robots.js`
4. Click **Save and Deploy**

### 3. Add Worker Route

1. Go back to your domain in Cloudflare
2. Navigate to **Workers Routes** (under Workers & Pages or DNS)
3. Click **Add Route**
4. Enter:
   - **Route:** `bestonlyfansgirls.net/robots.txt`
   - **Worker:** `robots-txt-override`
5. Click **Save**

### 4. Alternative: Quick Deploy via Wrangler CLI (Optional)

If you have Node.js installed:

```bash
npm install -g wrangler
wrangler login
wrangler deploy cloudflare-worker-robots.js --name robots-txt-override --route bestonlyfansgirls.net/robots.txt
```

### 5. Verify

Wait 2-3 minutes, then test:

```powershell
Invoke-WebRequest -Uri "https://bestonlyfansgirls.net/robots.txt" -UseBasicParsing | Select-Object -ExpandProperty Content
```

You should see only the clean robots.txt without the `Content-signal` line.

### 6. Delete the Page Rule

Once the Worker is active:
1. Go to **Rules** → **Page Rules**
2. Delete the `robots.txt` Page Rule (it's no longer needed)

## Result

- ✅ Clean, standards-compliant robots.txt
- ✅ No PageSpeed Insights errors
- ✅ AI bots still blocked
- ✅ Search engines can crawl normally
