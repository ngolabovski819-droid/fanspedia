#!/usr/bin/env node
/**
 * generate-sitemap.js
 * Automatically generates sitemap.xml from the categories list.
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

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Build sitemap XML
function generateSitemap() {
  const today = getCurrentDate();
  
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
  
  // Creator profile page
  xml += '  <url>\n';
  xml += `    <loc>${BASE_URL}/levibabestation</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += '    <changefreq>weekly</changefreq>\n';
  xml += '    <priority>0.7</priority>\n';
  xml += '  </url>\n';
  
  xml += '</urlset>';
  
  return xml;
}

// Main execution
function main() {
  console.log('🔄 Generating sitemap...');
  const sitemap = generateSitemap();
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
  console.log(`📊 Total URLs: ${urlCount} (homepage + categories hub + ${categories.length} categories + 1 creator profile)`);
}

main();
