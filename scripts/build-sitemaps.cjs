const fs = require('fs');
const path = require('path');
require('dotenv').config();
const fetch = require('node-fetch');
const { categories, categoryToSlug } = require('../config/categories.js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const BASE_URL = 'https://bestonlyfansgirls.net';

const CREATOR_PAGE_SIZE = 1000; // Supabase page size per request
const SITEMAP_CHUNK_SIZE = 40000; // URLs per creator sitemap file (well below 50k cap)

function today() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function wrapUrl(loc, changefreq, priority, lastmod) {
  return `  <url>\n    <loc>${loc}</loc>\n    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
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

function ensureDirs() {
  const publicDir = path.join(__dirname, '..', 'public');
  const sitemapsDir = path.join(publicDir, 'sitemaps');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  if (!fs.existsSync(sitemapsDir)) fs.mkdirSync(sitemapsDir, { recursive: true });
  return { publicDir, sitemapsDir };
}

function buildBaseSitemap() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  const d = today();
  // Homepage
  xml += wrapUrl(`${BASE_URL}/`, 'daily', '1.0', d);
  // Categories hub
  xml += wrapUrl(`${BASE_URL}/categories/`, 'weekly', '0.9', d);
  // Category pages
  for (const c of categories) {
    const slug = categoryToSlug(c);
    xml += wrapUrl(`${BASE_URL}/categories/${slug}/`, 'weekly', '0.8', d);
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
  const { publicDir, sitemapsDir } = ensureDirs();

    // 1) Base sitemap
  const baseXml = buildBaseSitemap();
  const baseName = 'sitemaps/sitemap-base.xml';
  fs.writeFileSync(path.join(publicDir, baseName), baseXml, 'utf8');

    // 2) Creators, chunk into multiple files
    const allUsernames = await fetchAllCreatorUsernames();
    console.log(`Found ${allUsernames.length} creators.`);
    const partFiles = [];
    for (let i = 0; i < allUsernames.length; i += SITEMAP_CHUNK_SIZE) {
      const chunk = allUsernames.slice(i, i + SITEMAP_CHUNK_SIZE);
  const xml = buildCreatorSitemap(chunk);
  const name = `sitemaps/sitemap-creators-${Math.floor(i / SITEMAP_CHUNK_SIZE) + 1}.xml`;
  fs.writeFileSync(path.join(publicDir, name), xml, 'utf8');
      partFiles.push(name);
    }

    // 3) Build index file referencing base + parts
    const indexFiles = [baseName, ...partFiles];
    const indexXml = buildSitemapIndex(indexFiles);
    const indexName = 'sitemap-index.xml';
    fs.writeFileSync(path.join(publicDir, indexName), indexXml, 'utf8');

    // Also write root sitemap.xml as index for convenience
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), indexXml, 'utf8');

    console.log('✅ Sitemaps built:');
    console.log(`- ${indexName}`);
    console.log(`- ${baseName}`);
    partFiles.forEach(f => console.log(`- ${f}`));
  } catch (e) {
    console.error('❌ Failed to build sitemaps:', e);
    process.exit(1);
  }
})();
