/**
 * SSR handler for the Spanish homepage (/es, /es/)
 *
 * Spanish mirror of api/ssr/home.js.
 * Differences vs the EN handler:
 *   - Template: es/index.html (already has lang="es" and Spanish copy)
 *   - Spanish JSON-LD / meta titles
 *   - Canonical under /es/
 *   - hreflang en↔es cross-links
 *   - Fallback: serve plain es/index.html for client-side rendering
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const BASE_URL = 'https://fanspedia.net';
const YEAR = new Date().getFullYear();
const POPULAR_LIMIT = 25;
const NEWEST_LIMIT = 25;

const SELECT_COLS = [
  'id', 'username', 'name', 'avatar', 'avatar_c144',
  'isverified', 'subscribeprice', 'favoritedcount', 'subscriberscount', 'joindate',
].join(',');

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

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Card renderer (mirrors home.js renderCard)
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
  const verifiedBadge = isVerified ? '<span aria-label="Verificado" title="Creadora verificada">✓ </span>' : '';
  const profileUrl = username ? `https://onlyfans.com/${encodeURIComponent(username)}` : '#';
  const loading = index === 0 ? 'eager' : 'lazy';
  const fetchpriority = index === 0 ? ' fetchpriority="high"' : '';
  const priceHtml = priceText === 'FREE'
    ? `<p class="price-free" style="color:#34c759;font-weight:700;font-size:16px;text-transform:uppercase;">GRATIS</p>`
    : `<p class="price-tag" style="color:#34c759;font-weight:700;font-size:18px;">${priceText}</p>`;

  return `<div class="col-sm-6 col-md-4 col-lg-3 mb-4">
  <div class="card h-100">
    <button class="favorite-btn" data-username="${username}" onclick="event.preventDefault();toggleFavorite('${username}',this);">
      <span>♡</span>
    </button>
    <div class="card-img-wrap">
      <img src="${src}" srcset="${srcset}" sizes="${sizes}"
        alt="${name} OnlyFans creator" loading="${loading}"${fetchpriority}
        decoding="async" referrerpolicy="no-referrer"
        onerror="if(this.src!=='/static/no-image.png'){this.removeAttribute('srcset');this.removeAttribute('sizes');this.src='${escHtml(imgSrc)}';this.style.opacity='0.4';}">
    </div>
    <div class="card-body">
      <h3 style="font-size:1rem;font-weight:700;margin-bottom:4px;">${verifiedBadge}${name}</h3>
      <p class="username">@${username}</p>
      ${priceHtml}
      <a href="${escHtml(profileUrl)}" class="view-profile-btn" target="_blank" rel="noopener noreferrer">Ver Perfil</a>
    </div>
  </div>
</div>`;
}

// ---------------------------------------------------------------------------
// JSON-LD: Spanish WebSite + ItemList
// ---------------------------------------------------------------------------
function buildJsonLd(creators) {
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FansPedia',
    url: `${BASE_URL}/es/`,
    inLanguage: 'es',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Las Mejores Creadoras de OnlyFans (${YEAR})`,
    url: `${BASE_URL}/es/`,
    inLanguage: 'es',
    numberOfItems: creators.length,
    itemListElement: creators.slice(0, 10).map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: escHtml(c.name || c.username),
      url: `https://onlyfans.com/${encodeURIComponent(c.username)}`,
    })),
  };
  return [
    `<script type="application/ld+json">${JSON.stringify(website)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(itemList)}</script>`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// hreflang cross-links
// ---------------------------------------------------------------------------
const HREFLANG = [
  `<link rel="alternate" hreflang="en" href="${BASE_URL}/" />`,
  `<link rel="alternate" hreflang="es" href="${BASE_URL}/es/" />`,
  `<link rel="alternate" hreflang="x-default" href="${BASE_URL}/" />`,
].join('\n');

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

  let rawHtml;
  try {
    rawHtml = readFileSync(join(ROOT, 'es', 'index.html'), 'utf8');
  } catch (readErr) {
    console.error('[ssr/es-home] could not read es/index.html:', readErr.message);
    return res.status(500).send('Internal Server Error');
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(rawHtml);
  }

  try {
    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Accept-Profile': 'public',
      Prefer: 'count=exact',
    };

    const popularParams = new URLSearchParams({
      select: SELECT_COLS,
      order: 'favoritedcount.desc',
      limit: String(POPULAR_LIMIT),
    });
    const newestParams = new URLSearchParams({
      select: SELECT_COLS,
      order: 'joindate.desc',
      limit: String(NEWEST_LIMIT),
    });

    const [popularRes, newestRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/onlyfans_profiles?${popularParams}`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/onlyfans_profiles?${newestParams}`, { headers }),
    ]);

    if (!popularRes.ok) throw new Error(`Supabase popular fetch ${popularRes.status}`);
    if (!newestRes.ok) throw new Error(`Supabase newest fetch ${newestRes.status}`);

    const [popular, newest] = await Promise.all([popularRes.json(), newestRes.json()]);

    const seen = new Set();
    const creators = [];
    for (const c of [...popular, ...newest]) {
      if (!seen.has(c.id)) { seen.add(c.id); creators.push(c); }
    }

    let html = rawHtml;

    // data-ssr + data-initial-creators on <body>
    html = html.replace('<body>', `<body data-ssr="true" data-initial-creators="${creators.length}">`);

    // Inject hreflang (es/index.html already has hreflang tags but we ensure canonical is correct)
    // Replace existing canonical to enforce /es/
    html = html.replace(
      /<link rel="canonical"[^>]*>/,
      `<link rel="canonical" href="${BASE_URL}/es/" />`
    );

    // Inject JSON-LD + SSR flag
    const jsonLd = buildJsonLd(creators);
    // LCP preload
    const _lcpImg = creators[0]?.avatar || creators[0]?.avatar_c144 || '';
    const _lcpSrc = _lcpImg.startsWith('http') ? _lcpImg : '';
    const preloadLink = _lcpSrc
      ? (() => { const { src, srcset, sizes } = buildResponsiveSources(_lcpSrc); return `<link rel="preload" as="image" fetchpriority="high" href="${src}" imagesrcset="${srcset}" imagesizes="${sizes}">`; })()
      : '';
    const updatedAt = new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' });
    const ssrFlag = `<script>window.__HOME_SSR={count:${creators.length},hasMore:true,updatedAt:"${updatedAt}"};</script>`;
    html = html.replace('</head>', `${preloadLink ? preloadLink + '\n' : ''}${jsonLd}\n${ssrFlag}\n</head>`);

    // Pre-render cards
    const cardsHtml = creators.length > 0
      ? creators.map((c, i) => renderCard(c, i)).join('\n')
      : '';

    if (cardsHtml) {
      html = html.replace(
        '<div id="results" class="row g-3 justify-content-center"></div>',
        `<div id="results" class="row g-3 justify-content-center">\n${cardsHtml}\n</div>`
      );
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    return res.status(200).send(html);

  } catch (err) {
    console.error('[ssr/es-home] error:', err.message);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(rawHtml);
  }
}
