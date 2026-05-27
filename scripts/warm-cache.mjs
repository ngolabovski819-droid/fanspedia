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

  const ok = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok).length;
  const avg = Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length);
  const slowest = results.sort((a, b) => b.ms - a.ms).slice(0, 5);

  console.log(`\n--- Summary ---`);
  console.log(`Total: ${pages.length}  ✓ ${ok}  ✗ ${fail}  avg ${avg}ms`);
  if (slowest.length) {
    console.log(`\nSlowest 5:`);
    slowest.forEach((r) => console.log(`  ${r.ms}ms  ${r.path}`));
  }
  if (fail > 0) {
    console.log(`\nFailed pages:`);
    results.filter((r) => !r.ok).forEach((r) => console.log(`  [${r.status}] ${r.path}`));
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
