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
  'japan.html',
  'argentina.html',
  'united-kingdom.html',
  'philippines.html',
  'armenia.html',
  'australia.html',
  'austria.html',
  'bahamas.html',
  'barbados.html',
  'belarus.html',
  'belgium.html',
  'bolivia.html',
  'bosnia-and-herzegovina.html',
  'brazil.html',
  'bulgaria.html',
  'cambodia.html',
  'chile.html',
  'china.html',
  'colombia.html',
  'costa-rica.html',
  'croatia.html',
  'cuba.html',
  'cyprus.html',
  'czech-republic.html',
  'denmark.html',
  'dominican-republic.html',
  'ecuador.html',
  'egypt.html',
  'el-salvador.html',
  'estonia.html',
  'finland.html',
  'france.html',
  'georgia.html',
  'germany.html',
  'ghana.html',
  'greece.html',
  'guam.html',
  'guatemala.html',
  'honduras.html',
  'hong-kong.html',
  'hungary.html',
  'iceland.html',
  'indonesia.html',
  'ireland.html',
  'israel.html',
  'italy.html',
  'jamaica.html',
  'kenya.html',
  'latvia.html',
  'lebanon.html',
  'lithuania.html',
  'luxembourg.html',
  'malaysia.html',
  'malta.html',
  'mexico.html',
  'moldova.html',
  'monaco.html',
  'montenegro.html',
  'morocco.html',
  'netherlands.html',
  'new-zealand.html',
  'nigeria.html',
  'norway.html',
  'pakistan.html',
  'panama.html',
  'paraguay.html',
  'peru.html',
  'poland.html',
  'portugal.html',
  'puerto-rico.html',
  'romania.html',
  'russia.html',
  'saudi-arabia.html',
  'scotland.html',
  'serbia.html',
  'singapore.html',
  'slovakia.html',
  'slovenia.html',
  'south-africa.html',
  'south-korea.html',
  'spain.html',
  'sri-lanka.html',
  'sweden.html',
  'switzerland.html',
  'taiwan.html',
  'thailand.html',
  'trinidad-and-tobago.html',
  'tunisia.html',
  'turkey.html',
  'ukraine.html',
  'united-arab-emirates.html',
  'uruguay.html',
  'venezuela.html',
  'vietnam.html',
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
  
  // Replace actual text content in elements with data-i18n-key attributes
  Object.entries(translations).forEach(([key, value]) => {
    // Pattern: finds elements with data-i18n-key="[key]" and replaces text content
    // Handles: <tag ... data-i18n-key="key" ... >TEXT</tag>
    // Allows for other attributes and nested tags
    const pattern = new RegExp(`(<[^>]*data-i18n-key="${key}"[^>]*)>([^<]*)<(\\/[^>]+>)`, 'g');
    result = result.replace(pattern, (match, openTag, oldText, closeTag) => {
      return `${openTag}>${value}<${closeTag}`;
    });
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
  else if (result.includes('argentina.html')) pageName = 'argentina.html';
  else if (result.includes('united-kingdom.html')) pageName = 'united-kingdom.html';
  else if (result.includes('philippines.html')) pageName = 'philippines.html';
  else if (result.includes('armenia.html')) pageName = 'armenia.html';
  else if (result.includes('australia.html')) pageName = 'australia.html';
  else if (result.includes('austria.html')) pageName = 'austria.html';
  else if (result.includes('bahamas.html')) pageName = 'bahamas.html';
  else if (result.includes('barbados.html')) pageName = 'barbados.html';
  else if (result.includes('belarus.html')) pageName = 'belarus.html';
  else if (result.includes('belgium.html')) pageName = 'belgium.html';
  else if (result.includes('bolivia.html')) pageName = 'bolivia.html';
  else if (result.includes('bosnia-and-herzegovina.html')) pageName = 'bosnia-and-herzegovina.html';
  else if (result.includes('brazil.html')) pageName = 'brazil.html';
  else if (result.includes('bulgaria.html')) pageName = 'bulgaria.html';
  else if (result.includes('cambodia.html')) pageName = 'cambodia.html';
  else if (result.includes('chile.html')) pageName = 'chile.html';
  else if (result.includes('china.html')) pageName = 'china.html';
  else if (result.includes('colombia.html')) pageName = 'colombia.html';
  else if (result.includes('costa-rica.html')) pageName = 'costa-rica.html';
  else if (result.includes('croatia.html')) pageName = 'croatia.html';
  else if (result.includes('cuba.html')) pageName = 'cuba.html';
  else if (result.includes('cyprus.html')) pageName = 'cyprus.html';
  else if (result.includes('czech-republic.html')) pageName = 'czech-republic.html';
  else if (result.includes('denmark.html')) pageName = 'denmark.html';
  else if (result.includes('dominican-republic.html')) pageName = 'dominican-republic.html';
  else if (result.includes('ecuador.html')) pageName = 'ecuador.html';
  else if (result.includes('egypt.html')) pageName = 'egypt.html';
  else if (result.includes('el-salvador.html')) pageName = 'el-salvador.html';
  else if (result.includes('estonia.html')) pageName = 'estonia.html';
  else if (result.includes('finland.html')) pageName = 'finland.html';
  else if (result.includes('france.html')) pageName = 'france.html';
  else if (result.includes('georgia.html')) pageName = 'georgia.html';
  else if (result.includes('germany.html')) pageName = 'germany.html';
  else if (result.includes('ghana.html')) pageName = 'ghana.html';
  else if (result.includes('greece.html')) pageName = 'greece.html';
  else if (result.includes('guam.html')) pageName = 'guam.html';
  else if (result.includes('guatemala.html')) pageName = 'guatemala.html';
  else if (result.includes('honduras.html')) pageName = 'honduras.html';
  else if (result.includes('hong-kong.html')) pageName = 'hong-kong.html';
  else if (result.includes('hungary.html')) pageName = 'hungary.html';
  else if (result.includes('iceland.html')) pageName = 'iceland.html';
  else if (result.includes('indonesia.html')) pageName = 'indonesia.html';
  else if (result.includes('ireland.html')) pageName = 'ireland.html';
  else if (result.includes('israel.html')) pageName = 'israel.html';
  else if (result.includes('italy.html')) pageName = 'italy.html';
  else if (result.includes('jamaica.html')) pageName = 'jamaica.html';
  else if (result.includes('kenya.html')) pageName = 'kenya.html';
  else if (result.includes('latvia.html')) pageName = 'latvia.html';
  else if (result.includes('lebanon.html')) pageName = 'lebanon.html';
  else if (result.includes('lithuania.html')) pageName = 'lithuania.html';
  else if (result.includes('luxembourg.html')) pageName = 'luxembourg.html';
  else if (result.includes('malaysia.html')) pageName = 'malaysia.html';
  else if (result.includes('malta.html')) pageName = 'malta.html';
  else if (result.includes('mexico.html')) pageName = 'mexico.html';
  else if (result.includes('moldova.html')) pageName = 'moldova.html';
  else if (result.includes('monaco.html')) pageName = 'monaco.html';
  else if (result.includes('montenegro.html')) pageName = 'montenegro.html';
  else if (result.includes('morocco.html')) pageName = 'morocco.html';
  else if (result.includes('netherlands.html')) pageName = 'netherlands.html';
  else if (result.includes('new-zealand.html')) pageName = 'new-zealand.html';
  else if (result.includes('nigeria.html')) pageName = 'nigeria.html';
  else if (result.includes('norway.html')) pageName = 'norway.html';
  else if (result.includes('pakistan.html')) pageName = 'pakistan.html';
  else if (result.includes('panama.html')) pageName = 'panama.html';
  else if (result.includes('paraguay.html')) pageName = 'paraguay.html';
  else if (result.includes('peru.html')) pageName = 'peru.html';
  else if (result.includes('poland.html')) pageName = 'poland.html';
  else if (result.includes('portugal.html')) pageName = 'portugal.html';
  else if (result.includes('puerto-rico.html')) pageName = 'puerto-rico.html';
  else if (result.includes('romania.html')) pageName = 'romania.html';
  else if (result.includes('russia.html')) pageName = 'russia.html';
  else if (result.includes('saudi-arabia.html')) pageName = 'saudi-arabia.html';
  else if (result.includes('scotland.html')) pageName = 'scotland.html';
  else if (result.includes('serbia.html')) pageName = 'serbia.html';
  else if (result.includes('singapore.html')) pageName = 'singapore.html';
  else if (result.includes('slovakia.html')) pageName = 'slovakia.html';
  else if (result.includes('slovenia.html')) pageName = 'slovenia.html';
  else if (result.includes('south-africa.html')) pageName = 'south-africa.html';
  else if (result.includes('south-korea.html')) pageName = 'south-korea.html';
  else if (result.includes('spain.html')) pageName = 'spain.html';
  else if (result.includes('sri-lanka.html')) pageName = 'sri-lanka.html';
  else if (result.includes('sweden.html')) pageName = 'sweden.html';
  else if (result.includes('switzerland.html')) pageName = 'switzerland.html';
  else if (result.includes('taiwan.html')) pageName = 'taiwan.html';
  else if (result.includes('thailand.html')) pageName = 'thailand.html';
  else if (result.includes('trinidad-and-tobago.html')) pageName = 'trinidad-and-tobago.html';
  else if (result.includes('tunisia.html')) pageName = 'tunisia.html';
  else if (result.includes('turkey.html')) pageName = 'turkey.html';
  else if (result.includes('ukraine.html')) pageName = 'ukraine.html';
  else if (result.includes('united-arab-emirates.html')) pageName = 'united-arab-emirates.html';
  else if (result.includes('uruguay.html')) pageName = 'uruguay.html';
  else if (result.includes('venezuela.html')) pageName = 'venezuela.html';
  else if (result.includes('vietnam.html')) pageName = 'vietnam.html';
  
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
