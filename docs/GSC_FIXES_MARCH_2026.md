# Google Search Console — Issue Resolution Report
**Date:** March 12, 2026  
**Project:** FansPedia (fanspedia.net)  
**Engineer:** Nick G.

---

## Executive Summary

Seven categories of Google Search Console indexing issues were investigated and resolved in a single session. The root causes were legacy creator profile URLs, stale sitemaps, missing route handlers, and unblocked parameter-based URLs. All code changes have been deployed to production via Vercel.

---

## Issues Fixed

### 1. Duplicate Without User-Selected Canonical — 2,392 pages
**Root cause:** Old creator profile URLs (`/c/{id}/{slug}` and `/{username}`) were previously indexed by Google. After creator pages were disabled, these URLs had no route — returning a custom Vercel 404 with no guidance on which URL Google should treat as canonical.

**What was fixed:**
- Added a catch-all rewrite in `vercel.json` so `/{username}` and `/c/:id/:slug` are routed to `api/creator_public/[username].js`
- Changed the handler from a 410 Gone response to a **301 redirect → homepage (`/`)**
- Result: Googlebot now follows the 301 to the homepage and reassigns link equity there

**Files changed:** `vercel.json`, `api/creator_public/[username].js`  
**Commit:** `6bbd688`

---

### 2. Page With Redirect — 1,983 pages
**Root cause:** Two stale creator sitemaps (`sitemap-creators-1.xml` and `sitemap_creators_1.xml`) contained 19,960 dead `/c/` creator URLs that Googlebot was actively crawling from the sitemap files. These files were no longer referenced in the sitemap index but were still publicly accessible.

**What was fixed:**
- Deleted `sitemap-creators-1.xml` (9,774 creator URLs)
- Deleted `sitemap_creators_1.xml` (10,186 creator URLs)
- Deleted `sitemap.xml.backup` (stale backup file, should never be public)
- Deleted `sitemap_countries.xml` (redundant — all 4 countries listed without hreflang, superseded by `sitemap_base.xml` which has all 5 countries with full EN/ES hreflang annotations)

**Manual action required:** In GSC → Sitemaps, remove any submitted entries for `sitemap-creators-1.xml` and `sitemap_creators_1.xml` if present.

**Files changed:** 4 files deleted  
**Commits:** `1558d4c`, `11b9127`

---

### 3. Not Found (404) — 374 pages
**Root cause:** Two issues:
1. `/{username}` creator profile URLs (e.g. `/demi_brookes`) had no route, falling through to Vercel's default 404 page
2. `/es/wishlist/` was present in `sitemap_base_es.xml` but had no rewrite rule — there was only a redirect FROM `/es/wishlist.html` TO `/es/wishlist/`, creating a dead end with no handler behind it

**What was fixed:**
- `/{username}` catch-all rewrite added (same fix as issue 1 above — 301 → `/`)
- Added `/es/wishlist` and `/es/wishlist/` rewrites to `vercel.json` pointing to `wishlist.html`

**Files changed:** `vercel.json`  
**Commits:** `6bbd688`, `306967f`

---

### 4. Excluded by Noindex — 366 pages
**Status: Intentional — no action needed**

These are search result URLs (`/?q=milf`, `/?q=bbw` etc.) that were correctly excluded by our `robots.txt` `Disallow: /*?q=` rule and the `<meta name="robots" content="noindex">` tag injected by the search API. This is by design — we don't want Google indexing infinite search result pages.

---

### 5. Alternate Page With Proper Canonical Tag — 298 pages
**Status: Correct behavior — no action needed**

Two sub-categories here:
- `/?v=20251119-1&u={username}` — legacy creator profile URLs from the old system. `index.html` already has `<link rel="canonical" href="https://fanspedia.net/">` so Google correctly recognises these as duplicates of `/` and excludes them. Additionally `robots.txt` was updated to block `/*?v=` and `/*?u=` to stop Googlebot discovering new ones.
- `/es/` category and country pages — Google correctly treats these as hreflang alternates of the EN canonical pages. This is intended behavior.

**Files changed:** `robots.txt`  
**Commit:** `37eb604`

---

### 6. Crawled — Currently Not Indexed — 1,009 pages
**Root cause:** The vast majority are old `www.fanspedia.net/creator.html?v=...&u=...` and `www.fanspedia.net/{username}` URLs crawled January–February 2026, before the `www.` → canonical redirect and creator catch-all routes were in place. Also included `/?q=${encodeURIComponent(term)}` — a literal uninterpolated JS template string URL from an early version of the site.

**What was fixed:**
- All `www.` URLs now 301-redirect to `fanspedia.net` equivalents (already in `vercel.json`)
- `/{username}` catch-all now 301-redirects to `/`
- `robots.txt` now blocks `/*?v=`, `/*?u=`, `/*?q=` preventing re-discovery
- As Googlebot re-crawls these URLs over the coming weeks they will follow the redirect chains and self-resolve

**No new code changes required beyond commits already listed above.**

---

### 7. Soft 404 — 1 page
**Root cause:** `https://www.fanspedia.net/categories/${slug}/` — a literal uninterpolated JS template string URL that was crawled by Googlebot in December 2025 when the site served `category.html` in a no-JS context. The SSR handler received the literal slug `${slug}`, found 0 results, and returned HTTP 200 with "No results found" — which Google flagged as a soft 404.

**What was fixed:**
- `api/ssr/category.js` and `api/ssr/es-category.js` now return a proper **HTTP 404** response when a category slug yields 0 results on page 1, instead of a 200 with empty content
- On next Googlebot crawl: `www.` → 301 → `fanspedia.net`, then `/categories/${slug}/` → 404 → removed from GSC

**Files changed:** `api/ssr/category.js`, `api/ssr/es-category.js`  
**Commit:** `86ff372`

---

## All Commits (Chronological)

| Commit | Description |
|---|---|
| `6bbd688` | Add `/:username` and `/c/:id/:slug` catch-all rewrites → 301 to homepage |
| `1558d4c` | Delete stale creator sitemaps (19,960 dead URLs removed) |
| `11b9127` | Delete redundant `sitemap_countries.xml` |
| `306967f` | Add `/es/wishlist/` rewrite (was 404) |
| `37eb604` | Block legacy `?v=` and `?u=` params in `robots.txt` |
| `86ff372` | Return hard 404 for unknown category slugs (fix soft 404) |

---

## Outstanding Manual Actions (GSC Dashboard)

1. **GSC → Sitemaps:** Remove any submitted entries for:
   - `sitemap-creators-1.xml`
   - `sitemap_creators_1.xml`
   
   These files no longer exist on the server. Removing them from GSC stops Googlebot from attempting to fetch them and logging errors.

---

## Expected Timeline for GSC Numbers to Improve

| Issue | Expected Resolution |
|---|---|
| Duplicate without canonical (2,392) | 2–4 weeks as Googlebot re-crawls |
| Page with redirect (1,983) | 2–4 weeks after GSC sitemap removal |
| Not found 404 (374) | 1–3 weeks as Googlebot re-crawls |
| Excluded by noindex (366) | Will grow slightly then stabilise — intentional |
| Alternate canonical (298) | Will shrink as `robots.txt` blocks new discoveries — 2–4 weeks |
| Crawled not indexed (1,009) | 2–6 weeks as Googlebot re-crawls old URLs |
| Soft 404 (1) | Next Googlebot crawl of that URL |

---

## Current Clean Sitemap Structure

| File | Contents |
|---|---|
| `sitemap.xml` / `sitemap-index.xml` | Index pointing to base + ES sitemaps |
| `sitemap_base.xml` | All EN pages with hreflang EN/ES/x-default |
| `sitemap_base_es.xml` | All ES pages with hreflang EN/ES/x-default |
| ~~`sitemap-creators-1.xml`~~ | Deleted |
| ~~`sitemap_creators_1.xml`~~ | Deleted |
| ~~`sitemap_countries.xml`~~ | Deleted (superseded by `sitemap_base.xml`) |
| ~~`sitemap.xml.backup`~~ | Deleted |
