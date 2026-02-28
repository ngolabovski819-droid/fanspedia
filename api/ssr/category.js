/**
 * SSR handler for /categories/:slug
 *
 * Fetches the top creators for a category from Supabase and returns a fully
 * rendered HTML page so Googlebot sees real content on the first request,
 * matching the structural SEO advantage of frameworks like Next.js.
 *
 * Flow:
 *   1. Resolve slug → search terms via synonymsMap / compoundCategories
 *   2. Fetch top PAGE_SIZE creators from Supabase
 *   3. Read category.html as a string template
 *   4. Inject <title>, <meta>, <link rel="canonical">, JSON-LD, pre-rendered cards
 *   5. Set window.__CATEGORY_SSR so client JS skips the duplicate first fetch
 *   6. Return complete HTML with 5-minute CDN cache
 *
 * On any error the handler falls back to a 302 to /category.html for
 * transparent client-side rendering.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  synonymsMap,
  compoundCategories,
  slugToLabel,
} from '../../config/categories.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATEGORY_HTML = join(__dirname, '..', '..', 'category.html');

const BASE_URL = 'https://fanspedia.net';
const PAGE_SIZE = 50;
const YEAR = new Date().getFullYear();

// ---------------------------------------------------------------------------
// Image helpers (mirrors category.html client-side logic)
// ---------------------------------------------------------------------------
function proxyImg(url, w, h) {
  try {
    if (!url || url.startsWith('/static/')) return url;
    const noScheme = url.replace(/^https?:\/\//, '');
    return `https://images.weserv.nl/?url=${encodeURIComponent(noScheme)}&w=${w}&h=${h}&fit=cover&output=webp`;
  } catch { return url; }
}

function buildResponsiveSources(originalUrl) {
  const widths = [144, 240, 320, 480, 720];
  const srcset = widths
    .map(w => `${proxyImg(originalUrl, w, Math.round(w * 4 / 3))} ${w}w`)
    .join(', ');
  const src = proxyImg(originalUrl, 320, Math.round(320 * 4 / 3));
  const sizes = '(max-width: 480px) 144px, (max-width: 768px) 240px, (max-width: 1200px) 320px, 360px';
  return { src, srcset, sizes };
}

// ---------------------------------------------------------------------------
// String helpers
// ---------------------------------------------------------------------------
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Card renderer
// ---------------------------------------------------------------------------
function renderCard(item, index) {
  const img = item.avatar || item.avatar_c144 || '';
  const imgSrc = img && img.startsWith('http') ? img : '/static/no-image.png';
  const { src, srcset, sizes } = buildResponsiveSources(imgSrc);

  const name = escHtml(item.name || 'Unknown');
  const username = escHtml(item.username || '');
  const subscribePrice = item.subscribePrice ?? item.subscribeprice;
  const priceText = (subscribePrice && !isNaN(subscribePrice))
    ? `$${parseFloat(subscribePrice).toFixed(2)}`
    : 'FREE';
  const isVerified = item.isVerified ?? item.isverified;
  const verifiedBadge = isVerified ? '<span aria-label="Verified" title="Verified creator">✓ </span>' : '';
  const profileUrl = username ? `https://onlyfans.com/${encodeURIComponent(username)}` : '#';
  const loading = index === 0 ? 'eager' : 'lazy';
  const fetchpriority = index === 0 ? ' fetchpriority="high"' : '';
  const priceHtml = priceText === 'FREE'
    ? `<p class="price-free" style="color:#34c759;font-weight:700;font-size:16px;text-transform:uppercase;">FREE</p>`
    : `<p class="price-tag" style="color:#34c759;font-weight:700;font-size:18px;">${priceText}</p>`;

  return `<div class="col-sm-6 col-md-4 col-lg-3 mb-4">
  <div class="card h-100">
    <button class="favorite-btn" data-username="${username}" onclick="event.preventDefault();toggleFavorite('${username}',this);">
      <span>♡</span>
    </button>
    <img src="${src}" srcset="${srcset}" sizes="${sizes}"
      alt="${name} OnlyFans creator" width="270" height="360"
      style="aspect-ratio:3/4;" loading="${loading}"${fetchpriority}
      decoding="async" referrerpolicy="no-referrer"
      onerror="if(this.src!=='/static/no-image.png'){this.removeAttribute('srcset');this.removeAttribute('sizes');this.src='${escHtml(imgSrc)}';}">
    <div class="card-body">
      <h3 style="font-size:1rem;font-weight:700;margin-bottom:4px;">${verifiedBadge}${name}</h3>
      <p class="username">@${username}</p>
      ${priceHtml}
      <a href="${escHtml(profileUrl)}" class="view-profile-btn" target="_blank" rel="noopener noreferrer">View Profile</a>
    </div>
  </div>
</div>`;
}

// ---------------------------------------------------------------------------
// JSON-LD structured data
// ---------------------------------------------------------------------------
function buildJsonLd(slug, label, creators, canonicalUrl) {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Categories', item: `${BASE_URL}/categories/` },
      { '@type': 'ListItem', position: 3, name: label, item: canonicalUrl },
    ],
  };
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Best ${label} OnlyFans Creators`,
    url: canonicalUrl,
    numberOfItems: creators.length,
    itemListElement: creators.slice(0, 10).map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: escHtml(c.name || c.username),
      url: `https://onlyfans.com/${encodeURIComponent(c.username)}`,
    })),
  };
  return [
    `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(itemList)}</script>`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  const slug = (req.query.slug || '').toLowerCase().trim();
  if (!slug) return res.status(400).send('Missing slug');

  const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

  // If env vars are missing, fall back to client-side rendering
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.redirect(302, '/category.html');
  }

  try {
    // --- 1. Resolve search terms ---
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const offset = (page - 1) * PAGE_SIZE;
    const isCompound = compoundCategories && compoundCategories[slug];
    const terms = isCompound
      ? (compoundCategories[slug].synonyms || [compoundCategories[slug].searchTerm])
      : (synonymsMap[slug]?.length ? synonymsMap[slug] : [slug.replace(/-/g, ' ')]);
    const label = isCompound ? compoundCategories[slug].displayLabel : slugToLabel(slug);

    // --- 2. Fetch creators from Supabase ---
    const searchCols = ['username', 'name', 'about', 'location'];
    const expressions = terms.flatMap(t =>
      searchCols.map(c => `${c}.ilike.*${t}*`)
    );

    const selectCols = [
      'id', 'username', 'name', 'avatar', 'avatar_c144',
      'isverified', 'subscribeprice', 'favoritedcount', 'subscriberscount',
    ].join(',');

    const params = new URLSearchParams({
      select: selectCols,
      order: 'favoritedcount.desc,subscribeprice.asc',
      limit: String(PAGE_SIZE),
      offset: String(offset),
      or: `(${expressions.join(',')})`,
    });

    // Compound category auto-filters
    if (isCompound && compoundCategories[slug].filters) {
      const { maxPrice, verified } = compoundCategories[slug].filters;
      if (maxPrice !== undefined) params.set('subscribeprice', `lte.${maxPrice}`);
      if (verified) params.set('isverified', 'eq.true');
    }

    const supaFetch = await fetch(`${SUPABASE_URL}/rest/v1/onlyfans_profiles?${params}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Accept-Profile': 'public',
        Prefer: 'count=exact',
      },
    });

    // 416 = Range Not Satisfiable: offset is beyond total count → treat as empty page
    let creators, totalCount;
    if (supaFetch.status === 416) {
      creators = [];
      totalCount = 0;
    } else {
      if (!supaFetch.ok) throw new Error(`Supabase ${supaFetch.status}`);
      creators = await supaFetch.json();
      const contentRange = supaFetch.headers.get('content-range') || '';
      totalCount = parseInt(contentRange.split('/')[1] || '0', 10) || creators.length;
    }

    // --- 3. Read template ---
    let html = readFileSync(CATEGORY_HTML, 'utf8');

    const canonicalUrl = page > 1
      ? `${BASE_URL}/categories/${slug}/${page}/`
      : `${BASE_URL}/categories/${slug}/`;
    const pageLabel = page > 1 ? ` - Page ${page}` : '';
    const titleText = `Best ${label} OnlyFans Creators${pageLabel} (${YEAR}) | FansPedia`;
    const metaDescription = `Browse ${totalCount > 0 ? totalCount + '+' : 'top'} ${label} OnlyFans creators on FansPedia. Filter by verified status, bundles, and price.${page > 1 ? ` Page ${page}.` : ''}`;

    // rel prev / next for paginated series
    const prevLink = page > 2
      ? `<link rel="prev" href="${BASE_URL}/categories/${slug}/${page - 1}/">`
      : page === 2
        ? `<link rel="prev" href="${BASE_URL}/categories/${slug}/">`
        : '';
    const nextLink = creators.length === PAGE_SIZE
      ? `<link rel="next" href="${BASE_URL}/categories/${slug}/${page + 1}/">`
      : '';

    // --- 4. Head injections ---
    html = html.replace(
      '<title>Best OnlyFans Category | FansPedia</title>',
      `<title>${escHtml(titleText)}</title>`
    );
    html = html.replace(
      /(<meta name="description" content=")[^"]*(")/,
      `$1${metaDescription}$2`
    );
    html = html.replace(
      /(<link id="canonicalLink" rel="canonical" href=")[^"]*(")/,
      `$1${canonicalUrl}$2`
    );

    const jsonLd = buildJsonLd(slug, label, creators, canonicalUrl);
    const ssrFlag = `<script>window.__CATEGORY_SSR={slug:${JSON.stringify(slug)},count:${totalCount},hasMore:${creators.length === PAGE_SIZE},page:${page}};</script>`;
    const paginationLinks = [prevLink, nextLink].filter(Boolean).join('\n');
    html = html.replace('</head>', `${jsonLd}\n${ssrFlag}\n${paginationLinks ? paginationLinks + '\n' : ''}</head>`);

    // --- 5. Body injections ---
    html = html.replace(
      '<h1 id="catH1" class="mb-2">Best OnlyFans Creators</h1>',
      `<h1 id="catH1" class="mb-2">Best OnlyFans ${escHtml(label)} Creators</h1>`
    );
    html = html.replace(
      /(<p id="catSubtitle" class="subtitle">)[^<]*/,
      `$1Explore top ${escHtml(label)} OnlyFans creators. Use filters to find verified models, free accounts, and bundle deals.`
    );

    // Pre-rendered creator cards
    const cardsHtml = Array.isArray(creators) && creators.length > 0
      ? creators.map((c, i) => renderCard(c, i)).join('\n')
      : `<p class="text-muted text-center w-100 py-4">No results found for <strong>${escHtml(label)}</strong>.</p>`;

    html = html.replace(
      '<div id="results" class="row g-3 justify-content-center"></div>',
      `<div id="results" class="row g-3 justify-content-center">\n${cardsHtml}\n</div>`
    );

    // --- 6. Send ---
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // 5-minute CDN cache; stale-while-revalidate so Vercel serves stale while refreshing
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    return res.status(200).send(html);

  } catch (err) {
    console.error('[ssr/category] error:', err.message);
    // Graceful fallback to client-side rendering
    return res.redirect(302, '/category.html');
  }
}
