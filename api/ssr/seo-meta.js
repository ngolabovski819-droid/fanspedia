/**
 * Shared SEO meta generator — country & category pages, EN + ES.
 *
 * Goal: every page gets a unique, conversion-optimized title + meta description
 * without maintaining ~600 hand-written strings. We use 8+ rotating patterns per
 * (surface × language) and pick deterministically by slug hash so the same page
 * always yields the same copy, while neighbouring pages get different patterns.
 *
 * Length contracts:
 *   - Title:    ≤ 60 chars (Google truncation point on desktop)
 *   - Meta:     130–160 chars (best CTR window)
 *
 * pickByHashWithLengthLimit() falls forward through pattern offsets until one
 * fits, so long labels (e.g. "Bosnia and Herzegovina") still get a clean title.
 */

const Y = new Date().getFullYear();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function hashSlug(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

function pickByHashWithLengthLimit(slug, patterns, args, maxLen, minLen = 0) {
  const h = hashSlug(slug);
  let fallback = null;
  for (let i = 0; i < patterns.length; i++) {
    const out = patterns[(h + i) % patterns.length](...args);
    if (out.length <= maxLen && out.length >= minLen) return out;
    if (!fallback && out.length <= maxLen) fallback = out;
  }
  if (fallback) return fallback;
  // last resort: shortest pattern, hard-truncated
  let shortest = patterns.map(p => p(...args)).sort((a, b) => a.length - b.length)[0];
  return shortest.length <= maxLen ? shortest : shortest.slice(0, maxLen - 1) + '…';
}

// Best-effort demonym extraction from existing metaDesc text.
// Pattern matches `from <X> creators.` (the structure used by all current entries).
function extractDemonym(metaDesc, label) {
  if (!metaDesc) return label;
  const m = metaDesc.match(/from\s+([A-Z][A-Za-zÀ-ÿé]+(?:\s+[A-Z][A-Za-zÀ-ÿé]+)?)\s+creators/);
  if (m) return m[1];
  // also handle "across X" form ("across American creators" doesn't appear, but
  // a few entries say "from creators across"). Fall through to label.
  return label;
}

// ---------------------------------------------------------------------------
// COUNTRY — English title patterns
// ---------------------------------------------------------------------------
const COUNTRY_TITLE_EN = [
  (label) => `Top ${label} OnlyFans Creators to Follow in ${Y}`,
  (label) => `Best ${label} OnlyFans Accounts (${Y}) | FansPedia`,
  (label) => `${label} OnlyFans · Verified & Free Profiles ${Y}`,
  (label) => `Find Hot ${label} OnlyFans Girls — ${Y} Edition`,
  (label) => `${label} OnlyFans Search & Discovery (${Y})`,
  (label) => `Hottest ${label} OnlyFans Models Right Now (${Y})`,
  (label) => `${label} OnlyFans Creators · Browse & Filter (${Y})`,
  (label) => `${label} OnlyFans Models — Free, Cheap & Premium`,
  (label) => `Discover Top ${label} OnlyFans Profiles (${Y})`,
  (label) => `${label} OnlyFans · Real, Active, Verified (${Y})`,
];

// ---------------------------------------------------------------------------
// COUNTRY — English meta description patterns
// ---------------------------------------------------------------------------
const COUNTRY_DESC_EN = [
  (label, dem) => `Browse the most-followed ${dem} OnlyFans creators — verified profiles, free pages, and premium bundles. Filter by price and start exploring ${label} accounts now.`,
  (label, dem) => `Meet top ${dem} OnlyFans models with active profiles, verified badges, and bundle offers. See pricing and popularity at a glance — updated daily.`,
  (label, dem) => `Discover hot ${dem} OnlyFans creators ranked by real fan engagement. Free pages, verified accounts, and exclusive content from ${label} — start browsing free.`,
  (label, dem) => `Find the best ${dem} OnlyFans girls in seconds. Filter by free, verified, or premium and skip the homepage scroll. Real ${label} profiles, daily refreshed.`,
  (label, dem) => `${label} OnlyFans search done right — every ${dem} creator listed here is active, verified-flagged, and ranked by fans. Explore free pages and premium bundles instantly.`,
  (label, dem) => `Tired of OnlyFans' homepage? Browse ${dem} creators by price, popularity, and verification status. The fastest way to find active ${label} accounts in ${Y}.`,
  (label, dem) => `Get instant access to top ${dem} OnlyFans profiles — free pages, verified models, and bundle deals all in one filterable feed. Updated weekly with new ${label} creators.`,
  (label, dem) => `Curated ${dem} OnlyFans creators ranked by subscriber count and engagement. Spot free accounts, verified pros, and premium bundles in seconds — no signup required.`,
];

// ---------------------------------------------------------------------------
// COUNTRY — Spanish title patterns
// ---------------------------------------------------------------------------
const COUNTRY_TITLE_ES = [
  (label) => `Mejores Creadoras OnlyFans de ${label} (${Y})`,
  (label) => `Top OnlyFans ${label}: Verificadas y Gratis ${Y}`,
  (label) => `Chicas OnlyFans de ${label} — Perfiles ${Y}`,
  (label) => `OnlyFans ${label}: Buscar Creadoras (${Y})`,
  (label) => `Modelos OnlyFans de ${label} · Gratis y Premium`,
  (label) => `${label} OnlyFans · Activas y Verificadas (${Y})`,
  (label) => `Descubre OnlyFans ${label} — Top Creadoras ${Y}`,
  (label) => `Las Más Populares de OnlyFans en ${label} (${Y})`,
  (label) => `OnlyFans ${label} ${Y} · Filtrar y Encontrar`,
  (label) => `Creadoras OnlyFans ${label} · Reales y Activas`,
];

// ---------------------------------------------------------------------------
// COUNTRY — Spanish meta description patterns
// ---------------------------------------------------------------------------
const COUNTRY_DESC_ES = [
  (label) => `Explora las creadoras de OnlyFans más populares de ${label} — perfiles verificados, cuentas gratis y paquetes premium. Filtra por precio y descubre nuevas modelos.`,
  (label) => `Descubre las mejores chicas OnlyFans de ${label} en ${Y}. Cuentas verificadas, gratis y bundles exclusivos. Filtra y encuentra tu favorita en segundos.`,
  (label) => `Top creadoras OnlyFans de ${label} clasificadas por interacción real. Perfiles activos, gratis y verificados — empieza a explorar ahora sin registro.`,
  (label) => `Encuentra creadoras OnlyFans de ${label} con perfiles activos. Filtra por gratis, verificado o premium y ahorra tiempo. Datos actualizados diariamente.`,
  (label) => `Búsqueda OnlyFans para ${label} — cada creadora aquí es real, activa y clasificada por fans. Cuentas gratis, verificadas y paquetes con descuento.`,
  (label) => `¿Cansado de la portada de OnlyFans? Explora creadoras de ${label} por precio y popularidad. La forma más rápida de encontrar perfiles activos en ${Y}.`,
  (label) => `Acceso directo a las mejores OnlyFans de ${label} — gratis, verificadas y con bundles. Feed filtrable y actualizado semanalmente con nuevas creadoras.`,
  (label) => `Creadoras OnlyFans curadas de ${label}, ordenadas por suscriptores y engagement. Detecta cuentas gratis, verificadas y premium en segundos.`,
];

// ---------------------------------------------------------------------------
// CATEGORY — English title patterns
// ---------------------------------------------------------------------------
const CATEGORY_TITLE_EN = [
  (label) => `Best ${label} OnlyFans Creators (${Y}) | FansPedia`,
  (label) => `Top ${label} OnlyFans Accounts to Follow in ${Y}`,
  (label) => `Hottest ${label} OnlyFans Models · ${Y} Edition`,
  (label) => `${label} OnlyFans · Verified, Free & Premium (${Y})`,
  (label) => `Find ${label} OnlyFans Girls — Updated ${Y}`,
  (label) => `${label} OnlyFans Search · Filter by Price & Verified`,
  (label) => `${label} OnlyFans Creators You Need to Know (${Y})`,
  (label) => `Discover Top ${label} OnlyFans Profiles in ${Y}`,
  (label) => `${label} OnlyFans · Browse & Compare (${Y})`,
  (label) => `Best ${label} OnlyFans Pages · Free & Premium`,
];

// ---------------------------------------------------------------------------
// CATEGORY — English meta description patterns
// ---------------------------------------------------------------------------
const CATEGORY_DESC_EN = [
  (label) => `Browse top ${label} OnlyFans creators ranked by real fan engagement. Filter free, verified, and bundle offers in one click — no signup, daily refreshed.`,
  (label) => `Find the best ${label} OnlyFans accounts in ${Y}. Verified profiles, free pages, and premium bundles all filterable by price. Skip the homepage scroll.`,
  (label) => `Hot ${label} OnlyFans models ranked by subscribers and activity. Spot free pages, verified pros, and bundle deals fast — updated weekly with new ${label} creators.`,
  (label) => `Discover top ${label} OnlyFans profiles with verification badges and live pricing. Filter free, cheap, or premium and find your next favorite creator.`,
  (label) => `${label} OnlyFans search made easy — every creator here is active and ranked by fans. Browse free, verified, and premium ${label} accounts side by side.`,
  (label) => `Tired of OnlyFans' homepage? See ${label} creators sorted by popularity and price. The fastest way to find active ${label} OnlyFans pages in ${Y}.`,
  (label) => `Curated ${label} OnlyFans directory with price filters, verified badges, and bundle alerts. Find your next subscription in under a minute.`,
  (label) => `Top ${label} OnlyFans creators of ${Y} — free pages, verified models, and premium offers in one filterable feed. Real fan-ranked, no algorithm bias.`,
];

// ---------------------------------------------------------------------------
// CATEGORY — Spanish title patterns
// ---------------------------------------------------------------------------
const CATEGORY_TITLE_ES = [
  (label) => `Mejores Creadoras OnlyFans ${label} (${Y}) | FansPedia`,
  (label) => `Top OnlyFans ${label} · Gratis y Verificadas ${Y}`,
  (label) => `Las Mejores OnlyFans ${label} de ${Y}`,
  (label) => `OnlyFans ${label}: Buscar y Filtrar (${Y})`,
  (label) => `${label} OnlyFans · Cuentas Gratis y Premium ${Y}`,
  (label) => `Chicas OnlyFans ${label} — Activas y Verificadas`,
  (label) => `Encuentra OnlyFans ${label} · Filtros y Precios`,
  (label) => `Modelos OnlyFans ${label} ${Y} · Top Perfiles`,
  (label) => `OnlyFans ${label}: Compara y Descubre (${Y})`,
  (label) => `Descubre Top OnlyFans ${label} en ${Y}`,
];

// ---------------------------------------------------------------------------
// CATEGORY — Spanish meta description patterns
// ---------------------------------------------------------------------------
const CATEGORY_DESC_ES = [
  (label) => `Explora las mejores creadoras OnlyFans ${label} ordenadas por interacción real. Filtra gratis, verificadas y paquetes — sin registro, actualizado a diario.`,
  (label) => `Encuentra las mejores cuentas OnlyFans ${label} en ${Y}. Perfiles verificados, páginas gratis y bundles premium con filtros por precio.`,
  (label) => `Modelos OnlyFans ${label} clasificadas por suscriptores y actividad. Detecta páginas gratis, verificadas y bundles en segundos.`,
  (label) => `Descubre top perfiles OnlyFans ${label} con verificación y precios en vivo. Filtra gratis, baratos o premium y encuentra tu próxima creadora.`,
  (label) => `Búsqueda OnlyFans ${label} hecha fácil — cada creadora está activa y rankeada por fans. Compara cuentas gratis, verificadas y premium.`,
  (label) => `¿Cansado de la portada de OnlyFans? Mira creadoras ${label} por popularidad y precio. La forma más rápida de encontrar páginas activas en ${Y}.`,
  (label) => `Directorio curado de OnlyFans ${label} con filtros de precio, verificación y bundles. Encuentra tu próxima suscripción en menos de un minuto.`,
  (label) => `Top creadoras OnlyFans ${label} de ${Y} — gratis, verificadas y premium en un feed filtrable. Rankeadas por fans reales, sin sesgo algorítmico.`,
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a country page title + meta description (EN).
 * @param {string} slug      e.g. "argentina"
 * @param {string} label     e.g. "Argentina"
 * @param {string} fallbackDesc  current static metaDesc, used to extract demonym
 */
export function countrySeoEn(slug, label, fallbackDesc) {
  const dem = extractDemonym(fallbackDesc, label);
  const title = pickByHashWithLengthLimit(slug, COUNTRY_TITLE_EN, [label], 60);
  const description = pickByHashWithLengthLimit(slug + 'd', COUNTRY_DESC_EN, [label, dem], 160, 130);
  return { title, description };
}

export function countrySeoEs(slug, label) {
  const title = pickByHashWithLengthLimit(slug, COUNTRY_TITLE_ES, [label], 60);
  const description = pickByHashWithLengthLimit(slug + 'd', COUNTRY_DESC_ES, [label], 160, 130);
  return { title, description };
}

export function categorySeoEn(slug, label) {
  const title = pickByHashWithLengthLimit(slug, CATEGORY_TITLE_EN, [label], 60);
  const description = pickByHashWithLengthLimit(slug + 'd', CATEGORY_DESC_EN, [label], 160, 130);
  return { title, description };
}

export function categorySeoEs(slug, label) {
  const title = pickByHashWithLengthLimit(slug, CATEGORY_TITLE_ES, [label], 60);
  const description = pickByHashWithLengthLimit(slug + 'd', CATEGORY_DESC_ES, [label], 160, 130);
  return { title, description };
}

// For lint scripts and tests
export const _patterns = {
  COUNTRY_TITLE_EN, COUNTRY_DESC_EN,
  COUNTRY_TITLE_ES, COUNTRY_DESC_ES,
  CATEGORY_TITLE_EN, CATEGORY_DESC_EN,
  CATEGORY_TITLE_ES, CATEGORY_DESC_ES,
};
