# SEO‑First, Simple Workflow

Goal: Always choose the least complex, most reliable, SEO‑friendly path. Favor static HTML + tiny JS over new APIs, SSR, or complex routing.

## Core Principles
- Simple-first: If it can be done in static HTML/JS, do that.
- SEO-first: Real content in HTML, proper titles/meta/canonicals, clean URLs.
- One source of truth: Categories live only in `config/categories.js` with version param bump.
- Minimal surface: Avoid adding new API routes unless absolutely necessary.
- Reuse patterns: Copy from existing pages (header, sticky nav, image patterns) for consistency.
- Safe rollbacks: Every change includes a quick revert path.

## Decision Tree (pick the easiest viable box)
1) Need UI change on an existing page?
- Edit the HTML file directly → small inline CSS/JS → reuse patterns from PATTERNS.md
- Avoid framework-like refactors; no build step.

2) Need a new page/route for static content?
- Create a new `.html` page → add minimal JS → add rewrite in `vercel.json` if you want a clean path (e.g., `/categories/:slug` → `/category.html`).
- Prefer static page + rewrite over new serverless functions.

3) Need data from DB for list/search?
- Use the existing `/api/search` only; don’t add new endpoints unless the query truly can’t be expressed.
- Keep params limited to documented filters; keep caching as-is.

4) Need user state (favorites/wishlist)?
- Use `localStorage` and keep it client-side. No server state or new DB tables.

5) Unsure? Pick the static, reversible route, then iterate.

## Default Steps For Any Change
1) Define scope in one sentence. Example: “Add sticky bottom nav to /categories and /category.”
2) Choose the simplest path from the Decision Tree.
3) Implement minimally:
- HTML: add markup near the end of `<body>`.
- CSS: inline a small `<style>` block next to the feature.
- JS: tiny `<script>` that only wires needed events. Reuse existing IDs/classes.
4) Local test:
- `npm start` → open page → verify behavior + no console errors.
- Basic SEO: unique `<title>`, `<meta description>`, proper `<link rel="canonical">`.
5) Commit → Push → Verify production.
6) If anything looks off: Revert the single commit, then reassess.

## SEO Checklist (quick)
- Title: Unique, descriptive, includes brand (FansPedia).
- Meta description: 120–160 chars, real sentence.
- Canonical: Points to the intended URL (no duplicates).
- H1: One clear H1 per page.
- Links: Clean, descriptive anchors; avoid hash-only if it’s an actual page.
- Images: `alt` where applicable; responsive srcset pattern if needed.
- Sitemaps: Run `npm run build:sitemaps` when categories change.

## UX Checklist (quick)
- Mobile first: Works at 360px wide; no clipped UI.
- Interaction: Buttons/links obvious; tap targets at least ~44px.
- Performance: Keep JS small; reuse CDNs already in use.
- Consistency: Reuse header, sticky nav, and card patterns.

## Deployment + Rollback
- Push to `main` triggers Vercel deploy.
- Verify: open the updated page + a category route + homepage.
- Rollback: Promote previous deployment in Vercel or `git revert <commit>`.

## Examples: Choose Easy Paths
- Wishlist page: Prefer a client-only section (anchor or modal) that reads `localStorage` and renders a list. Do not create `/wishlist` server route.
- New category: Edit `config/categories.js` → bump `?v=` in all HTML imports → rebuild sitemaps → push.
- Sticky UI: Paste the homepage’s sticky nav block into other pages for exact parity.

## Anti‑Patterns To Avoid
- Adding new serverless functions for purely presentational needs.
- Building new complex routing trees for small UI changes.
- Introducing a build step or a frontend framework.
- Duplicating category lists in HTML (always import from config).
