/**
 * SSR handler for /country/:name pages
 *
 * Fetches top creators for a given country and returns a fully rendered HTML
 * page so Googlebot sees real content on the first request — matching the
 * structural SEO advantage of Next.js / SSR frameworks.
 *
 * Flow:
 *   1. Resolve slug (e.g. "united-states") → config (terms, label, html file)
 *   2. Fetch top PAGE_SIZE creators from Supabase (OR across all fields)
 *   3. Read the country HTML as a string template
 *   4. Inject JSON-LD (BreadcrumbList + ItemList), pre-rendered cards,
 *      and window.__COUNTRY_SSR so client JS skips the duplicate first fetch
 *   5. Return complete HTML with 5-minute CDN cache
 *
 * On any error the handler falls back to a 302 to the plain HTML page for
 * transparent client-side rendering.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const BASE_URL = 'https://fanspedia.net';
const PAGE_SIZE = 50;
const YEAR = new Date().getFullYear();

// ---------------------------------------------------------------------------
// Country config map
// slug → { terms, label, htmlFile, h1, metaDesc }
// ---------------------------------------------------------------------------
const COUNTRIES = {
  'united-states': {
    terms: ['united states', 'usa', 'america', 'american'],
    label: 'United States',
    htmlFile: 'united-states.html',
    h1: 'The Best Onlyfans Creators All Across United States',
    metaDesc: 'Discover the most popular OnlyFans creators across United States. Browse verified profiles, free accounts, and exclusive content from American creators.',
  },
  canada: {
    terms: ['canada', 'canadian'],
    label: 'Canada',
    htmlFile: 'canada.html',
    h1: 'The Best Onlyfans Creators All Across Canada',
    metaDesc: 'Discover the most popular OnlyFans creators across Canada. Browse verified profiles, free accounts, and exclusive content from Canadian creators.',
  },
  india: {
    terms: ['india', 'indian'],
    label: 'India',
    htmlFile: 'india.html',
    h1: 'The Best Onlyfans Creators All Across India',
    metaDesc: 'Discover the most popular OnlyFans creators across India. Browse verified profiles, free accounts, and exclusive content from Indian creators.',
  },
  japan: {
    terms: ['japan', 'japanese'],
    label: 'Japan',
    htmlFile: 'japan.html',
    h1: 'The Best Onlyfans Creators All Across Japan',
    metaDesc: 'Discover the most popular OnlyFans creators across Japan. Browse verified profiles, free accounts, and exclusive content from Japanese creators.',
  },
};

// ---------------------------------------------------------------------------
// Image helpers (mirrors client-side buildResponsiveSources)
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
      { '@type': 'ListItem', position: 2, name: 'Countries', item: `${BASE_URL}/country/` },
      { '@type': 'ListItem', position: 3, name: label, item: canonicalUrl },
    ],
  };
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Best ${label} OnlyFans Creators (${YEAR})`,
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
  const name = (req.query.name || '').toLowerCase().trim();
  if (!name) return res.status(400).send('Missing country name');

  const config = COUNTRIES[name];
  if (!config) {
    // Unknown country — redirect to home
    return res.redirect(302, '/');
  }

  const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.redirect(302, `/${config.htmlFile}`);
  }

  try {
    // --- 1. Build Supabase OR query (mirrors client-side country page logic) ---
    const searchCols = ['username', 'name', 'about', 'location'];
    const expressions = config.terms.flatMap(term =>
      searchCols.map(col => `${col}.ilike.*${term}*`)
    );

    const selectCols = [
      'id', 'username', 'name', 'avatar', 'avatar_c144',
      'isverified', 'subscribeprice', 'favoritedcount', 'subscriberscount',
    ].join(',');

    const params = new URLSearchParams({
      select: selectCols,
      order: 'favoritedcount.desc,subscribeprice.asc',
      limit: String(PAGE_SIZE),
      offset: '0',
      or: `(${expressions.join(',')})`,
    });

    const supaFetch = await fetch(`${SUPABASE_URL}/rest/v1/onlyfans_profiles?${params}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Accept-Profile': 'public',
        Prefer: 'count=exact',
      },
    });

    if (!supaFetch.ok) throw new Error(`Supabase ${supaFetch.status}`);
    const creators = await supaFetch.json();
    const contentRange = supaFetch.headers.get('content-range') || '';
    const totalCount = parseInt(contentRange.split('/')[1] || '0', 10) || creators.length;

    // --- 2. Read template ---
    const htmlPath = join(ROOT, config.htmlFile);
    let html = readFileSync(htmlPath, 'utf8');

    const canonicalUrl = `${BASE_URL}/country/${name}/`;

    // --- 3. Inject canonical link (update or add) ---
    if (/<link[^>]+rel="canonical"/.test(html)) {
      html = html.replace(
        /(<link[^>]+rel="canonical"[^>]+href=")[^"]*(")/,
        `$1${canonicalUrl}$2`
      );
    } else {
      html = html.replace('</head>', `  <link rel="canonical" href="${canonicalUrl}">\n</head>`);
    }

    // --- 4. Inject JSON-LD + SSR flag ---
    const jsonLd = buildJsonLd(name, config.label, creators, canonicalUrl);
    const ssrFlag = `<script>window.__COUNTRY_SSR={name:${JSON.stringify(name)},count:${totalCount},hasMore:${creators.length === PAGE_SIZE}};</script>`;
    html = html.replace('</head>', `${jsonLd}\n${ssrFlag}\n</head>`);

    // --- 5. Pre-rendered creator cards ---
    const cardsHtml = Array.isArray(creators) && creators.length > 0
      ? creators.map((c, i) => renderCard(c, i)).join('\n')
      : `<p class="text-muted text-center w-100 py-4">No creators found from <strong>${escHtml(config.label)}</strong>.</p>`;

    html = html.replace(
      '<div class="row" id="results"></div>',
      `<div class="row" id="results">\n${cardsHtml}\n</div>`
    );

    // --- 6. Send ---
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    return res.status(200).send(html);

  } catch (err) {
    console.error('[ssr/country] error:', err.message);
    return res.redirect(302, `/${config.htmlFile}`);
  }
}
