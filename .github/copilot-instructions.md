# FansPedia — Copilot Instructions

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
- **Images**: proxied via `images.weserv.nl`. First card: `loading="eager" fetchpriority="high"`. Others: `loading="lazy"`.
- **Favorites/Wishlist**: stored in LocalStorage; UI uses event delegation.

## SSR (Server-Side Rendering)
Two SSR handlers in `api/ssr/` — both follow the same pattern: read static HTML template, inject structured data + pre-rendered cards + hydration flag, return with 5-min CDN cache.

**`api/ssr/category.js`** — handles `/categories/:slug`:
1. Resolves slug → search terms via `synonymsMap` / `compoundCategories` from `config/categories.js`
2. Fetches top 50 creators from Supabase (OR across `username,name,about,location`)
3. Reads `category.html` as a string template (`"includeFiles": "category.html"` in `vercel.json`)
4. Injects `<title>`, `<meta>`, canonical, JSON-LD (BreadcrumbList + ItemList), pre-rendered cards
5. Sets `window.__CATEGORY_SSR = { slug, count, hasMore }` so `category.html` JS skips its initial fetch

**`api/ssr/country.js`** — handles `/country/:name` (united-states | canada | india | japan):
1. Looks up slug in COUNTRIES config map (terms, label, htmlFile)
2. Fetches top 50 creators via OR across `username,name,about,location` using country-specific terms
3. Reads the specific country HTML file (`"includeFiles": "{united-states,canada,india,japan}.html"` in `vercel.json`)
4. Injects canonical, JSON-LD (BreadcrumbList + ItemList), pre-rendered cards
5. Sets `window.__COUNTRY_SSR = { name, count, hasMore }` so country HTML JS skips its initial fetch
- **Both handlers**: `Cache-Control: public, s-maxage=300, stale-while-revalidate=60`. On any error: 302 fallback to the static HTML file.
- **To add a new country**: add entry to COUNTRIES map in `api/ssr/country.js`, create HTML file, add routes in `vercel.json` and `server.js`, patch HTML with hydration skip.

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
- After any category edit: bump `?v=` in all HTML imports **and** run `npm run build:sitemaps`.
- Deploy: push to `main` → Vercel auto-deploys. Env vars in Vercel: `SUPABASE_URL`, `SUPABASE_KEY` (service role).

## Guardrails
- Never hardcode categories in HTML — always import from `config/categories.js` and bump `?v=`.
- All DB column references must be **lowercase** (PostgREST is case-sensitive).
- Do not re-enable creator profile pages without explicit decision.
- Do not commit `.env`, `cookies.json`, `*.csv`, `failed_batch.json`, `failed_ids_v2.json`, `progress_urls.json`.
