# Vercel 404 Fix Instructions

## Problem
Categories and creator profiles returning 404 errors due to Vercel build configuration overriding vercel.json rewrites.

## Root Cause
The Vercel dashboard has an **Output Directory** override set to "." or the **Framework Preset** is not set correctly, which causes:
1. Vercel to ignore vercel.json rewrites
2. HTML files not being served correctly
3. Routes returning 404 instead of serving the HTML files

## Solution - Fix Vercel Dashboard Settings

### Step 1: Access Vercel Project Settings
1. Go to https://vercel.com/dashboard
2. Select the FansPedia project
3. Click **Settings** tab
4. Go to **Build & Development Settings**

### Step 2: Configure Build Settings
Set the following:

1. **Framework Preset**: `Other` (NOT Next.js, NOT auto-detect)
2. **Build Command**: Leave EMPTY or set to `echo "No build needed"`
3. **Output Directory**: 
   - **TURN OFF the Override toggle** (very important!)
   - Leave completely blank
   - Do NOT set to "." or "public" or any value
4. **Install Command**: Leave as default (`npm install`)
5. **Root Directory**: Leave EMPTY

### Step 3: Save and Redeploy
1. Click **Save** at the bottom
2. Go to **Deployments** tab
3. Find the latest deployment
4. Click the three dots menu → **Redeploy**
5. Ensure "Use existing Build Cache" is UNCHECKED
6. Click **Redeploy**

### Step 4: Verify Fix
After deployment completes (~2 minutes), test these URLs:

1. Homepage: https://fanspedia.net/ (should work)
2. Categories: https://fanspedia.net/categories/ (should show category grid)
3. Single category: https://fanspedia.net/categories/goth (should show results)
4. Creator profile: https://fanspedia.net/fitbryceadams (should show profile)

All should return **200 OK** status, not 404.

## Why This Happens

Vercel has automatic framework detection. When it detects certain patterns (like a `public/` folder or certain file structures), it may:
- Override vercel.json settings
- Set a default output directory
- Change routing behavior

By explicitly setting "Framework Preset: Other" and disabling all overrides, we force Vercel to:
- Serve files from the project root
- Respect vercel.json rewrites
- Not apply any framework-specific behavior

## Files Structure (Correct)

```
fanspedia/
├── index.html          ← Root level (correct)
├── categories.html     ← Root level (correct)
├── category.html       ← Root level (correct)
├── creator.html        ← Root level (correct)
├── vercel.json         ← Routing configuration
├── api/                ← Serverless functions
├── config/             ← Static config files
├── static/             ← Static assets
└── public/             ← Legacy (contains old copies, can be ignored/deleted)
```

## Alternative: Nuclear Option

If the above doesn't work, create a fresh Vercel project:

1. Disconnect current project from Vercel
2. Create NEW Vercel project from GitHub
3. Let it auto-detect (should work with current structure)
4. Or manually set Framework=Other as above

## Related Documentation

See `.github/copilot-instructions.md` section "Known Issues & Workarounds" for full context on this Vercel routing bug.
