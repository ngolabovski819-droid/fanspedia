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
import { categorySeoEs } from './seo-meta.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ES_CATEGORY_HTML = join(__dirname, '..', '..', 'es', 'category.html');

const BASE_URL = 'https://fanspedia.net';
const PAGE_SIZE = 24;
const YEAR = new Date().getFullYear();

const CRITICAL_GRID_CSS = `<style id="critGrid">.row{--bs-gutter-x:1.5rem;--bs-gutter-y:0;display:flex;flex-wrap:wrap;margin-top:calc(-1*var(--bs-gutter-y));margin-right:calc(-.5*var(--bs-gutter-x));margin-left:calc(-.5*var(--bs-gutter-x))}.row>*{flex-shrink:0;width:100%;max-width:100%;padding-right:calc(var(--bs-gutter-x)*.5);padding-left:calc(var(--bs-gutter-x)*.5);margin-top:var(--bs-gutter-y)}.g-3,.gx-3{--bs-gutter-x:1rem}.g-3,.gy-3{--bs-gutter-y:1rem}@media(min-width:576px){.col-sm-6{flex:0 0 auto;width:50%}}@media(min-width:768px){.col-md-4{flex:0 0 auto;width:33.33333%}}@media(min-width:992px){.col-lg-3{flex:0 0 auto;width:25%}}.h-100{height:100%!important}.mb-4{margin-bottom:1.5rem!important}.justify-content-center{justify-content:center!important}.card{display:flex;flex-direction:column;min-width:0}.card-body{flex:1 1 auto}</style>`;

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
  const decoding = index === 0 ? 'sync' : 'async';
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
        decoding="${decoding}" referrerpolicy="no-referrer"
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
// Bloque SEO desplegable — inyectado debajo de los filtros en cada categoría
// ---------------------------------------------------------------------------
function buildEsCategorySeoSection(slug, label) {
  const year = new Date().getFullYear();

  const intros = {
    'best':       `Las mejores creadoras de OnlyFans en ${year} se distinguen por su constancia en publicaciones, interacción genuina con sus seguidores y contenido exclusivo que no se encuentra en ningún otro lugar. Con más de 4,6 millones de perfiles en la plataforma, el recuento de suscriptores y favoritos son las métricas públicas más fiables para identificar a las creadoras de mayor calidad.`,
    'free':       `Las cuentas de OnlyFans gratuitas se han convertido en una de las estrategias de descubrimiento más eficaces de la plataforma en ${year}. Las mejores cuentas gratuitas publican contenido regularmente y usan el nivel gratuito como un escaparate genuino, no como una página abandonada, monetizando a través de publicaciones de pago por visión, propinas y solicitudes personalizadas.`,
    'verified':   `Las creadoras verificadas de OnlyFans han completado el proceso oficial de verificación de identidad de la plataforma, ofreciendo a los suscriptores la confianza de que la persona detrás de la cuenta es exactamente quien dice ser. En un espacio donde la suplantación de identidad es una preocupación real, la insignia de verificación es la señal de confianza más significativa disponible.`,
    'blonde':     `Las creadoras de OnlyFans rubias se encuentran entre los perfiles más buscados de la plataforma, impulsados por asociaciones culturales duraderas y una variedad de estilos que va desde tonos dorados naturales hasta transformaciones platino. Las mejores perfiles rubias combinan su estética con alta frecuencia de publicación y comunicación activa con sus fans.`,
    'brunette':   `Las creadoras de OnlyFans morenas representan el segmento estético más grande de la plataforma, lo que significa que la competencia por destacar es feroz. Los perfiles clasificados aquí se diferencian por la calidad del contenido, la frecuencia de publicación por encima del promedio de la plataforma y las tasas de interacción con suscriptores que impulsan la retención a largo plazo.`,
    'milf':       `Las creadoras MILF de OnlyFans han sido uno de los nichos de mayor crecimiento de la plataforma en ${year}, impulsadas por una audiencia que valora la confianza, la madurez y un enfoque fundamentado del contenido. Los perfiles más exitosos combinan experiencia con autenticidad, cualidades que se traducen directamente en menor abandono de suscriptores y mayores propinas por suscriptor.`,
    'latina':     `Las creadoras latinas de OnlyFans abarcan una enorme variedad geográfica y cultural — colombianas, mexicanas, brasileñas, puertorriqueñas, dominicanas y españolas contribuyen a un nicho que se ha convertido en una de las categorías más demandadas de la plataforma en ${year}. Las mejores perfiles latinas combinan personalidad vibrante con alto volumen de contenido y participación activa en DMs.`,
    'ebony':      `Las creadoras ebony de OnlyFans han construido algunas de las comunidades más comprometidas de la plataforma, combinando marca personal auténtica, diversas estéticas de la diáspora africana y contenido que resuena con suscriptores que buscan representación genuina. Las métricas de lealtad de los fans en este nicho se encuentran constantemente entre las más altas de la plataforma.`,
    'asian':      `Las creadoras asiáticas de OnlyFans abarcan una notable variedad de identidades geográficas y culturales — japonesas, coreanas, tailandesas, filipinas, vietnamitas y chinas aportan sensibilidades estéticas distintivas que han convertido este nicho en uno de los más activamente buscados internacionalmente.`,
    'petite':     `Las creadoras petite de OnlyFans atraen a una de las bases de suscriptores más dedicadas de la plataforma — fans que buscan específicamente la estética petite por su aspecto distintivo y el estilo de contenido íntimo y accesible que muchas creadoras de figura pequeña aportan naturalmente a sus perfiles.`,
    'bbw':        `Las creadoras BBW y curvilíneas de OnlyFans han construido algunas de las comunidades más leales de la plataforma convirtiendo la positividad corporal en un negocio de suscripciones sostenible. Los suscriptores en este nicho muestran tasas de participación por encima del promedio y menor abandono que reflejan un apego comunitario genuino.`,
    'trans':      `Las creadoras trans de OnlyFans han construido algunas de las comunidades más leales y solidarias de la plataforma, con suscriptores atraídos por la autoexpresión auténtica, la producción de contenido de alta calidad y el modelo de pago directo creadora-fan que ofrece OnlyFans.`,
    'feet':       `El contenido de pies en OnlyFans ha crecido de una solicitud de nicho a una de las categorías de mayor rendimiento en ${year}, con creadoras dedicadas que construyen negocios de suscripción sostenibles basados en fotografía de alta calidad, videos personalizados y participación interactiva de fans.`,
    'fitness':    `Las creadoras de fitness de OnlyFans ocupan una intersección única y lucrativa entre la cultura de bienestar y el contenido exclusivo, ofreciendo a los suscriptores rutinas de entrenamiento, estrategias nutricionales, contenido centrado en la condición física y acceso entre bastidores que las plataformas de fitness convencionales prohíben explícitamente.`,
    'cosplay':    `Las creadoras de cosplay de OnlyFans han transformado los proyectos de pasión de la cultura de las convenciones en prósperos negocios de suscripción, dando a los fans dedicados acceso exclusivo a sesiones de disfraces elaborados, contenido de artesanía y medios basados en personajes.`,
    'amateur':    `Las creadoras amateur de OnlyFans representan el corazón auténtico de la plataforma — personas reales que construyen relaciones genuinas con suscriptores en lugar de producciones de estudio pulidas. Es esa autenticidad sin filtros la que impulsa algunos de los números de lealtad de fans más altos del sitio.`,
    'hentai':     `Las creadoras de contenido hentai y anime de OnlyFans han construido una comunidad de nicho dedicada combinando artesanía de cosplay, estética ahegao, personalidad kawaii y contenido basado en personajes que atrae a fans del anime que buscan interpretaciones exclusivas de arquetipos familiares.`,
  };

  const defaultIntro = `Las creadoras de OnlyFans en la categoría ${label} representan uno de los segmentos más buscados de la plataforma en ${year}. Los perfiles mostrados aquí han sido clasificados por participación de suscriptores y conteos de favoritos — métricas reales de fans que reflejan la calidad genuina del contenido y la constancia en publicaciones, no números de seguidores autoreportados.`;

  const closers = [
    `FansPedia hace que encontrar la creadora de OnlyFans ${label} adecuada sea significativamente más rápido que navegar directamente por la plataforma. Usa el filtro de verificación para limitarte a cuentas confirmadas, ajusta el precio máximo con el control deslizante para adaptarte a tu presupuesto, o activa el filtro de paquetes para descubrir creadoras que ofrecen suscripciones multi-mes con descuento. Todos los datos de perfil se actualizan automáticamente.`,
    `Suscribirse a una creadora de OnlyFans ${label} es una contribución financiera directa al negocio de contenido de esa persona. Las creadoras clasificadas aquí obtienen los mejores resultados en este nicho en recuento de suscriptores y participación de fans. Usa el control deslizante de precio para filtrar por presupuesto mensual, activa solo-verificadas para excluir cuentas no confirmadas, o explora libremente y carga más resultados para descubrir más perfiles.`,
    `No todas las cuentas de OnlyFans ${label} ofrecen el mismo valor. La frecuencia de publicación, el tiempo de respuesta a mensajes de fans y los precios de suscripción activos varían significativamente entre perfiles. FansPedia clasifica a las creadoras ${label} por métricas de participación real para que puedas identificar inmediatamente quién está publicando activamente. Filtra por estado de verificación y precio para adaptar los resultados a tus preferencias.`,
  ];

  const intro = intros[slug] || defaultIntro;
  const hash = slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const closer = closers[hash % closers.length];

  return `<div id="seoBlock" class="seo-inline-block">
  <button id="seoToggleBtn" class="seo-toggle-header" onclick="(function(){var c=document.getElementById('seoContent');var b=document.getElementById('seoToggleBtn');var open=c.classList.toggle('seo-open');c.setAttribute('aria-hidden',String(!open));b.setAttribute('aria-expanded',String(open));})()" aria-expanded="false" aria-controls="seoContent">
    <span class="seo-header-label"><span class="seo-info-icon">&#9432;</span> Sobre ${escHtml(label)} OnlyFans Creators</span>
    <span class="seo-caret">&#9660;</span>
  </button>
  <div id="seoContent" class="seo-inline-content" aria-hidden="true">
    <p>${intro}</p>
    <p>${closer}</p>
  </div>
</div>`;
}

// ---------------------------------------------------------------------------
// In-memory per-slug HTML cache — avoids Supabase roundtrip on every CDN miss.
// Key: `${slug}:${page}`. TTL: 5 minutes.
// ---------------------------------------------------------------------------
const _esCategoryCache = new Map(); // key → { html, expiresAt }
const ES_CATEGORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

    // ── Memory cache check ──────────────────────────────────────────────────
    const cacheKey = `${slug}:${page}`;
    const cachedEntry = _esCategoryCache.get(cacheKey);
    if (cachedEntry && Date.now() < cachedEntry.expiresAt) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=604800');
      res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=604800');
      return res.status(200).send(cachedEntry.html);
    }
    // ────────────────────────────────────────────────────────────────────────
    const offset = (page - 1) * PAGE_SIZE;
    const isCompound = compoundCategories && compoundCategories[slug];
    const terms = isCompound
      ? (compoundCategories[slug].synonyms || [compoundCategories[slug].searchTerm])
      : (synonymsMap[slug]?.length ? synonymsMap[slug] : [slug.replace(/-/g, ' ')]);
    const label = isCompound ? compoundCategories[slug].displayLabel : slugToLabel(slug);

    // --- 2. Fetch creators from Supabase ---
    const searchCols = ['username', 'name'];
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
        Prefer: 'count=estimated',
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

    // Unknown slug with no results → hard 404 to prevent GSC soft-404
    if (creators.length === 0 && totalCount === 0 && page === 1) {
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=604800');
    res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=604800');
      return res.status(404).send('<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Categoría No Encontrada | FansPedia</title><link rel="canonical" href="https://fanspedia.net/es/categories/"></head><body><h1>Categoría No Encontrada</h1><p><a href="/es/categories/">Ver todas las categorías</a></p></body></html>');
    }

    // --- 3. Read ES template ---
    let html = readFileSync(ES_CATEGORY_HTML, 'utf8');

    const canonicalUrl = page > 1
      ? `${BASE_URL}/es/categories/${slug}/${page}/`
      : `${BASE_URL}/es/categories/${slug}/`;
    const pageLabel = page > 1 ? ` - Página ${page}` : '';
    // Conversion-optimized ES title + meta description, rotated by slug hash
    const { title: seoTitle, description: seoDesc } = categorySeoEs(slug, label);
    const titleText = `${seoTitle}${pageLabel}`;
    const metaDescription = page > 1 ? `${seoDesc} Página ${page}.` : seoDesc;

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
      `$1${escHtml(metaDescription)}$2`
    );
    html = html.replace(
      /(<link id="canonicalLink" rel="canonical" href=")[^"]*(")/,
      `$1${canonicalUrl}$2`
    );
    // Open Graph + Twitter (idempotent)
    const ogTags = `<meta property="og:title" content="${escHtml(titleText)}">
<meta property="og:description" content="${escHtml(metaDescription)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:locale" content="es_ES">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escHtml(titleText)}">
<meta name="twitter:description" content="${escHtml(metaDescription)}">`;
    html = html.replace(/\s*<meta\s+(?:property|name)="(?:og:[^"]+|twitter:[^"]+)"[^>]*>/g, '');
    html = html.replace('</head>', `${ogTags}\n</head>`);

    const jsonLd = buildJsonLd(slug, label, creators, canonicalUrl);
    const ssrFlag = `<script>window.__CATEGORY_SSR={slug:${JSON.stringify(slug)},count:${totalCount},hasMore:${creators.length === PAGE_SIZE},page:${page}};</script>`;
    const paginationLinks = [prevLink, nextLink].filter(Boolean).join('\n');
    // LCP preload
    const _lcpImg = creators[0]?.avatar || creators[0]?.avatar_c144 || '';
    const _lcpSrc = _lcpImg.startsWith('http') ? _lcpImg : '';
    const preloadLink = _lcpSrc
      ? (() => { const { src, srcset, sizes } = buildResponsiveSources(_lcpSrc); return `<link rel="preload" as="image" fetchpriority="high" href="${src}" imagesrcset="${srcset}" imagesizes="${sizes}">`; })()
      : '';
    // Inject critGrid + preload early in <head> — eliminates Bootstrap CLS and discovers LCP image before scripts/styles
    html = html.replace(
      '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      `<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  ${CRITICAL_GRID_CSS}${preloadLink ? '\n  ' + preloadLink : ''}`
    );
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

    // --- 7. Collapsible SEO block below filters ---
    html = html.replace('<div id="seoBlock"></div>', buildEsCategorySeoSection(slug, label));

    // Store in memory cache so warm instances skip Supabase next request
    _esCategoryCache.set(cacheKey, { html, expiresAt: Date.now() + ES_CATEGORY_CACHE_TTL });

    // --- 6. Send ---
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=604800');
    res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=604800');
    return res.status(200).send(html);

  } catch (err) {
    console.error('[ssr/es-category] error:', err.message);
    return res.redirect(302, '/es/category.html');
  }
}
