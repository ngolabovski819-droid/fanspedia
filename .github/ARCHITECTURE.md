# Project Architecture Decisions

## Why No Build Step?

**Decision**: Use vanilla JavaScript with ES6 modules instead of React/Vue/build tools

**Reasoning**:
- **Simplicity**: No webpack, babel, or complex tooling to maintain
- **Fast iteration**: Edit HTML → refresh browser → see changes
- **Vercel compatibility**: Static files deploy instantly without build step
- **Performance**: No framework overhead, ships minimal JavaScript
- **SEO**: Pure HTML renders immediately (no client-side hydration)

**Trade-offs**:
- Manual state management (no React hooks)
- Code duplication across HTML files (solved with ES6 modules)
- No TypeScript (acceptable for this project size)

## Why Direct Supabase REST Instead of Client Library?

**Decision**: Use `fetch()` to call Supabase REST API directly

**Reasoning**:
- **Vercel serverless**: Client library adds 200KB+ to bundle
- **Cold start time**: Direct fetch has zero initialization overhead
- **Control**: Explicit query construction easier to debug
- **Caching**: In-memory Map cache works better with direct calls

**Trade-offs**:
- Manual query building (more verbose)
- No realtime subscriptions (not needed for this use case)
- Must handle auth headers manually

## Why Playwright Instead of Selenium?

**Decision**: Use Playwright for web scraping

**Reasoning**:
- **Modern API**: Async/await native, cleaner than Selenium
- **Network interception**: Can capture API responses directly
- **Auto-wait**: Better handling of dynamic content
- **Headless performance**: Faster, more reliable

**Trade-offs**:
- Steeper learning curve for developers familiar with Selenium
- Requires Node.js runtime (but we already use it)

## Why In-Memory Cache Instead of Redis?

**Decision**: Use JavaScript Map for caching in serverless functions

**Reasoning**:
- **Simplicity**: No external Redis service to maintain
- **Cost**: Free (Redis would cost $10-50/month)
- **Latency**: In-process Map is faster than network call to Redis
- **Vercel limitations**: Serverless functions are stateless anyway

**Trade-offs**:
- Cache resets on cold start (acceptable for 60s TTL)
- No shared cache across function instances (also acceptable)
- Limited to single-server cache (Vercel handles load balancing)

## Why Compound Categories Pattern?

**Decision**: Use `compoundCategories` object to combine search terms with filters

**Reasoning**:
- **UX**: Users want "goth free" as a single category, not two filters
- **SEO**: Dedicated URL like `/categories/goth-free/` ranks better
- **DRY**: Reuse search logic, just apply different filters
- **Flexible**: Easy to add new combinations (bbw-verified, asian-bundles, etc.)

**Example**:
```javascript
'goth-free': {
  searchTerm: 'goth',
  synonyms: ['goth', 'gothic'],
  filters: { maxPrice: 0 },
  displayLabel: 'Goth (Free)'
}
```

## Why Synonyms Map Instead of Full-Text Search?

**Decision**: Pre-compute synonym arrays in `config/categories.js`

**Reasoning**:
- **Performance**: One-time computation at module load, not per-search
- **Control**: Manual curation ensures quality (e.g., "pawg" → "phat ass white girl")
- **Supabase limitations**: PostgreSQL FTS requires additional configuration
- **Multi-term support**: Can search "goth|gothic|alt" with synonyms

**Trade-offs**:
- Manual synonym management (must update when adding categories)
- No fuzzy matching (e.g., "goths" won't match "goth" without explicit synonym)

## Why localStorage for Favorites Instead of Database?

**Decision**: Store user favorites in browser localStorage

**Reasoning**:
- **Privacy**: No user accounts, no tracking, no GDPR concerns
- **Performance**: Instant reads, no API calls
- **Simplicity**: No auth system, no user management
- **Offline**: Works without internet connection

**Trade-offs**:
- Lost if user clears browser data
- Not synced across devices
- Limited to ~5MB per domain

## Why Version Query Params for Cache Busting?

**Decision**: Use `?v=20251107-1` instead of hash-based cache busting

**Reasoning**:
- **Manual control**: Know exactly when to bust cache
- **Date-based**: Easy to see when last updated
- **Increment counter**: Multiple updates same day (v=20251107-1, -2, -3)
- **No build step**: Works with plain HTML imports

**Pattern**:
```html
<script type="module">
  import { categories } from '/config/categories.js?v=20251107-1';
</script>
```

## Why CSV Instead of Direct Database Insert?

**Decision**: Scrapers write to CSV, separate script uploads to Supabase

**Reasoning**:
- **Resilience**: CSV preserves data if upload fails
- **Debugging**: Can inspect CSV before committing to database
- **Batch optimization**: Upload in batches of 200 for better performance
- **Data validation**: Can run verification scripts on CSV first

**Trade-offs**:
- Two-step process (scrape → upload)
- CSV size can get large (mitigated by gzip)

## Why Favorites Bar Instead of Dedicated Page?

**Decision**: Horizontal scrollable bar at top of results

**Reasoning**:
- **Context**: Users see favorites while browsing
- **Quick access**: One click to visit favorited creator
- **Visual feedback**: Immediate confirmation when favoriting
- **No navigation**: Don't leave search results page

**Trade-offs**:
- Limited screen space on mobile
- Can't show many favorites at once (scrollable)

## Why Infinite Scroll with "Load More" Button?

**Decision**: Use button-triggered pagination instead of IntersectionObserver

**Reasoning**:
- **User control**: Explicit action to load more (no surprise scrolling)
- **Performance**: Load on demand, not automatic
- **Accessibility**: Screen readers can interact with button
- **SEO**: Initial page renders with content (no client-side-only data)

**Trade-offs**:
- Extra click required (vs. auto-scroll)
- Slightly more friction in UX

## Why Vercel Instead of Netlify/AWS?

**Decision**: Deploy on Vercel with serverless functions

**Reasoning**:
- **Simplicity**: Zero-config deployment from Git
- **Serverless**: Automatic scaling, no server management
- **Edge network**: Fast global CDN
- **GitHub integration**: Auto-deploy on push to main
- **Free tier**: Generous limits for side projects

**Trade-offs**:
- Vendor lock-in (mitigated by standard Node.js code)
- Cold start latency (acceptable for this use case)
