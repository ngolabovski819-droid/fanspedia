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

## Adding a New Country Page (e.g. Taiwan)

Follow every step in order. Test locally after completing all steps, then commit.

### 1. Create the HTML page
Copy an existing country page (e.g. `canada.html`) to `taiwan.html`. Update:
- `<title>`, `<meta name="description">`, `<link rel="canonical">` to use Taiwan
- `<h1>` and any static heading text
- The `window.__COUNTRY_SSR` hydration skip block near the top of the `<script>` — it already works generically, just ensure the `fetch` fallback URL uses `/country/taiwan`
- The `<link rel="alternate" hreflang="es">` pointing to `/es/country/taiwan`
- Ensure the CSS includes the `.card-img-wrap` pattern (copy from canada.html)
- Ensure `<script src="/utils/wishlist-badge.js?...">` has `defer`

### 2. Add to `api/ssr/country.js` COUNTRIES map
```javascript
taiwan: {
  terms: ['taiwan', 'taiwanese'],
  label: 'Taiwan',
  htmlFile: 'taiwan.html',
  h1: 'The Best OnlyFans Creators All Across Taiwan',
  metaDesc: 'Discover the most popular OnlyFans creators across Taiwan. Browse verified profiles, free accounts, and exclusive content from Taiwanese creators.',
},
```
No other change needed in `country.js` — `"includeFiles": "*.html"` in `vercel.json` already bundles all root HTML files, and the generic `/country/:name` route already handles any slug in the COUNTRIES map.

### 3. Add explicit routes to `vercel.json`
Inside the `"rewrites"` array, add (following the existing pattern):
```json
{ "source": "/country/taiwan",   "destination": "/api/ssr/country?name=taiwan" },
{ "source": "/country/taiwan/",  "destination": "/api/ssr/country?name=taiwan" }
```
The paginated route `/country/:name/:page` already handles all countries generically — no extra entry needed for that.

### 4. Add route to `server.js` (local dev only)
`server.js` uses a generic `/country/:name` Express route that calls `ssrCountryHandler` — **no change needed** as long as the COUNTRIES map in `country.js` is updated.

### 5. Do the same for the ES mirror (`api/ssr/es-country.js`)
Add the same entry to the `COUNTRIES` map in `es-country.js` with Spanish `h1`/`metaDesc`. Create `es/taiwan.html` by running `npm run build:spanish` (it will auto-generate from `taiwan.html`).

### 6. Add `vercel.json` ES routes
```json
{ "source": "/es/country/taiwan",   "destination": "/api/ssr/es-country?name=taiwan" },
{ "source": "/es/country/taiwan/",  "destination": "/api/ssr/es-country?name=taiwan" }
```

### 7. Sitemaps
Run `npm run build:sitemaps` — it picks up all `*.html` files automatically.

### 8. Verify locally
```powershell
npm start
# Then test:
curl http://127.0.0.1:3000/country/taiwan
```
Check: SSR cards render, `__COUNTRY_SSR` is set in the HTML source, JSON-LD is present.

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
