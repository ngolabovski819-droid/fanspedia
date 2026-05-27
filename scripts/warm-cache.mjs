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
// Category slugs — keep in sync with src/config/categories.ts
// ---------------------------------------------------------------------------
const CATEGORY_SLUGS = [
  'blonde', 'brunette', 'redhead', 'teen', 'milf', 'mature', 'bbw', 'curvy',
  'petite', 'busty', 'big-boobs', 'small-boobs', 'big-ass', 'latina', 'asian',
  'ebony', 'arab', 'indian', 'amateur', 'model', 'fitness', 'tattooed', 'pierced',
  'alt', 'goth', 'cosplay', 'gamer', 'nerd', 'nurse', 'teacher', 'stepsister',
  'bdsm', 'dominant', 'submissive', 'lesbian', 'bisexual', 'trans', 'non-binary',
  'solo', 'couples', 'group', 'squirting', 'anal', 'oral', 'feet', 'joi',
  'sph', 'cuckold', 'femdom', 'strapon', 'pegging', 'pregnant', 'milking',
  'nude', 'topless', 'bikini', 'lingerie', 'free', 'girl', 'boy', 'gay',
  'natural', 'big-naturals', 'natural-boobs',
];

// ---------------------------------------------------------------------------
// Country slugs — keep in sync with src/config/countries.ts
// ---------------------------------------------------------------------------
const COUNTRY_SLUGS = [
  'united-states', 'united-kingdom', 'canada', 'australia', 'germany', 'france',
  'spain', 'italy', 'netherlands', 'sweden', 'norway', 'denmark', 'finland',
  'brazil', 'argentina', 'colombia', 'mexico', 'chile', 'peru', 'venezuela',
  'russia', 'ukraine', 'poland', 'czech-republic', 'hungary', 'romania',
  'japan', 'south-korea', 'china', 'india', 'philippines', 'thailand',
  'indonesia', 'malaysia', 'singapore', 'hong-kong', 'taiwan',
  'south-africa', 'nigeria', 'kenya', 'egypt', 'morocco',
  'israel', 'turkey', 'saudi-arabia', 'uae', 'iran',
  'new-zealand', 'ireland', 'scotland', 'portugal', 'belgium',
  'switzerland', 'austria', 'greece', 'croatia', 'serbia',
  'ukraine', 'slovakia', 'bulgaria', 'latvia', 'estonia', 'lithuania',
  'puerto-rico', 'jamaica', 'cuba', 'dominican-republic', 'panama',
  'costa-rica', 'el-salvador', 'guatemala', 'honduras',
  'ecuador', 'bolivia', 'paraguay', 'uruguay',
  'guam', 'bahamas', 'barbados',
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
