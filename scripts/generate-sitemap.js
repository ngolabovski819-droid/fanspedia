#!/usr/bin/env node
/**
 * generate-sitemap.js
 * Automatically generates sitemap.xml from the categories list and creator profiles.
 * Run: node scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { categories, categoryToSlug } from '../config/categories.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base URL of your site
const BASE_URL = 'https://bestonlyfansgirls.net';

// Supabase configuration - use process.env directly (works in Vercel and local with vercel env pull)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Fetch creator profiles from Supabase
async function fetchCreatorProfiles() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('⚠️ Supabase credentials not found. Skipping creator profiles.');
    return [];
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?select=username&order=favoritedcount.desc&limit=1000`;
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Accept-Profile': 'public'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const profiles = await response.json();
    return profiles.filter(p => p.username).map(p => p.username);
  } catch (error) {
    console.error('❌ Error fetching creator profiles:', error.message);
    return [];
  }
}

// Build sitemap XML
async function generateSitemap() {
  const today = getCurrentDate();
  const creatorUsernames = await fetchCreatorProfiles();
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Homepage
  xml += '  <url>\n';
  xml += `    <loc>${BASE_URL}/</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += '    <changefreq>daily</changefreq>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += '  </url>\n';
  
  // Categories hub
  xml += '  <url>\n';
  xml += `    <loc>${BASE_URL}/categories/</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += '    <changefreq>weekly</changefreq>\n';
  xml += '    <priority>0.9</priority>\n';
  xml += '  </url>\n';
  
  // All category pages
  categories.forEach(category => {
    const slug = categoryToSlug(category);
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/categories/${slug}/</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  });
  
  // All creator profile pages
  creatorUsernames.forEach(username => {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/creator/${encodeURIComponent(username)}/</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  
  return xml;
}

// Main execution
async function main() {
  console.log('🔄 Generating sitemap...');
  const sitemap = await generateSitemap();
  const outputPath = path.join(__dirname, '..', 'sitemap.xml');
  const publicOutputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  
  fs.writeFileSync(outputPath, sitemap, 'utf8');
  try {
    fs.writeFileSync(publicOutputPath, sitemap, 'utf8');
  } catch (e) {
    console.warn('⚠️ Failed to write public/sitemap.xml:', e.message);
  }
  
  // Count URLs in sitemap
  const urlCount = (sitemap.match(/<url>/g) || []).length;
  
  console.log(`✅ Sitemap generated successfully!`);
  console.log(`📁 Location: ${outputPath}`);
  console.log(`📁 Public copy: ${publicOutputPath}`);
  console.log(`📊 Total URLs: ${urlCount} (homepage + categories hub + ${categories.length} categories + creator profiles)`);
}

main().catch(error => {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
});
