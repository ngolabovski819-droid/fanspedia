import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { categories, popularCategories, categoryToSlug } from '../../config/categories.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://fanspedia.net';

// Cache categories.html in memory (content never changes between deploys)
let _templateCache = null;
function getTemplate() {
  if (_templateCache) return _templateCache;
  const filePath = path.join(__dirname, '../../categories.html');
  _templateCache = fs.readFileSync(filePath, 'utf-8');
  return _templateCache;
}

function toTitleCase(str) {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function buildChipHTML(cat) {
  const slug = categoryToSlug(cat);
  const label = toTitleCase(cat);
  return `<a href="/categories/${slug}/" class="category-chip" rel="category tag"><i class="fas fa-tag" aria-hidden="true"></i>${label}</a>`;
}

function buildCollectionPageLD() {
  const allSorted = [...categories].sort((a, b) => a.localeCompare(b));
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': 'OnlyFans Categories | FansPedia',
    'description': 'Browse OnlyFans categories and find creators by niche. Explore 60+ tags from MILF to goth, BBW to feet.',
    'url': `${BASE_URL}/categories/`,
    'breadcrumb': {
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${BASE_URL}/` },
        { '@type': 'ListItem', 'position': 2, 'name': 'Categories', 'item': `${BASE_URL}/categories/` }
      ]
    },
    'mainEntity': {
      '@type': 'ItemList',
      'name': 'OnlyFans Creator Categories',
      'numberOfItems': allSorted.length,
      'itemListElement': allSorted.map((cat, i) => ({
        '@type': 'ListItem',
        'position': i + 1,
        'name': toTitleCase(cat),
        'url': `${BASE_URL}/categories/${categoryToSlug(cat)}/`
      }))
    }
  };
}

export default async function handler(req, res) {
  try {
    let html = getTemplate();

    // ── 1. CollectionPage JSON-LD ──────────────────────────
    const jsonLd = `<script type="application/ld+json">\n${JSON.stringify(buildCollectionPageLD(), null, 2)}\n</script>`;
    html = html.replace('</head>', `${jsonLd}\n</head>`);

    // ── 2. Pre-render popular chips ────────────────────────
    const popularHTML = popularCategories.map(buildChipHTML).join('');
    html = html.replace(
      '<div id="popularGrid" class="chip-grid" aria-label="Popular categories"></div>',
      `<div id="popularGrid" class="chip-grid" aria-label="Popular categories">${popularHTML}</div>`
    );

    // ── 3. Pre-render all category chips (alphabetised) ────
    const allSorted = [...categories].sort((a, b) => a.localeCompare(b));
    const allHTML = allSorted.map(buildChipHTML).join('');
    html = html.replace(
      '<div id="chipGrid" class="chip-grid" aria-label="Categories"></div>',
      `<div id="chipGrid" class="chip-grid" aria-label="Categories">${allHTML}</div>`
    );

    // ── 4. Mark body as SSR-rendered ───────────────────────
    const totalCount = popularCategories.length + allSorted.length;
    html = html.replace('<body', `<body data-ssr="true" data-categories-count="${totalCount}"`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=300');
    res.status(200).send(html);
  } catch (err) {
    console.error('[ssr/categories-hub] error:', err);
    // Fallback: serve raw static file
    const filePath = path.join(__dirname, '../../categories.html');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(fs.readFileSync(filePath, 'utf-8'));
  }
}
