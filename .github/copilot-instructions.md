# FansPedia - Copilot Instructions

## IMPORTANT: New Tech Stack
The site has been **fully migrated to Next.js 16 + React 19 + TypeScript**. All code lives in `src/`. The old vanilla HTML files in the root directory, `api/` (Vercel serverless), `server.js`, `es/`, and `scripts/` are **legacy/dead - do not touch them**. Always work in `src/`.

## Development Workflow
- **Always test changes locally before pushing.** After making any changes, start the dev server (`npm run dev` -> `http://localhost:3000`) and verify the affected pages work correctly.
- **Never run `git push` unless the user explicitly says to push.** Wait for the user to say "push" or "deploy" before pushing to `main`.
- Commit locally with `git commit` after verifying, but hold the push until instructed.

## Big Picture
- **Next.js 16 + React 19 + TypeScript** frontend, deployed on Vercel. Domain: `fanspedia.net`.
- All application code lives in `src/`. Never edit the legacy root-level `.html` files, `api/` (old Vercel serverless), `server.js`, `es/`, or `scripts/`.
- Creator profile pages are **intentionally disabled** - cards link directly to `https://onlyfans.com/{username}`. Do not re-enable without discussion.
- Blog content lives in `content/blog/` as Markdown with YAML frontmatter; rendered via `next-mdx-remote`.

## Project Structure
```
src/
  app/                        # Next.js App Router
    page.tsx                  # Home (/)
    layout.tsx                # Root layout - Nav, Footer, AgeGate, GA4
    globals.css               # All CSS (dark theme, CSS custom properties)
    not-found.tsx
    robots.ts / sitemap.ts
    categories/
      page.tsx                # /categories/
      [slug]/page.tsx         # /categories/[slug]/
    country/
      [slug]/page.tsx         # /country/[slug]/
    blog/
      page.tsx                # /blog/
      [slug]/page.tsx         # /blog/[slug]/
    search/page.tsx           # /search?q=...
    locations/page.tsx        # /locations/
    about/ contact/ dmca/ privacy/
    api/search/route.ts       # GET /api/search - proxies Supabase
  components/
    Nav.tsx                   # Header + mobile drawer + dropdowns ('use client')
    Footer.tsx
    CreatorCard.tsx           # Single creator card (next/image)
    CreatorGrid.tsx           # Paginated grid with Load More ('use client')
    CreatorGridSkeleton.tsx   # Shimmer placeholder
    HomeSearch.tsx            # Hero search bar ('use client')
    AgeGate.tsx               # Age verification gate ('use client')
    FAQ.tsx                   # FAQ accordion
  config/
    categories.ts             # All category data (TypeScript)
    countries.ts              # All country data (TypeScript)
  lib/
    supabase.ts               # fetchCreators() - raw fetch, no supabase-js
    image.ts                  # proxyImg(), buildSrcset() via images.weserv.nl
  types/
    creator.ts                # Creator interface
```

## Pages & Routing (App Router)
- `/` -> `src/app/page.tsx` - ISR revalidate 300s
- `/categories/[slug]/` -> `src/app/categories/[slug]/page.tsx` - static + ISR 300s
- `/country/[slug]/` -> `src/app/country/[slug]/page.tsx` - static + ISR 300s
- `/blog/[slug]/` -> `src/app/blog/[slug]/page.tsx`
- `/search?q=` -> `src/app/search/page.tsx` (client-side)
- `/api/search` -> `src/app/api/search/route.ts` - Node.js runtime, rate-limited

**Static generation:** All category and country pages run `generateStaticParams()` to pre-render at build time. `staticGenerationMaxConcurrency: 1` in `next.config.ts` prevents Supabase timeouts during build.

**Self-healing skeleton:** If a page builds empty (Supabase 500 during build), `CreatorGrid` auto-fetches on mount. ISR ensures the page is refreshed within 5 min.

**Local dev:** `npm run dev` -> `http://localhost:3000`

## Data Fetching
All Supabase queries go through `src/lib/supabase.ts`:
```typescript
import { fetchCreators } from '@/lib/supabase';
const { creators, total, hasMore } = await fetchCreators({
  categoryTerms: ['curvy', 'thick'],  // full-text search on search_text column
  locationTerms: ['argentina'],       // use with skipLocationFilter: true
  maxPrice: 0,                        // free only
  sort: 'popular',                    // popular | new | price_asc | price_desc
  page: 0,
  pageSize: 24,
  revalidate: 300,                    // Next.js fetch cache TTL (build-time)
  maxRetries: 2,                      // use 2 at runtime, 5 at build time
});
```
- Raw `fetch()` only - **no `@supabase/supabase-js`**
- Headers: `apikey`, `Authorization: Bearer <SUPABASE_KEY>`, `Prefer: count=exact`
- Only selects columns that `CreatorCard` needs: `id,username,name,avatar,avatar_c144,isverified,subscribeprice`

## Database
- Table `onlyfans_profiles`: lowercase columns - `id,username,name,about,location,avatar,avatar_c144,header,isverified,subscribeprice,favoritedcount,search_text`
- All column references must be **lowercase** (PostgREST is case-sensitive)
- Full-text search uses the `search_text` column (has trigram index - much faster than LIKE on individual columns)

## Config Files
**`src/config/categories.ts`** - single source of truth for all categories:
- `categories`, `popularCategories` - `CategoryConfig[]` (slug, label, terms, maxPrice?, popular?)
- `synonymOverrides` - maps slug -> extra search terms
- `getCategoryBySlug(slug)`, `ALL_CATEGORY_SLUGS`
- Do NOT import from the legacy `config/categories.js` in root

**`src/config/countries.ts`** - single source of truth for all countries:
- `COUNTRIES` record (slug -> `CountryConfig` with terms, label, h1, metaDesc)
- `COUNTRIES_LIST` - sorted array
- `getCountry(slug)`, `ALL_COUNTRY_SLUGS`

## CSS & Theming
- All styles in `src/app/globals.css` - dark-only theme (no light mode toggle)
- CSS custom properties: `--bg`, `--surface`, `--accent` (`#00AFF0`), `--text`, `--text-muted`, `--border`, `--radius`, `--card-radius`
- No Tailwind utility classes in components - use CSS modules or inline style with CSS vars

## Components

**`CreatorCard`** - renders a single creator:
- Uses `next/image` with `fill` + `buildSrcset()` from `src/lib/image.ts`
- First 4 cards: `loading="eager" fetchPriority="high"`. Others: `loading="lazy"`
- Card links directly to `https://onlyfans.com/{username}` (profiles disabled)
- `.card-img-wrap` has `aspect-ratio: 3/4` in CSS - never use fixed height

**`CreatorGrid`** - `'use client'` paginated grid:
- Accepts `initialCreators`, `initialHasMore`, `initialTotal` from server component
- "Load More" button fetches `/api/search` with page counter
- Self-heals empty builds by fetching page 0 on mount

**`Nav`** - `'use client'`: desktop search bar, Countries dropdown, Categories dropdown, mobile hamburger drawer

## Adding a New Country Page

### 1. Add to `src/config/countries.ts` COUNTRIES map
```typescript
'{slug}': {
  slug: '{slug}',
  terms: ['{country}', '{adjective}'],
  label: '{Label}',
  h1: 'The Best OnlyFans Creators From {Label}',
  metaDesc: 'Discover the most popular OnlyFans creators from {Label}...',
},
```
That is all - `src/app/country/[slug]/page.tsx` handles all slugs dynamically via `generateStaticParams()`.

### 2. Verify locally
```powershell
npm run dev
# visit http://localhost:3000/country/{slug}/
```
Check: creators load, metadata correct, no 404.

---

## Adding a New Category

### 1. Edit `src/config/categories.ts`
Add to `categories` or `popularCategories`:
```typescript
{ slug: 'curvy', label: 'Curvy', terms: ['curvy', 'thick', 'bbw'], popular: true }
```
Add synonym overrides if needed:
```typescript
synonymOverrides['curvy'] = ['curvy', 'thick', 'bbw', 'plus size'];
```
That is all - `src/app/categories/[slug]/page.tsx` handles all slugs dynamically.

### 2. Verify locally
```powershell
npm run dev
# visit http://localhost:3000/categories/curvy/
```

---

## Featured Placements: Pinning, Excluding & Sponsored Creators

Paid placements and removals are **config-driven** from a single file: `src/config/featured.ts`. This is the ONLY file to edit to pin, position, or remove a creator from any grid. No page/component code changes are needed.

### How it works
- `FEATURED: Record<string, FeaturedRule>` maps a **scope** to its rules.
- Scopes:
  - `'home'` — homepage Top Creators grid
  - `'category:<slug>'` — e.g. `'category:bbw'` (built via `categoryScope(slug)`)
  - `'country:<slug>'` — e.g. `'country:argentina'` (built via `countryScope(slug)`)
- A `FeaturedRule` has two optional arrays:
  - `pinned: { username, position }[]` — places a creator at an **exact 1-based GLOBAL position** across the whole paginated list (position 1-24 = page 1, 25-48 = page 2, etc.). Pinned creators are auto-fetched even if they don't naturally rank onto that page.
  - `excluded: string[]` — usernames hidden from the page entirely.
- Username matching is **case-insensitive**. Use the exact OnlyFans username (the `username` column), e.g. `miss-meringue`.
- `fetchFeaturedPage(scope, baseParams, page, pageSize)` is the orchestrator. It fetches the right natural slice with DB-level `not.in` exclusion (so the grid still shows a full 24 cards and pins never appear twice), injects pinned creators at their positions, and marks each pinned creator with `sponsored: true`.
- The `scope` is threaded through `/api/search`, so pins/exclusions also apply to **"Load More"**, not just the first page.

### Sponsored / "Ad" treatment
- Every **pinned** creator is automatically flagged `sponsored: true` (set in `fetchFeaturedPage`).
- `CreatorCard` renders an `AD · Sponsored` pill (`.card-sponsored`) and a highlighted accent border (`.creator-card-sponsored`) when `creator.sponsored` is true. Styles live in `src/app/globals.css`.
- This is a legal/ethical disclosure — pinned = paid placement = always labelled. Do not pin a creator without the sponsored label.
- `excluded` creators are NOT sponsored; they're just hidden.

### To pin (add) a paying creator
Edit `src/config/featured.ts` and add an entry under the right scope:
```typescript
export const FEATURED: Record<string, FeaturedRule> = {
  home: {
    pinned: [
      { username: 'miss-meringue', position: 1 },   // first card on homepage
      { username: 'newcustomer',   position: 2 },   // second card
    ],
    excluded: ['shaylust'],
  },
  'category:bbw': {
    pinned: [{ username: 'somecreator', position: 1 }],
  },
  'country:argentina': {
    pinned: [
      { username: 'a', position: 1 },
      { username: 'b', position: 25 },  // first card on page 2
    ],
  },
};
```
Rules: positions should be unique per scope; if a pinned username doesn't exist in the DB, that slot falls back to the next natural creator.

### To remove (hide) a creator
Add the username to the `excluded` array for that scope (create the scope entry if it doesn't exist):
```typescript
home: { excluded: ['shaylust', 'unwanteduser'] },
```

### Verify, then push live
1. Make sure the dev server is up on **port 3001** (port 3000 is reserved): `npm run dev -- -p 3001`.
2. Quick API check (no browser needed) — confirms position + sponsored flag:
   ```powershell
   $r = Invoke-WebRequest -Uri "http://localhost:3001/api/search?scope=home&page=0&page_size=24&sort=popular" -UseBasicParsing
   $c = ($r.Content | ConvertFrom-Json).creators
   "pos1: $($c[0].username) | sponsored: $($c[0].sponsored)"
   ```
   For category/country use `?scope=category:bbw` or `?scope=country:argentina`.
3. Visit the page(s) in the browser to eyeball the highlight + `AD · Sponsored` badge.
4. Commit locally: `git commit -am "feat: pin <creator> on <scope>"`.
5. **Push only when the user explicitly says "push"/"deploy"** — then `git push` to `main` (Vercel auto-deploys to fanspedia.net).

### Files involved (reference, usually no need to touch)
- `src/config/featured.ts` — the config + `fetchFeaturedPage` orchestrator (**edit here**).
- `src/lib/supabase.ts` — `fetchCreators` supports `excludeUsernames` + `offset`; `fetchCreatorsByUsernames` pulls pinned creators by name.
- `src/types/creator.ts` — `sponsored?: boolean` flag.
- `src/components/CreatorCard.tsx` — renders the sponsored badge + highlight.
- `src/app/globals.css` — `.creator-card-sponsored` and `.card-sponsored` styles.
- `src/app/page.tsx`, `src/app/categories/[slug]/page.tsx`, `src/app/country/[slug]/page.tsx`, `src/app/api/search/route.ts` — already wired to call `fetchFeaturedPage` and pass `scope`.

## GA4 Analytics
Handled globally in `src/app/layout.tsx` via `<GoogleAnalytics gaId="G-3XB30HS12L" />` from `@next/third-parties/google`. No need to add GA tags to individual pages.

## Guardrails
- Always work in `src/` - never edit root HTML files, `api/`, `server.js`, `es/`, or `scripts/`
- All DB column references must be **lowercase**
- Never use fixed `height` on `.card img` - use `aspect-ratio` on `.card-img-wrap`
- Do not re-enable creator profile pages without explicit decision
- Do not commit `.env`, `cookies.json`, `*.csv`, `failed_batch.json`, `failed_ids_v2.json`, `progress_urls.json`
- Creator cards always link to `https://onlyfans.com/{username}` - no internal profile pages
- Pin/exclude creators ONLY via `src/config/featured.ts` (never hardcode in pages); every pinned creator MUST keep the `AD · Sponsored` label (disclosure)