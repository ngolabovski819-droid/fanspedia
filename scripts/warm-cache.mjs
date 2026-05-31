/**
 * Post-deploy ISR cache warmer.
 * Run after every Vercel deployment to pre-populate all ISR pages so the
 * first real visitor never has to wait for a cold Supabase query.
 *
 * Usage:
 *   node scripts/warm-cache.mjs                  # warms prod (fanspedia.net)
 *   node scripts/warm-cache.mjs http://localhost:3000  # warms local dev
 *
 * Fetches pages sequentially (1 at a time) so Supabase only sees 1 concurrent
 * query at a time. Each page triggers ISR generation on first hit.
 */

import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import { resolve } from 'path';

const BASE = process.argv[2] ?? 'https://fanspedia.net';
const DELAY_MS = 400; // pause between requests — be gentle on Supabase
const TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Category slugs — generated from src/config/categories.ts RAW_LABELS
// Run: node -e "const c=require('./src/config/categories.ts');console.log(c.ALL_CATEGORY_SLUGS)"
// to regenerate if categories change.
// ---------------------------------------------------------------------------
const CATEGORY_SLUGS = [
  'nude', 'reddit', 'models', 'sex', 'gay', 'anal', 'feet', 'twitter', 'trans',
  'lesbian', 'squirt', 'couple', 'milf', 'tiktok', 'girl', 'big-tits', 'blowjobs',
  'boobs', 'sextape', 'creampie', 'joi', 'threesome', '18-years-old', 'shemale',
  'bbc', 'tits', 'ebony', 'pornhub', 'footjob', 'foot-fetish', 'dick-ratings',
  'bbw', 'mature', 'teacher', 'pussy', 'cuckold', 'big-ass', 'squirting', 'hottest',
  'best', 'amateur', 'blonde', 'instagram', 'pawg', 'gangbang', 'redhead', 'male',
  'vip', 'famous', 'twins', 'ass', 'deepthroat', 'pregnant', 'handjob', 'facial',
  'asmr', 'pegging', 'no-ppv', 'nurse', 'smoking-fetish', 'big-natural-boobs',
  'olympian', 'pussy-play', 'hentai', 'goth-free',
];

// ---------------------------------------------------------------------------
// Country slugs — from src/config/countries.ts COUNTRIES keys
// ---------------------------------------------------------------------------
const COUNTRY_SLUGS = [
  'united-states', 'canada', 'argentina', 'united-kingdom', 'philippines',
  'india', 'japan', 'armenia', 'australia', 'austria', 'bahamas', 'barbados',
  'belarus', 'belgium', 'bolivia', 'bosnia-and-herzegovina', 'brazil', 'bulgaria',
  'cambodia', 'chile', 'china', 'colombia', 'costa-rica', 'croatia', 'cuba',
  'cyprus', 'czech-republic', 'denmark', 'dominican-republic', 'ecuador', 'egypt',
  'el-salvador', 'estonia', 'finland', 'france', 'georgia', 'germany', 'ghana',
  'greece', 'guam', 'guatemala', 'honduras', 'hong-kong', 'hungary', 'iceland',
  'indonesia', 'ireland', 'israel', 'italy', 'jamaica', 'kenya', 'latvia',
  'lebanon', 'lithuania', 'luxembourg', 'malaysia', 'malta', 'mexico', 'moldova',
  'monaco', 'montenegro', 'morocco', 'netherlands', 'new-zealand', 'nigeria',
  'norway', 'pakistan', 'panama', 'paraguay', 'peru', 'poland', 'portugal',
  'puerto-rico', 'romania', 'russia', 'saudi-arabia', 'scotland', 'serbia',
  'singapore', 'slovakia', 'slovenia', 'south-africa', 'south-korea', 'spain',
  'sri-lanka', 'sweden', 'switzerland', 'taiwan', 'thailand', 'trinidad-and-tobago',
  'tunisia', 'turkey', 'ukraine', 'united-arab-emirates', 'uruguay', 'venezuela',
  'vietnam',
];

// ---------------------------------------------------------------------------
// Country terms — mirrors src/config/countries.ts so we can build /api/search URLs
// ---------------------------------------------------------------------------
const COUNTRY_TERMS = {
  'united-states':          ['united states', 'usa', 'america', 'american'],
  'canada':                 ['canada', 'canadian'],
  'argentina':              ['argentina', 'argentinian', 'argentine', 'buenos aires'],
  'united-kingdom':         ['united kingdom', 'uk', 'british', 'england', 'english', 'wales', 'welsh', 'scotland', 'scottish'],
  'philippines':            ['philippines', 'philippine', 'filipina', 'filipinas'],
  'india':                  ['india', 'indian'],
  'japan':                  ['japan', 'japanese'],
  'armenia':                ['armenia', 'armenian', 'yerevan'],
  'australia':              ['australia', 'australian', 'sydney', 'melbourne', 'brisbane'],
  'austria':                ['austria', 'austrian', 'vienna', 'wien'],
  'bahamas':                ['bahamas', 'bahamian', 'nassau'],
  'barbados':               ['barbados', 'barbadian', 'bridgetown'],
  'belarus':                ['belarus', 'belarusian', 'minsk'],
  'belgium':                ['belgium', 'belgian', 'brussels'],
  'bolivia':                ['bolivia', 'bolivian', 'la paz', 'santa cruz'],
  'bosnia-and-herzegovina': ['bosnia', 'bosnian', 'herzegovina', 'sarajevo'],
  'brazil':                 ['brazil', 'brazilian', 'brasil', 'rio de janeiro', 'sao paulo'],
  'bulgaria':               ['bulgaria', 'bulgarian', 'sofia'],
  'cambodia':               ['cambodia', 'cambodian', 'phnom penh'],
  'chile':                  ['chile', 'chilean', 'santiago', 'chilena'],
  'china':                  ['china', 'chinese', 'beijing', 'shanghai'],
  'colombia':               ['colombia', 'colombian', 'bogota', 'medellin', 'colombiana'],
  'costa-rica':             ['costa rica', 'costa rican', 'san jose', 'tica'],
  'croatia':                ['croatia', 'croatian', 'zagreb'],
  'cuba':                   ['cuba', 'cuban', 'havana', 'cubana'],
  'cyprus':                 ['cyprus', 'cypriot', 'nicosia'],
  'czech-republic':         ['czech', 'czech republic', 'czechia', 'prague'],
  'denmark':                ['denmark', 'danish', 'copenhagen'],
  'dominican-republic':     ['dominican', 'dominican republic', 'santo domingo', 'dominicana'],
  'ecuador':                ['ecuador', 'ecuadorian', 'quito', 'guayaquil', 'ecuatoriana'],
  'egypt':                  ['egypt', 'egyptian', 'cairo', 'alexandria'],
  'el-salvador':            ['el salvador', 'salvadoran', 'san salvador'],
  'estonia':                ['estonia', 'estonian', 'tallinn'],
  'finland':                ['finland', 'finnish', 'helsinki'],
  'france':                 ['france', 'french', 'paris'],
  'georgia':                ['georgia country', 'georgian', 'tbilisi'],
  'germany':                ['germany', 'german', 'berlin', 'deutschland'],
  'ghana':                  ['ghana', 'ghanaian', 'accra'],
  'greece':                 ['greece', 'greek', 'athens'],
  'guam':                   ['guam', 'guamanian', 'chamorro'],
  'guatemala':              ['guatemala', 'guatemalan'],
  'honduras':               ['honduras', 'honduran', 'tegucigalpa'],
  'hong-kong':              ['hong kong', 'hongkong', 'hk'],
  'hungary':                ['hungary', 'hungarian', 'budapest'],
  'iceland':                ['iceland', 'icelandic', 'reykjavik'],
  'indonesia':              ['indonesia', 'indonesian', 'jakarta', 'bali'],
  'ireland':                ['ireland', 'irish', 'dublin'],
  'israel':                 ['israel', 'israeli', 'tel aviv'],
  'italy':                  ['italy', 'italian', 'rome', 'milan', 'italiana'],
  'jamaica':                ['jamaica', 'jamaican', 'kingston'],
  'kenya':                  ['kenya', 'kenyan', 'nairobi'],
  'latvia':                 ['latvia', 'latvian', 'riga'],
  'lebanon':                ['lebanon', 'lebanese', 'beirut'],
  'lithuania':              ['lithuania', 'lithuanian', 'vilnius'],
  'luxembourg':             ['luxembourg', 'luxembourgish'],
  'malaysia':               ['malaysia', 'malaysian', 'kuala lumpur'],
  'malta':                  ['malta', 'maltese', 'valletta'],
  'mexico':                 ['mexico', 'mexican', 'mexico city', 'guadalajara', 'mexicana'],
  'moldova':                ['moldova', 'moldovan', 'chisinau'],
  'monaco':                 ['monaco', 'monegasque', 'monte carlo'],
  'montenegro':             ['montenegro', 'montenegrin', 'podgorica'],
  'morocco':                ['morocco', 'moroccan', 'casablanca', 'marrakech'],
  'netherlands':            ['netherlands', 'dutch', 'holland', 'amsterdam'],
  'new-zealand':            ['new zealand', 'nz', 'kiwi', 'auckland'],
  'nigeria':                ['nigeria', 'nigerian', 'lagos', 'abuja'],
  'norway':                 ['norway', 'norwegian', 'oslo'],
  'pakistan':               ['pakistan', 'pakistani', 'karachi', 'lahore'],
  'panama':                 ['panama', 'panamanian', 'panama city'],
  'paraguay':               ['paraguay', 'paraguayan', 'asuncion'],
  'peru':                   ['peru', 'peruvian', 'lima', 'peruana'],
  'poland':                 ['poland', 'polish', 'warsaw', 'krakow'],
  'portugal':               ['portugal', 'portuguese', 'lisbon', 'porto'],
  'puerto-rico':            ['puerto rico', 'puerto rican', 'san juan', 'boricua'],
  'romania':                ['romania', 'romanian', 'bucharest'],
  'russia':                 ['russia', 'russian', 'moscow', 'saint petersburg'],
  'saudi-arabia':           ['saudi arabia', 'saudi', 'riyadh', 'jeddah'],
  'scotland':               ['scotland', 'scottish', 'edinburgh', 'glasgow'],
  'serbia':                 ['serbia', 'serbian', 'belgrade'],
  'singapore':              ['singapore', 'singaporean'],
  'slovakia':               ['slovakia', 'slovak', 'bratislava'],
  'slovenia':               ['slovenia', 'slovenian', 'ljubljana'],
  'south-africa':           ['south africa', 'south african', 'cape town', 'johannesburg'],
  'south-korea':            ['south korea', 'korean', 'seoul', 'kpop'],
  'spain':                  ['spain', 'spanish', 'madrid', 'barcelona'],
  'sri-lanka':              ['sri lanka', 'sri lankan', 'colombo'],
  'sweden':                 ['sweden', 'swedish', 'stockholm'],
  'switzerland':            ['switzerland', 'swiss', 'zurich', 'geneva'],
  'taiwan':                 ['taiwan', 'taiwanese', 'taipei'],
  'thailand':               ['thailand', 'thai', 'bangkok'],
  'trinidad-and-tobago':    ['trinidad', 'tobago', 'trinidadian'],
  'tunisia':                ['tunisia', 'tunisian', 'tunis'],
  'turkey':                 ['turkey', 'turkish', 'istanbul', 'ankara'],
  'ukraine':                ['ukraine', 'ukrainian', 'kyiv', 'odessa'],
  'united-arab-emirates':   ['uae', 'emirates', 'dubai', 'abu dhabi'],
  'uruguay':                ['uruguay', 'uruguayan', 'montevideo'],
  'venezuela':              ['venezuela', 'venezuelan', 'caracas'],
  'vietnam':                ['vietnam', 'vietnamese', 'ho chi minh', 'hanoi'],
};

// Popular category terms — mirrors synonymOverrides in src/config/categories.ts
const POPULAR_CAT_TERMS = {
  'milf':       ['milf', 'mom', 'hot mom', 'mature mom', 'cougar'],
  'lesbian':    ['lesbian', 'girls only', 'wlw', 'sapphic'],
  'trans':      ['trans', 'transgender', 'trans woman'],
  'feet':       ['feet', 'foot', 'toes', 'foot fetish'],
  'bbw':        ['bbw', 'plus size', 'curvy', 'thick'],
  'big-tits':   ['big tits', 'big boobs', 'large breasts'],
  'amateur':    ['amateur', 'homemade'],
  'ebony':      ['ebony', 'black', 'melanin'],
  'blonde':     ['blonde'],
  'gay':        ['gay', 'men', 'mlm'],
  'anal':       ['anal', 'backdoor'],
  'couple':     ['couple', 'duo', 'pair'],
  'mature':     ['mature', 'cougar', 'older'],
  'ass':        ['ass', 'booty', 'butt'],
  'big-ass':    ['big ass', 'big butt', 'booty', 'thick', 'phat'],
};

/** Build a /api/search URL from a terms array */
function apiSearchUrl(terms, extra = {}) {
  const p = new URLSearchParams({
    page: '0',
    page_size: '24',
    sort: 'popular',
    category_terms: terms.join(','),
    skip_location_filter: '1',
    ...extra,
  });
  return `/api/search?${p.toString()}`;
}

// All API URLs to warm: one per country + one per popular category
const apiWarmUrls = [
  ...Object.values(COUNTRY_TERMS).map((terms) => apiSearchUrl(terms)),
  ...Object.values(POPULAR_CAT_TERMS).map((terms) => apiSearchUrl(terms)),
];

// Deduplicate
const uniqueCategories = [...new Set(CATEGORY_SLUGS)];
const uniqueCountries = [...new Set(COUNTRY_SLUGS)];

const pages = [
  '/',
  '/categories/',
  '/locations/',
  '/blog/',
  '/search/',
  ...uniqueCategories.map((s) => `/categories/${s}/`),
  ...uniqueCountries.map((s) => `/country/${s}/`),
];

// ---------------------------------------------------------------------------

async function fetchPage(path) {
  const url = `${BASE}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'FansPedia-CacheWarmer/1.0' },
    });
    clearTimeout(timer);
    const ms = Date.now() - start;
    const status = res.status;
    const label = status === 200 ? '✓' : '✗';
    console.log(`${label} ${status}  ${ms.toString().padStart(5)}ms  ${path}`);
    return { path, status, ms, ok: res.ok };
  } catch (err) {
    clearTimeout(timer);
    const ms = Date.now() - start;
    const msg = err?.name === 'AbortError' ? 'TIMEOUT' : String(err?.message ?? err);
    console.log(`✗ ERR  ${ms.toString().padStart(5)}ms  ${path}  (${msg})`);
    return { path, status: 0, ms, ok: false };
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`\nWarming ${pages.length} pages on ${BASE}\n`);
  const results = [];
  for (const page of pages) {
    const r = await fetchPage(page);
    results.push(r);
    if (DELAY_MS > 0) await sleep(DELAY_MS);
  }

  // -------------------------------------------------------------------------
  // Phase 2: warm /api/search responses so Vercel CDN caches them before
  // real visitors arrive. This prevents the 10s+ cold-start on the first
  // visitor after a deploy or after the CDN cache expires.
  // -------------------------------------------------------------------------
  console.log(`\nWarming ${apiWarmUrls.length} /api/search responses on ${BASE}\n`);
  const apiResults = [];
  for (const url of apiWarmUrls) {
    const r = await fetchPage(url);
    apiResults.push(r);
    if (DELAY_MS > 0) await sleep(DELAY_MS);
  }

  const allResults = [...results, ...apiResults];
  const ok = allResults.filter((r) => r.ok).length;
  const fail = allResults.filter((r) => !r.ok).length;
  const avg = Math.round(allResults.reduce((s, r) => s + r.ms, 0) / allResults.length);
  const slowest = [...allResults].sort((a, b) => b.ms - a.ms).slice(0, 5);

  console.log(`\n--- Summary ---`);
  console.log(`Total: ${allResults.length}  ✓ ${ok}  ✗ ${fail}  avg ${avg}ms`);
  if (slowest.length) {
    console.log(`\nSlowest 5:`);
    slowest.forEach((r) => console.log(`  ${r.ms}ms  ${r.path}`));
  }
  if (fail > 0) {
    console.log(`\nFailed pages:`);
    allResults.filter((r) => !r.ok).forEach((r) => console.log(`  [${r.status}] ${r.path}`));
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
