# FansPedia — Copilot Instructions

## Development Workflow
- **Always test changes locally before pushing.** After making any changes, start the local server (`npm start` → `http://127.0.0.1:3000`) and verify the affected pages work correctly.
- **Never run `git push` unless the user explicitly says to push.** Wait for the user to say "push" or "deploy" before pushing to `main`.
- Commit locally with `git commit` after verifying, but hold the push until instructed.

## Big Picture
- Vanilla HTML/JS frontend (no build step) + Vercel serverless API + Supabase PostgREST. Domain: `fanspedia.net`.
- Dual language: English root (`/`) + Spanish mirror (`/es/`) — Spanish pages generated via `node scripts/build-spanish-pages.cjs`.
- Creator profile pages are **intentionally disabled** — `api/creator_public/[username].js` returns 410 Gone. `creator.html` has been archived to `_archive/creator.html` and is no longer served. Do not re-enable without discussion.
- Blog content lives in `content/blog/` as Markdown with YAML frontmatter; served by `api/blog.js` and `api/blog-post.js`.

## Pages & Routing
Core pages: `index.html` (search), `categories.html`, `category.html`, `locations.html`, `near-me.html`, `blog.html`, `blog-post.html`, `wishlist.html`. Country pages: `united-states.html`, `canada.html`, `india.html`, `japan.html`.

**Key `vercel.json` patterns:**
- `/categories/:slug` → `api/ssr/category` (SSR handler — Googlebot sees pre-rendered content)
- `/country/:name` → `api/ssr/country` (SSR handler — same pattern as categories)
- `/blog/:slug` → `blog-post.html`
- All `.html` extension URLs 301-redirect to clean paths (e.g. `/index.html` → `/`)
- `api/blog.js` and `api/blog-post.js` use `"includeFiles": "content/blog/**"` — required for Vercel to bundle the markdown files

**Local dev** (`server.js`): Mirrors rewrites with Express routes. Creator/username paths redirect to `/` locally (SSR disabled). Blog and admin routes work. Run: `npm start` → `http://127.0.0.1:3000`.

## Frontend Conventions
- **Categories**: single source of truth in `config/categories.js` — exports `categories`, `popularCategories`, `compoundCategories`, `synonymsMap`, `categoryToSlug()`, `slugToLabel()`. Always import with version: `import { ... } from '/config/categories.js?v=YYYYMMDD-N'` and bump `?v=` across all HTML files on any change.
- **i18n**: `config/i18n.js` loads `config/translations/en.json` and `config/translations/es.json`. Language stored in `localStorage` as `fanspedia_lang`. Translation files also use `?v=` busting.
- **Infinite scroll**: `currentPage`, `isLoading`, `hasMore` + "Load More" button (not IntersectionObserver).
- **Images**: proxied via `images.weserv.nl`. First card: `loading="eager" fetchpriority="high"`. Others: `loading="lazy"`. Cards are always rendered inside a `<div class="card-img-wrap">` wrapper (see Card CSS below).
- **Favorites/Wishlist**: stored in LocalStorage; UI uses event delegation.

## Card CSS Pattern (CLS-safe)
All creator cards use an aspect-ratio wrapper instead of fixed pixel heights:
```css
/* Skeleton shimmer container — proportional, no fixed-px height */
.card-img-wrap { aspect-ratio: 3/4; overflow: hidden; border-radius: 20px 20px 0 0;
  background: linear-gradient(90deg, #e8e8e8 25%, #f0f0f0 50%, #e8e8e8 75%);
  background-size: 200% 100%; animation: shimmer 1.5s infinite; }
[data-theme="dark"] .card-img-wrap { background: linear-gradient(90deg, #2a2a3e 25%, #323246 50%, #2a2a3e 75%); }
.card img { border-radius: 0; object-fit: cover; width: 100%; height: 100%; display: block; }
```
- **SSR cards** (`renderCard()` in all `api/ssr/*.js` handlers): `<img>` is already wrapped in `<div class="card-img-wrap">`.
- **Client-side cards** (JS template literals in HTML files): also wrap `<img>` in `<div class="card-img-wrap">`. The `onload` depth for the blank-image removal check is `this.parentElement.parentElement.parentElement.remove()` (img → wrap → card → col).
- Mobile override if needed: `@media (max-width: 400px) { .card-img-wrap { aspect-ratio: 4/5; } }`

## SSR (Server-Side Rendering)
Six SSR handlers in `api/ssr/`: `home.js`, `category.js`, `country.js` and their Spanish mirrors `es-home.js`, `es-category.js`, `es-country.js`. All follow the same pattern:
1. Fetch creators from Supabase
2. Read the target HTML file with `readFileSync` (bundled via `vercel.json` `"includeFiles"`)
3. Inject JSON-LD structured data + pre-rendered cards + LCP preload link + hydration flag
4. Return with `Cache-Control: public, s-maxage=300, stale-while-revalidate=60`
5. On any error: 302 fallback to the static HTML file

**Shared renderCard pattern** (identical across all 6 handlers):
- Images proxied through `buildResponsiveSources(url)` → `{ src, srcset, sizes }` using `images.weserv.nl`
- First card (`index === 0`): `loading="eager" fetchpriority="high"`. Others: `loading="lazy"`
- Card HTML structure:
  ```html
  <div class="col-sm-6 col-md-4 col-lg-3 mb-4">
    <div class="card h-100">
      <button class="favorite-btn" ...>♡</button>
      <div class="card-img-wrap">
        <img src="..." srcset="..." sizes="..." loading="..." fetchpriority="..." decoding="async" referrerpolicy="no-referrer" onerror="...">
      </div>
      <div class="card-body">...</div>
    </div>
  </div>
  ```

**LCP preload injection** — each handler injects into `<head>` before the first card's image loads:
```javascript
const _lcpImg = creators[0]?.avatar || '';
const preloadLink = _lcpImg.startsWith('http')
  ? (() => { const { src, srcset, sizes } = buildResponsiveSources(_lcpImg);
      return `<link rel="preload" as="image" fetchpriority="high" href="${src}" imagesrcset="${srcset}" imagesizes="${sizes}">`; })()
  : '';
// injected: html.replace('</head>', `${preloadLink}\n${jsonLd}\n${ssrFlag}\n</head>`)
```

**Hydration skip flags** — client JS checks for these before running its own initial fetch:
- `window.__HOME_SSR` (home pages)
- `window.__CATEGORY_SSR = { slug, count, hasMore }` (category pages)
- `window.__COUNTRY_SSR = { name, count, hasMore }` (country pages)

**`api/ssr/category.js`** — handles `/categories/:slug`:
1. Resolves slug → search terms via `synonymsMap` / `compoundCategories` from `config/categories.js`
2. Fetches top 50 creators (OR across `username,name,about,location`)
3. Injects `<title>`, `<meta>`, canonical, JSON-LD (BreadcrumbList + ItemList), pre-rendered cards
4. `"includeFiles": "category.html"` in `vercel.json`

**`api/ssr/country.js`** — handles `/country/:name`:
1. Looks up slug in the `COUNTRIES` config map (`terms`, `label`, `htmlFile`, `h1`, `metaDesc`)
2. Fetches top 50 creators (OR across `username,name,about,location` using country `terms`)
3. Reads the country-specific HTML file; `"includeFiles": "*.html"` bundles all root HTML files automatically
4. Injects canonical, JSON-LD (BreadcrumbList + ItemList), pre-rendered cards, `window.__COUNTRY_SSR`

**ES mirrors** (`es-country.js`, `es-category.js`, `es-home.js`): identical logic but read from `es/*.html` and inject Spanish meta/structured data. `"includeFiles": "es/*.html"` covers all Spanish pages automatically.

---

## Adding a New Country Page

> **Verified against Argentina (Mar 2026). Follow ALL steps — missing any one causes a 404.**
> See `.github/CHECKLISTS.md` for the full checkbox-style version.

**9 files to touch:** `{country}.html`, `api/ssr/country.js`, `api/ssr/es-country.js`, `vercel.json` (3 places!), `scripts/build-sitemaps.cjs` (2 places), `scripts/build-spanish-pages.cjs` (2 places), `locations.html`, `es/locations.html`.

### 1. Create `{country}.html`
Copy `canada.html` → `{country}.html`. Update title, meta description, canonical, h1, hreflang, `countryTermsArr`, and `window.__COUNTRY_SSR` fetch fallback URL.

### 2. Add to `api/ssr/country.js` COUNTRIES map
```javascript
{country}: {
  terms: ['{country}', '{adjective}'],
  label: '{Label}',
  htmlFile: '{country}.html',
  h1: 'The Best OnlyFans Creators From {Label}',
  metaDesc: 'Discover the most popular OnlyFans creators from {Label}...',
},
```
`"includeFiles": "*.html"` in `vercel.json` already bundles all root HTML — no extra config needed there.

### 3. Add to `api/ssr/es-country.js` COUNTRIES map
Same shape, but `htmlFile: 'es/{country}.html'` and Spanish `h1`/`metaDesc`/`titleEs`.

### 4. `vercel.json` — ⚠️ THREE separate places

**4a. `"rewrites"` — English** (near the other `/country/` rewrites):
```json
{ "source": "/country/{country}",  "destination": "/api/ssr/country?name={country}" },
{ "source": "/country/{country}/", "destination": "/api/ssr/country?name={country}" },
```

**4b. `"rewrites"` — Spanish** (near the other `/es/country/` rewrites):
```json
{ "source": "/es/country/{country}",  "destination": "/api/ssr/es-country?name={country}" },
{ "source": "/es/country/{country}/", "destination": "/api/ssr/es-country?name={country}" },
```

**4c. `"redirects"` — trailing-slash canonical 301** (near the other `/country/` redirects):
```json
{ "source": "/country/{country}", "destination": "/country/{country}/", "statusCode": 301 },
```

**4d. `"redirects"` — `.html` cleanup** (near the other `.html` redirects):
```json
{ "source": "/{country}.html",    "destination": "/country/{country}/",    "statusCode": 301 },
{ "source": "/es/{country}.html", "destination": "/es/country/{country}/", "statusCode": 301 },
```

> ⚠️ **Argentina 404 (Mar 2026):** Steps 4a and 4c were missed while 4b was added. The EN page was unreachable until hotfixed. Always add all four sub-steps.

### 5. `scripts/build-sitemaps.cjs` — 2 places
Add `'{country}'` to the countries array inside *both* `buildBaseSitemap()` and `buildSpanishBaseSitemap()`.

### 6. `scripts/build-spanish-pages.cjs` — 2 places
- Add `'{country}.html'` to the `COUNTRY_PAGES` array
- Add `else if (result.includes('{country}.html')) pageName = '{country}.html';` to the pageName detection block

### 7. `locations.html` — make the country chip a link
Find the entry in the JS `countries` array and add `url`:
```javascript
{ code: 'XX', name: '{Label}', url: '/country/{country}/' },
```
Also add `<li><a href="/country/{country}">{Label}</a></li>` to the footer "Countries" column.

### 8. `es/locations.html` — same as step 7
Add `url: '/es/country/{country}/'` to its countries array entry and patch footer if needed.

### 9. Run build scripts + verify + push
```powershell
node scripts/build-sitemaps.cjs
node scripts/build-spanish-pages.cjs
npm start
curl http://127.0.0.1:3000/country/{country}/
# Check: SSR cards, window.__COUNTRY_SSR, JSON-LD in source
git add -A
git commit -m "Add /country/{country} with SSR, ES mirror, sitemaps, redirects"
git push
```
**Post-deploy checks:** `/country/{country}/` → 200, `/country/{country}` → 301, `/es/country/{country}/` → 200, chip on `/locations/` is linked.

---

## Adding a New Category

Categories are **data-only** — no new HTML file needed. The single `category.html` + `api/ssr/category.js` handles all slugs dynamically.

### 1. Edit `config/categories.js`
Add to the appropriate export (`categories`, `popularCategories`, or `compoundCategories`):
```javascript
// Simple category:
{ label: 'Curvy', slug: 'curvy', terms: ['curvy', 'thick', 'bbw'] }

// Compound category with price filter:
{ label: 'Free Curvy', slug: 'free-curvy', terms: ['curvy', 'thick', 'bbw'], maxPrice: 0 }

// Synonym mapping (searches all terms when slug is matched):
synonymsMap['curvy'] = ['curvy', 'thick', 'bbw', 'plus size']
```

### 2. Bump the `?v=` import version
In **every** HTML file that imports `categories.js`, increment the version:
```html
<!-- Before -->
<script type="module" src="/config/categories.js?v=20260101-1"></script>
<!-- After -->
<script type="module" src="/config/categories.js?v=20260301-1"></script>
```
Files to update: `index.html`, `categories.html`, `category.html`, `blog.html`, and any others that import it.

### 3. Translations (optional)
If the category label needs a Spanish translation, add it to `config/translations/es.json` and bump the `?v=` on `i18n.js` imports too.

### 4. Rebuild sitemaps and Spanish pages
```powershell
npm run build:sitemaps   # adds /categories/curvy to the sitemap
npm run build:spanish    # propagates the ?v= bump to es/ pages
```

### 5. Verify locally
```powershell
npm start
curl http://127.0.0.1:3000/categories/curvy
```
Check: SSR renders cards matching the new terms, `__CATEGORY_SSR` is in HTML source.

---

## Adding Rich SEO Content to a Category Page

By default all category pages show a generic "About this category" paragraph + FAQ (injected by `category.html` client JS). To replace that with a custom long-form article for a specific slug, add a `build<Slug>SeoContent()` function in `api/ssr/category.js` and call it conditionally in step 7 of the handler.

### Pattern (verified for `/categories/best/` — Apr 2026)

**1. Add a builder function** above `export default` in `api/ssr/category.js`:
```javascript
function buildBestSeoContent() {
  const p  = (txt) => `<p style="color:var(--text-primary);font-size:16px;line-height:1.7;margin-bottom:16px;">${txt}</p>`;
  const h2 = (txt) => `<h2 style="color:#00AFF0;font-weight:600;font-size:22px;margin-bottom:15px;margin-top:30px;">${txt}</h2>`;
  const h3 = (txt) => `<h3 style="color:#00AFF0;font-weight:600;font-size:20px;margin-bottom:12px;margin-top:24px;">${txt}</h3>`;
  const a  = (href, txt) => `<a href="${href}" style="color:#00AFF0;">${txt}</a>`;
  return `
<h2 id="seoH2" ...>Page headline</h2>
<p id="seoP1" ...>Intro paragraph...</p>
${h2('Section heading')} ${p('Body text...')}
...
<div id="faq" style="display:none;"></div>`;   // ← keep this hidden div at the end
}
```
> The hidden `<div id="faq">` is required — it keeps the client JS from erroring when it looks up that element.

**2. Call it in the handler** (step 7, just before the `// --- 6. Send ---` comment):
```javascript
// --- 7. Category-specific SEO content ---
if (slug === 'your-slug') {
  html = html.replace(
    /<h2 id="seoH2"[^>]*>About this category<\/h2>[\s\S]*?<div id="faq"[^>]*><\/div>/,
    buildYourSlugSeoContent()
  );
}
```
> Use a regex (not a plain string) — `category.html` uses CRLF line endings on Windows and plain-string `.replace()` will silently fail.

**3. Naming convention** — name the function `build<PascalCaseSlug>SeoContent()`:
- `best` → `buildBestSeoContent()`
- `free` → `buildFreeSeoContent()`
- `fitness` → `buildFitnessSeoContent()`

**4. Inline style rules** to keep consistent with the rest of the site:
| Element | Style |
|---------|-------|
| `<h2>` main headline | `color:#00AFF0; font-weight:700; font-size:26px; margin-bottom:16px;` |
| `<h2>` sub-sections | `color:#00AFF0; font-weight:600; font-size:22px; margin-bottom:15px; margin-top:30px;` |
| `<h3>` | `color:#00AFF0; font-weight:600; font-size:20px; margin-bottom:12px; margin-top:24px;` |
| `<p>` | `color:var(--text-primary); font-size:16px; line-height:1.7; margin-bottom:16px;` |
| `<ul>` | `color:var(--text-primary); font-size:16px; line-height:1.8; margin-bottom:20px;` |
| `<a>` | `color:#00AFF0;` |

**5. Local test** before committing:
```powershell
npm start
# Then in another terminal:
Invoke-WebRequest http://127.0.0.1:3000/categories/best/ -UseBasicParsing | Select -Expand Content | Select-String 'Your headline'
```
Confirm old "About this category" text is gone and new content appears.

**Currently implemented slug-specific pages:**
| Slug | Function | Added |
|------|----------|-------|
| `best` | `buildBestSeoContent()` | Apr 2026 |

---

## API (`api/`)
- `search.js` — Supabase REST proxy, 60s in-memory Map cache keyed by full URL. Returns camelCase (`isVerified`, `subscribePrice`) mapped from lowercase DB columns.
- **Search**: splits `q` by `|` or `,`; defaults to OR across `username,name,about,location`. Caller can override with `?fields=username,name`. Supports `?verified=`, `?bundles=true`, `?price=`, `?location=`, `?page=`, `?page_size=`.
- `blog.js` / `blog-post.js` — reads `content/blog/*.md` with YAML frontmatter via `parseFrontmatter()`.
- `categories.js`, `img.js`, `reel.js`, `wishlist.js`, `health.js`, `dot/[username].js`.
- Supabase: raw `fetch()` only — **no `@supabase/supabase-js`**. Headers: `apikey`, `Authorization: Bearer <SUPABASE_KEY>`, `Accept-Profile: public`, `Prefer: count=exact`. Use **service role** key.

## Database
- Table `onlyfans_profiles`: lowercase columns — `id,username,name,about,location,avatar,header,isverified,subscribeprice,favoritedcount,subscriberscount,postscount,photoscount,videoscount`, plus bundle/promo price columns.
- `category.html` uses `compoundCategories` (with max price filters) and `synonymsMap` for broader term matching.

## Workflows
```powershell
npm start                        # local dev → http://127.0.0.1:3000
npm run build:sitemaps           # regenerate all sitemaps
npm run sitemap                  # single sitemap
npm run build:spanish            # regenerate /es/* pages from English sources
```
- After any category edit: bump `?v=` in all HTML imports **and** run `npm run build:sitemaps` and `npm run build:spanish`.
- After any EN HTML page edit that affects card layout or scripts: run `npm run build:spanish` to propagate to `es/`.
- Deploy: user will explicitly say "push" or "deploy". Until then, commit locally only.

## Guardrails
- Never hardcode categories in HTML — always import from `config/categories.js` and bump `?v=`.
- All DB column references must be **lowercase** (PostgREST is case-sensitive).
- Always wrap creator card `<img>` in `<div class="card-img-wrap">` — never use fixed `height` on `.card img`.
- Non-critical scripts (`i18n.js`, `wishlist-badge.js`, `mermaid.js`) must have `defer` attribute.
- Do not re-enable creator profile pages without explicit decision.
- Do not commit `.env`, `cookies.json`, `*.csv`, `failed_batch.json`, `failed_ids_v2.json`, `progress_urls.json`.
- **Every new HTML page MUST include the GA4 analytics tag** immediately after `<meta name="viewport" ...>`. GA4 Measurement ID: `G-3XB30HS12L`. Required snippet:
  ```html
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-3XB30HS12L"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-3XB30HS12L');
  </script>
  ```
