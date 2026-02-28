/**
 * SSR handler for /es/categories/:slug
 *
 * Spanish mirror of api/ssr/category.js.
 * Differences vs the EN handler:
 *   - Template: es/category.html  (already has lang="es")
 *   - Spanish <title>, <meta description>, <h1>, subtitle
 *   - Canonical URL under /es/categories/
 *   - hreflang="en" + hreflang="es" cross-links (prevents Google dedup)
 *   - JSON-LD breadcrumbs use /es/ paths
 *   - Fallback: redirect to /es/category.html
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
const ES_CATEGORY_HTML = join(__dirname, '..', '..', 'es', 'category.html');

const BASE_URL = 'https://fanspedia.net';
const PAGE_SIZE = 50;
const YEAR = new Date().getFullYear();

// ---------------------------------------------------------------------------
// Image helpers
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
// Card renderer (same markup as EN — view-profile-btn labelled in ES template)
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
    : 'GRATIS';
  const isVerified = item.isVerified ?? item.isverified;
  const verifiedBadge = isVerified ? '<span aria-label="Verificado" title="Creadora verificada">✓ </span>' : '';
  const profileUrl = username ? `https://onlyfans.com/${encodeURIComponent(username)}` : '#';
  const loading = index === 0 ? 'eager' : 'lazy';
  const fetchpriority = index === 0 ? ' fetchpriority="high"' : '';
  const priceHtml = priceText === 'GRATIS'
    ? `<p class="price-free" style="color:#34c759;font-weight:700;font-size:16px;text-transform:uppercase;">GRATIS</p>`
    : `<p class="price-tag" style="color:#34c759;font-weight:700;font-size:18px;">${priceText}</p>`;

  return `<div class="col-sm-6 col-md-4 col-lg-3 mb-4">
  <div class="card h-100">
    <button class="favorite-btn" data-username="${username}" onclick="event.preventDefault();toggleFavorite('${username}',this);">
      <span>♡</span>
    </button>
    <img src="${src}" srcset="${srcset}" sizes="${sizes}"
      alt="${name} creadora de OnlyFans" width="270" height="360"
      style="aspect-ratio:3/4;" loading="${loading}"${fetchpriority}
      decoding="async" referrerpolicy="no-referrer"
      onerror="if(this.src!=='/static/no-image.png'){this.removeAttribute('srcset');this.removeAttribute('sizes');this.src='${escHtml(imgSrc)}';}">
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
// JSON-LD structured data (breadcrumbs use /es/ paths)
// ---------------------------------------------------------------------------
function buildJsonLd(slug, label, creators, canonicalUrl) {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${BASE_URL}/es/` },
      { '@type': 'ListItem', position: 2, name: 'Categorías', item: `${BASE_URL}/es/categories/` },
      { '@type': 'ListItem', position: 3, name: label, item: canonicalUrl },
    ],
  };
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Mejores Creadoras de OnlyFans de ${label}`,
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

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.redirect(302, '/es/category.html');
  }

  try {
    // --- 1. Resolve search terms (same as EN — data is language-agnostic) ---
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

    // --- 3. Read ES template ---
    let html = readFileSync(ES_CATEGORY_HTML, 'utf8');

    const canonicalUrl = page > 1
      ? `${BASE_URL}/es/categories/${slug}/${page}/`
      : `${BASE_URL}/es/categories/${slug}/`;
    const pageLabel = page > 1 ? ` - Página ${page}` : '';
    const titleText = `Mejores Creadoras de OnlyFans ${label}${pageLabel} (${YEAR}) | FansPedia`;
    const metaDescription = `Explora ${totalCount > 0 ? totalCount + '+' : 'las mejores'} creadoras de OnlyFans de ${label} en FansPedia. Filtra por verificadas, paquetes y precio.${page > 1 ? ` Página ${page}.` : ''}`;

    // hreflang cross-links (critical — prevents EN/ES duplicate content penalty)
    const enUrl = page > 1
      ? `${BASE_URL}/categories/${slug}/${page}/`
      : `${BASE_URL}/categories/${slug}/`;
    const esUrl = canonicalUrl;
    const hreflangLinks = [
      `<link rel="alternate" hreflang="en" href="${enUrl}">`,
      `<link rel="alternate" hreflang="es" href="${esUrl}">`,
      `<link rel="alternate" hreflang="x-default" href="${enUrl}">`,
    ].join('\n');

    // rel prev / next
    const prevLink = page > 2
      ? `<link rel="prev" href="${BASE_URL}/es/categories/${slug}/${page - 1}/">`
      : page === 2
        ? `<link rel="prev" href="${BASE_URL}/es/categories/${slug}/">`
        : '';
    const nextLink = creators.length === PAGE_SIZE
      ? `<link rel="next" href="${BASE_URL}/es/categories/${slug}/${page + 1}/">`
      : '';

    // --- 4. Head injections ---
    html = html.replace(
      /<title>[^<]*<\/title>/,
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
    html = html.replace(
      '</head>',
      `${jsonLd}\n${ssrFlag}\n${hreflangLinks}\n${paginationLinks ? paginationLinks + '\n' : ''}</head>`
    );

    // --- 5. Body injections ---
    html = html.replace(
      '<h1 id="catH1" class="mb-2">Mejores Creadoras de OnlyFans</h1>',
      `<h1 id="catH1" class="mb-2">Mejores Creadoras de OnlyFans ${escHtml(label)}</h1>`
    );
    html = html.replace(
      /(<p id="catSubtitle" class="subtitle">)[^<]*/,
      `$1Explora las mejores modelos de OnlyFans de ${escHtml(label)}. Usa filtros para refinar tus resultados.`
    );

    // Pre-rendered creator cards
    const cardsHtml = Array.isArray(creators) && creators.length > 0
      ? creators.map((c, i) => renderCard(c, i)).join('\n')
      : `<p class="text-muted text-center w-100 py-4">No se encontraron creadoras de <strong>${escHtml(label)}</strong>.</p>`;

    html = html.replace(
      '<div id="results" class="row g-3 justify-content-center"></div>',
      `<div id="results" class="row g-3 justify-content-center">\n${cardsHtml}\n</div>`
    );

    // --- 6. Send ---
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    return res.status(200).send(html);

  } catch (err) {
    console.error('[ssr/es-category] error:', err.message);
    return res.redirect(302, '/es/category.html');
  }
}
