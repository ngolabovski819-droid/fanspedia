/**
 * Build Spanish Pages - Pre-render /es/ versions with translations
 * Reads English HTML files, applies Spanish translations, outputs to /es/ folder
 */

const fs = require('fs');
const path = require('path');

// Import translations
const enTranslations = require('../config/translations/en.json');
const esTranslations = require('../config/translations/es.json');

const ROOT_DIR = path.join(__dirname, '..');
const ES_DIR = path.join(ROOT_DIR, 'es');

// Pages to translate
const PAGES = [
  'index.html',
  'categories.html',
  'category.html',
  'locations.html',
  'near-me.html',
  'wishlist.html',
  'creator.html'
];

const COUNTRY_PAGES = [
  'united-states.html',
  'canada.html',
  'india.html',
  'japan.html'
];

// Ensure /es directory exists
if (!fs.existsSync(ES_DIR)) {
  fs.mkdirSync(ES_DIR, { recursive: true });
  console.log(`✅ Created /es directory`);
}

/**
 * Build hreflang tags for a page
 */
function buildHreflang(pageName, isSpanish = false) {
  const baseUrl = 'https://fanspedia.net';
  const pageUrl = pageName === 'index.html' ? '/' : `/${pageName.replace('.html', '')}/`;
  
  if (isSpanish) {
    return `  <link rel="alternate" hreflang="en" href="${baseUrl}${pageUrl}" />
  <link rel="alternate" hreflang="es" href="${baseUrl}/es${pageUrl}" />
  <link rel="alternate" hreflang="x-default" href="${baseUrl}${pageUrl}" />`;
  } else {
    return `  <link rel="alternate" hreflang="en" href="${baseUrl}${pageUrl}" />
  <link rel="alternate" hreflang="es" href="${baseUrl}/es${pageUrl}" />
  <link rel="alternate" hreflang="x-default" href="${baseUrl}${pageUrl}" />`;
  }
}

/**
 * Translate HTML content
 */
function translateHTML(html, lang = 'es') {
  const translations = lang === 'es' ? esTranslations : enTranslations;
  let result = html;
  
  // Replace data-i18n-key attributes
  result = result.replace(/data-i18n-key="([^"]+)"/g, (match, key) => {
    return `data-i18n-key="${key}" data-translated="true"`;
  });
  
  // Replace placeholder translations
  Object.entries(translations).forEach(([key, value]) => {
    // This is handled by i18n.js on client side, just mark it
  });
  
  // Update lang attribute (fix regex to work in multiline string)
  result = result.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);
  
  // Add hreflang tags before </head> 
  // Determine page name from the content
  let pageName = 'index.html';
  if (result.includes('categories.html')) pageName = 'categories.html';
  else if (result.includes('category.html')) pageName = 'category.html';
  else if (result.includes('locations.html')) pageName = 'locations.html';
  else if (result.includes('near-me.html')) pageName = 'near-me.html';
  else if (result.includes('wishlist.html')) pageName = 'wishlist.html';
  else if (result.includes('creator.html')) pageName = 'creator.html';
  else if (result.includes('united-states.html')) pageName = 'united-states.html';
  else if (result.includes('canada.html')) pageName = 'canada.html';
  else if (result.includes('india.html')) pageName = 'india.html';
  else if (result.includes('japan.html')) pageName = 'japan.html';
  
  const hreflang = buildHreflang(pageName, lang === 'es');
  result = result.replace('</head>', `  ${hreflang}\n</head>`);
  
  return result;
}

/**
 * Add JavaScript to set language on page load
 */
function addLangScript(html, lang = 'es') {
  const langScript = `
  <script>
    // Set language before i18n loads
    localStorage.setItem('fanspedia_lang', '${lang}');
  </script>`;
  
  // Insert after opening body tag
  return html.replace('<body>', `<body>${langScript}`);
}

/**
 * Process and save a translated page
 */
function processPage(pageName, isCountryPage = false) {
  const pagePath = path.join(ROOT_DIR, pageName);
  
  if (!fs.existsSync(pagePath)) {
    console.warn(`⚠️  Page not found: ${pageName}`);
    return false;
  }
  
  try {
    let html = fs.readFileSync(pagePath, 'utf-8');
    
    // Apply translations
    let spanishHtml = translateHTML(html, 'es');
    spanishHtml = addLangScript(spanishHtml, 'es');
    
    // Determine output path
    const outputDir = isCountryPage ? ES_DIR : ROOT_DIR;
    const outputPath = path.join(outputDir, pageName);
    
    // For country pages, also create /es/ directory structure
    if (isCountryPage) {
      fs.writeFileSync(outputPath, spanishHtml, 'utf-8');
    } else {
      // For main pages, write to /es/ folder
      const esPagePath = path.join(ES_DIR, pageName);
      fs.writeFileSync(esPagePath, spanishHtml, 'utf-8');
      console.log(`✅ Generated: ${esPagePath}`);
    }
    
    return true;
  } catch (err) {
    console.error(`❌ Error processing ${pageName}:`, err.message);
    return false;
  }
}

/**
 * Main build function
 */
function main() {
  console.log('\n🌍 Building Spanish Pages...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  // Process main pages
  console.log('📄 Processing main pages:');
  PAGES.forEach(page => {
    if (processPage(page)) {
      successCount++;
    } else {
      failCount++;
    }
  });
  
  // Process country pages
  console.log('\n🗺️  Processing country pages:');
  COUNTRY_PAGES.forEach(page => {
    if (processPage(page, true)) {
      successCount++;
    } else {
      failCount++;
    }
  });
  
  // Summary
  console.log(`\n✨ Build Complete!`);
  console.log(`✅ ${successCount} pages generated`);
  if (failCount > 0) {
    console.log(`❌ ${failCount} pages failed`);
  }
  console.log(`📁 Spanish pages available at: /es/\n`);
}

main();
