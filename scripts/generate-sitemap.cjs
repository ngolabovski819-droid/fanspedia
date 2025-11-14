// Load dotenv before reading env vars
require('dotenv').config();
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
// CommonJS imports for Node.js compatibility
const fs = require('fs');
const baseUrl = 'https://fanspedia.net';
const path = require('path');
const fetch = require('node-fetch');
const { categories, categoryToSlug } = require('../config/categories.js');
function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function generateSitemap() {
  console.log('SUPABASE_URL:', SUPABASE_URL);
  const today = getCurrentDate();
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Homepage
  xml += '  <url>\n';
  xml += `    <loc>${baseUrl}/</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += '    <changefreq>daily</changefreq>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += '  </url>\n';

  // Categories hub
  xml += '  <url>\n';
  xml += `    <loc>${baseUrl}/categories/</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += '    <changefreq>weekly</changefreq>\n';
  xml += '    <priority>0.9</priority>\n';
  xml += '  </url>\n';

  // All category pages
  categories.forEach(category => {
    const slug = categoryToSlug(category);
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/categories/${slug}/</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  });

  // Fetch all creator usernames from Supabase
  let page = 1;
  const pageSize = 1000;
  let more = true;
  while (more) {
    const url = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?select=username&order=username.asc&limit=${pageSize}&offset=${(page-1)*pageSize}`;
    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: 'application/json',
      'Accept-Profile': 'public',
      Prefer: 'count=exact'
    };
    const resp = await fetch(url, { headers });
    if (!resp.ok) throw new Error(`Supabase fetch failed: ${resp.status}`);
    const creators = await resp.json();
    if (!creators.length) break;
    creators.forEach(row => {
      if (row.username) {
  xml += '  <url>\n';
  xml += `    <loc>${baseUrl}/${row.username}</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += '    <changefreq>weekly</changefreq>\n';
  xml += '    <priority>0.7</priority>\n';
  xml += '  </url>\n';
      }
    });
    more = creators.length === pageSize;
    page++;
  }

  xml += '</urlset>';
  return xml;
}

(async function main() {
  console.log('🔄 Generating sitemap...');
  try {
    const sitemap = await generateSitemap();
    const outputPath = path.join(__dirname, '..', 'sitemap.xml');
    fs.writeFileSync(outputPath, sitemap, 'utf8');
    const urlCount = (sitemap.match(/<url>/g) || []).length;
    console.log(`✅ Sitemap generated successfully!`);
    console.log(`📁 Location: ${outputPath}`);
    console.log(`📊 Total URLs: ${urlCount} (homepage + categories hub + ${categories.length} categories + creators)`);
  } catch (e) {
    console.error('❌ Error generating sitemap:', e);
  }
})();
