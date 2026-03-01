/**
 * SSR handler for /es/country/:name pages
 *
 * Spanish mirror of api/ssr/country.js.
 * Differences vs the EN handler:
 *   - Templates: es/<country>.html  (already have lang="es")
 *   - Spanish titles are already set in the templates; SSR updates canonical
 *   - Canonical URL under /es/country/
 *   - hreflang="en" + hreflang="es" cross-links (prevents Google dedup)
 *   - JSON-LD breadcrumbs use /es/ paths
 *   - Fallback: redirect to /es/<country>.html
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
// Country config map (Spanish labels + metadata)
// ---------------------------------------------------------------------------
const COUNTRIES = {
  'united-states': {
    terms: ['united states', 'usa', 'america', 'american'],
    label: 'Estados Unidos',
    htmlFile: 'es/united-states.html',
    h1: 'Las Mejores Creadoras de OnlyFans en Estados Unidos',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares en Estados Unidos. Explora perfiles verificados, cuentas gratis y contenido exclusivo de creadoras americanas.',
    titleEs: `Mejores Creadoras de OnlyFans en Estados Unidos (${YEAR}) | FansPedia`,
  },
  canada: {
    terms: ['canada', 'canadian'],
    label: 'Canadá',
    htmlFile: 'es/canada.html',
    h1: 'Las Mejores Creadoras de OnlyFans en Canadá',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares en Canadá. Explora perfiles verificados, cuentas gratis y contenido exclusivo de creadoras canadienses.',
    titleEs: `Mejores Creadoras de OnlyFans en Canadá (${YEAR}) | FansPedia`,
  },
  india: {
    terms: ['india', 'indian'],
    label: 'India',
    htmlFile: 'es/india.html',
    h1: 'Las Mejores Creadoras de OnlyFans en India',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares en India. Explora perfiles verificados, cuentas gratis y contenido exclusivo de creadoras de India.',
    titleEs: `Mejores Creadoras de OnlyFans en India (${YEAR}) | FansPedia`,
  },
  japan: {
    terms: ['japan', 'japanese'],
    label: 'Japón',
    htmlFile: 'es/japan.html',
    h1: 'Las Mejores Creadoras de OnlyFans en Japón',
    metaDesc: 'Descubre las creadoras de OnlyFans más populares en Japón. Explora perfiles verificados, cuentas gratis y contenido exclusivo de creadoras japonesas.',
    titleEs: `Mejores Creadoras de OnlyFans en Japón (${YEAR}) | FansPedia`,
  },
};

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
    <div class="card-img-wrap">
      <img src="${src}" srcset="${srcset}" sizes="${sizes}"
        alt="${name} creadora de OnlyFans" loading="${loading}"${fetchpriority}
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
// JSON-LD structured data
// ---------------------------------------------------------------------------
function buildJsonLd(name, label, creators, canonicalUrl) {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${BASE_URL}/es/` },
      { '@type': 'ListItem', position: 2, name: 'Países', item: `${BASE_URL}/es/` },
      { '@type': 'ListItem', position: 3, name: label, item: canonicalUrl },
    ],
  };
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Mejores Creadoras de OnlyFans en ${label} (${YEAR})`,
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
  if (!config) return res.redirect(302, '/es/');

  const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.redirect(302, `/${config.htmlFile}`);
  }

  try {
    // --- 1. Build Supabase OR query ---
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const offset = (page - 1) * PAGE_SIZE;
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
      offset: String(offset),
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

    // --- 2. Read ES template ---
    const htmlPath = join(ROOT, config.htmlFile);
    let html = readFileSync(htmlPath, 'utf8');

    const canonicalUrl = page > 1
      ? `${BASE_URL}/es/country/${name}/${page}/`
      : `${BASE_URL}/es/country/${name}/`;
    const enUrl = page > 1
      ? `${BASE_URL}/country/${name}/${page}/`
      : `${BASE_URL}/country/${name}/`;

    // hreflang cross-links
    const hreflangLinks = [
      `<link rel="alternate" hreflang="en" href="${enUrl}">`,
      `<link rel="alternate" hreflang="es" href="${canonicalUrl}">`,
      `<link rel="alternate" hreflang="x-default" href="${enUrl}">`,
    ].join('\n');

    const prevLink = page > 2
      ? `<link rel="prev" href="${BASE_URL}/es/country/${name}/${page - 1}/">`
      : page === 2
        ? `<link rel="prev" href="${BASE_URL}/es/country/${name}/">`
        : '';
    const nextLink = creators.length === PAGE_SIZE
      ? `<link rel="next" href="${BASE_URL}/es/country/${name}/${page + 1}/">`
      : '';

    // --- 3. Inject canonical + title ---
    if (/<link[^>]+rel="canonical"/.test(html)) {
      html = html.replace(
        /(<link[^>]+rel="canonical"[^>]+href=")[^"]*(")/,
        `$1${canonicalUrl}$2`
      );
    } else {
      html = html.replace('</head>', `  <link rel="canonical" href="${canonicalUrl}">\n</head>`);
    }

    // Spanish title with page suffix
    const titleSuffix = page > 1 ? ` - Página ${page}` : '';
    html = html.replace(
      /<title>([^<]*)<\/title>/,
      `<title>${escHtml(config.titleEs.replace(` (${YEAR})`, `${titleSuffix} (${YEAR})`))}</title>`
    );

    // Update meta description on first page only (template already has Spanish text)
    if (page === 1 && /<meta name="description"/.test(html)) {
      html = html.replace(
        /(<meta name="description" content=")[^"]*(")/,
        `$1${config.metaDesc}$2`
      );
    }

    // --- 4. Inject JSON-LD + SSR flag + hreflang + pagination ---
    const jsonLd = buildJsonLd(name, config.label, creators, canonicalUrl);
    const ssrFlag = `<script>window.__COUNTRY_SSR={name:${JSON.stringify(name)},count:${totalCount},hasMore:${creators.length === PAGE_SIZE},page:${page}};</script>`;
    const paginationLinks = [prevLink, nextLink].filter(Boolean).join('\n');
    // LCP preload
    const _lcpImg = creators[0]?.avatar || creators[0]?.avatar_c144 || '';
    const _lcpSrc = _lcpImg.startsWith('http') ? _lcpImg : '';
    const preloadLink = _lcpSrc
      ? (() => { const { src, srcset, sizes } = buildResponsiveSources(_lcpSrc); return `<link rel="preload" as="image" fetchpriority="high" href="${src}" imagesrcset="${srcset}" imagesizes="${sizes}">`; })()
      : '';
    html = html.replace(
      '</head>',
      `${preloadLink ? preloadLink + '\n' : ''}${jsonLd}\n${ssrFlag}\n${hreflangLinks}\n${paginationLinks ? paginationLinks + '\n' : ''}</head>`
    );

    // --- 5. Pre-rendered creator cards ---
    const cardsHtml = Array.isArray(creators) && creators.length > 0
      ? creators.map((c, i) => renderCard(c, i)).join('\n')
      : `<p class="text-muted text-center w-100 py-4">No se encontraron creadoras de <strong>${escHtml(config.label)}</strong>.</p>`;

    html = html.replace(
      '<div class="row" id="results"></div>',
      `<div class="row" id="results">\n${cardsHtml}\n</div>`
    );

    // --- 6. Send ---
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    return res.status(200).send(html);

  } catch (err) {
    console.error('[ssr/es-country] error:', err.message);
    return res.redirect(302, `/${config.htmlFile}`);
  }
}
