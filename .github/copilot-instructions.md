# FansPedia — Copilot Instructions

Quick links: [PATTERNS.md](./PATTERNS.md) • [CHECKLISTS.md](./CHECKLISTS.md) • [ARCHITECTURE.md](./ARCHITECTURE.md) • [QUICKSTART.md](./QUICKSTART.md) • [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## Big Picture
- Static HTML/vanilla JS frontend + Vercel serverless API + Supabase PostgREST. Production domain: `fanspedia.net`.
- Core pages: search ([index.html](../index.html)), category hub ([categories.html](../categories.html)), category view ([category.html](../category.html)), creator profile ([creator.html](../creator.html)).
- Data flow: frontend hits `/api/search` → [api/search.js](../api/search.js) proxies to Supabase REST and maps snake_case to camelCase for the UI.

## Frontend Conventions
- Categories are single source of truth in [config/categories.js](../config/categories.js): `categories`, `popularCategories`, `compoundCategories`, `synonymsMap`.
- Cache busting is required: import `config/categories.js` with `?v=YYYYMMDD-N` and bump across all HTML files on any category change.
- Infinite scroll uses `currentPage`, `isLoading`, `hasMore` and a “Load More” button (not IntersectionObserver).
- Images: first card uses `loading="eager" fetchpriority="high"`; others `loading="lazy"`. Follow `buildResponsiveSources()` pattern and `images.weserv.nl` proxy.
- Favorites are stored in LocalStorage; UI uses event delegation (see [creator.html](../creator.html)).

## Backend/API Patterns
- [api/search.js](../api/search.js) builds a Supabase REST query with `select`, `order`, `limit`, `offset` and a 60s in-memory cache keyed by final URL.
- Multi-term `q` is split by `|` or `,` and OR-matched across `username`, `name`, `about` only (do NOT search `location`).
- Supabase headers always include `apikey`, `Authorization: Bearer`, `Accept-Profile`, `Prefer: count=exact`.

## Workflows
- Local dev server: `npm start` (serves API + static files on `http://127.0.0.1:3000`).
- Sitemaps: `npm run build:sitemaps` (full) or `npm run sitemap` (single).
- Creator page entry point: `/creator.html?u=username` (Similar Creators and favorites live here).

## Data/Schema Notes
- Supabase table `onlyfans_profiles` uses lowercase column names; API maps to camelCase for the frontend.
- Category search pages use `compoundCategories` (filters like max price) and `synonymsMap` for broader matching (see [category.html](../category.html)).

## Guardrails
- Never hardcode categories in HTML; always import from [config/categories.js](../config/categories.js) and bump the `?v=` query.
- Do not commit `.env`, `cookies.json`, `*.csv`, or scrape failure logs (`failed_batch.json`, `failed_ids_v2.json`, `progress_urls.json`).
