const fs = require('fs');
const path = require('path');
require('dotenv').config();
const fetch = require('node-fetch');
const { categories, categoryToSlug } = require('../config/categories.js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const BASE_URL = 'https://fanspedia.net';

const CREATOR_PAGE_SIZE = 1000; // Supabase page size per request
const SITEMAP_CHUNK_SIZE = 40000; // URLs per creator sitemap file (well below 50k cap)

// Sitemap XML namespace string including xhtml for hreflang support
const URLSET_NS = `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml"`;

function today() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

/**
 * Read all blog post slugs from content/blog/*.md frontmatter.
 * Falls back to filename (without .md) if no slug field found.
 */
function getBlogSlugs() {
  const blogDir = path.join(__dirname, '..', 'content', 'blog');
  const slugs = [];
  try {
    const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(blogDir, file), 'utf8');
      const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---/);
      if (fmMatch) {
        const slugLine = fmMatch[1].match(/^slug:\s*(.+)$/m);
        slugs.push(slugLine ? slugLine[1].trim() : file.replace('.md', ''));
      } else {
        slugs.push(file.replace('.md', ''));
      }
    }
  } catch (e) {
    console.warn('⚠️  Could not read blog slugs from content/blog/:', e.message);
  }
  return slugs;
}

/**
 * Build the three xhtml:link alternate entries (x-default, en, es) for a URL pair.
 */
function alts(enUrl, esUrl) {
  return [
    { hreflang: 'x-default', href: enUrl },
    { hreflang: 'en',        href: enUrl },
    { hreflang: 'es',        href: esUrl },
  ];
}

/**
 * Wrap a single <url> entry with optional hreflang xhtml:link annotations.
 * @param {string}   loc         - Canonical URL for this entry
 * @param {string}   changefreq
 * @param {string}   priority
 * @param {string}   lastmod
 * @param {Array}    alternates  - [{hreflang, href}, ...] — omit for no annotations
 */
function wrapUrl(loc, changefreq, priority, lastmod, alternates = []) {
  let xml = `  <url>\n    <loc>${loc}</loc>\n`;
  if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
  xml += `    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n`;
  for (const alt of alternates) {
    xml += `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}"/>\n`;
  }
  xml += `  </url>\n`;
  return xml;
}

async function fetchAllCreatorUsernames() {
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Accept: 'application/json',
    'Accept-Profile': 'public'
  };
  let offset = 0;
  let all = [];
  while (true) {
  const url = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?select=username&order=username.asc&limit=${CREATOR_PAGE_SIZE}&offset=${offset}`;
    const resp = await fetch(url, { headers });
    if (!resp.ok) throw new Error(`Supabase fetch failed: ${resp.status}`);
    const batch = await resp.json();
  if (!batch.length) break;
    all = all.concat(batch.filter(r => r.username).map(r => r.username));
  offset += CREATOR_PAGE_SIZE;
  if (offset > 500000) break; // safety guard
  }
  return all;
}

// We intentionally write sitemaps to the repository root to avoid creating a
// top-level "public/" folder that can cause Vercel to auto-detect an Output
// Directory and force the override toggle. Keeping all SEO files at the root
// ensures vercel.json rewrites work reliably without framework auto-detection.
function outputDir() {
  return path.join(__dirname, '..');
}

/**
 * English base sitemap — every URL carries hreflang xhtml:link pointing to
 * both the EN canonical and its ES mirror (plus x-default = EN).
 */
function buildBaseSitemap(blogSlugs) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset ${URLSET_NS}>\n`;
  const d = today();
  const countries = ['united-states', 'canada', 'india', 'japan'];

  // Homepage
  xml += wrapUrl(`${BASE_URL}/`, 'daily', '1.0', d,
    alts(`${BASE_URL}/`, `${BASE_URL}/es/`));

  // Categories hub
  xml += wrapUrl(`${BASE_URL}/categories/`, 'weekly', '0.9', d,
    alts(`${BASE_URL}/categories/`, `${BASE_URL}/es/categories/`));

  // Category pages
  for (const c of categories) {
    const slug = categoryToSlug(c);
    xml += wrapUrl(`${BASE_URL}/categories/${slug}/`, 'weekly', '0.8', d,
      alts(`${BASE_URL}/categories/${slug}/`, `${BASE_URL}/es/categories/${slug}/`));
  }

  // Locations hub
  xml += wrapUrl(`${BASE_URL}/locations/`, 'weekly', '0.8', d,
    alts(`${BASE_URL}/locations/`, `${BASE_URL}/es/locations/`));

  // Blog hub
  xml += wrapUrl(`${BASE_URL}/blog/`, 'weekly', '0.8', d,
    alts(`${BASE_URL}/blog/`, `${BASE_URL}/es/blog/`));

  // Blog posts (dynamically read from content/blog/*.md)
  for (const slug of blogSlugs) {
    xml += wrapUrl(`${BASE_URL}/blog/${slug}/`, 'weekly', '0.7', d,
      alts(`${BASE_URL}/blog/${slug}/`, `${BASE_URL}/es/blog/${slug}/`));
  }

  // Country pages
  for (const country of countries) {
    xml += wrapUrl(`${BASE_URL}/country/${country}/`, 'weekly', '0.8', d,
      alts(`${BASE_URL}/country/${country}/`, `${BASE_URL}/es/country/${country}/`));
  }

  xml += '</urlset>';
  return xml;
}

/**
 * Spanish base sitemap — mirrors the EN sitemap but with /es/ URLs as <loc>,
 * while hreflang xhtml:link annotations reference the same EN↔ES pairs.
 */
function buildSpanishBaseSitemap(blogSlugs) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset ${URLSET_NS}>\n`;
  const d = today();
  const countries = ['united-states', 'canada', 'india', 'japan'];

  // Spanish Homepage
  xml += wrapUrl(`${BASE_URL}/es/`, 'daily', '1.0', d,
    alts(`${BASE_URL}/`, `${BASE_URL}/es/`));

  // Spanish Categories hub
  xml += wrapUrl(`${BASE_URL}/es/categories/`, 'weekly', '0.9', d,
    alts(`${BASE_URL}/categories/`, `${BASE_URL}/es/categories/`));

  // Spanish Category pages
  for (const c of categories) {
    const slug = categoryToSlug(c);
    xml += wrapUrl(`${BASE_URL}/es/categories/${slug}/`, 'weekly', '0.8', d,
      alts(`${BASE_URL}/categories/${slug}/`, `${BASE_URL}/es/categories/${slug}/`));
  }

  // Spanish Locations hub
  xml += wrapUrl(`${BASE_URL}/es/locations/`, 'weekly', '0.8', d,
    alts(`${BASE_URL}/locations/`, `${BASE_URL}/es/locations/`));

  // Spanish Blog hub
  xml += wrapUrl(`${BASE_URL}/es/blog/`, 'weekly', '0.8', d,
    alts(`${BASE_URL}/blog/`, `${BASE_URL}/es/blog/`));

  // Spanish Blog posts
  for (const slug of blogSlugs) {
    xml += wrapUrl(`${BASE_URL}/es/blog/${slug}/`, 'weekly', '0.7', d,
      alts(`${BASE_URL}/blog/${slug}/`, `${BASE_URL}/es/blog/${slug}/`));
  }

  // Spanish Country pages
  for (const country of countries) {
    xml += wrapUrl(`${BASE_URL}/es/country/${country}/`, 'weekly', '0.8', d,
      alts(`${BASE_URL}/country/${country}/`, `${BASE_URL}/es/country/${country}/`));
  }

  xml += '</urlset>';
  return xml;
}

function buildCreatorSitemap(usernames) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  const d = today();
  for (const u of usernames) {
    xml += wrapUrl(`${BASE_URL}/${u}`, 'weekly', '0.7', d);
  }
  xml += '</urlset>';
  return xml;
}

function buildSitemapIndex(files) {
  const d = today();
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const f of files) {
    xml += `  <sitemap>\n    <loc>${BASE_URL}/${f}</loc>\n    <lastmod>${d}</lastmod>\n  </sitemap>\n`;
  }
  xml += '</sitemapindex>';
  return xml;
}

(async function main() {
  try {
    console.log('🔄 Building sitemap index and parts...');
    const outDir = outputDir();

    // Read blog slugs dynamically from content/blog/*.md
    const blogSlugs = getBlogSlugs();
    console.log(`📝 Blog posts found: ${blogSlugs.length} — ${blogSlugs.join(', ') || 'none'}`);

    // 1) Base sitemap (EN with hreflang)
    const baseXml = buildBaseSitemap(blogSlugs);
    const baseName = 'sitemap_base.xml';
    fs.writeFileSync(path.join(outDir, baseName), baseXml, 'utf8');

    // 1b) Spanish Base sitemap (ES with hreflang)
    const spanishBaseXml = buildSpanishBaseSitemap(blogSlugs);
    const spanishBaseName = 'sitemap_base_es.xml';
    fs.writeFileSync(path.join(outDir, spanishBaseName), spanishBaseXml, 'utf8');

    // 2) Creators - DISABLED: Do not index creator profiles
    const partFiles = [];  // Empty array since we're not generating creator sitemaps

    // 3) Build index file referencing base + Spanish base + parts
    const indexFiles = [baseName, spanishBaseName, ...partFiles];
    const indexXml = buildSitemapIndex(indexFiles);
    const indexName = 'sitemap-index.xml';
    fs.writeFileSync(path.join(outDir, indexName), indexXml, 'utf8');

    // Also write root sitemap.xml as index for convenience (referenced by robots.txt)
    fs.writeFileSync(path.join(outDir, 'sitemap.xml'), indexXml, 'utf8');

    console.log('✅ Sitemaps built:');
    console.log(`- ${indexName}`);
    console.log(`- sitemap.xml (copy of index)`);
    console.log(`- ${baseName}`);
    console.log(`- ${spanishBaseName}`);
    partFiles.forEach(f => console.log(`- ${f}`));
  } catch (e) {
    console.error('❌ Failed to build sitemaps:', e);
    process.exit(1);
  }
})();
