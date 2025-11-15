/**
 * Categories Page SSR - Server-Side Rendering for SEO
 * Pre-renders all category links with structured data
 */

export default async function handler(req, res) {
  try {
    // Import categories config
    const fs = require('fs');
    const path = require('path');
    
    // Read categories.js and extract arrays
    const configPath = path.join(process.cwd(), 'config', 'categories.js');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    
    // Extract categories array
    const categoriesMatch = configContent.match(/export const categories = \[([\s\S]*?)\];/);
    const popularMatch = configContent.match(/export const popularCategories = \[([\s\S]*?)\];/);
    
    if (!categoriesMatch || !popularMatch) {
      throw new Error('Could not parse categories config');
    }
    
    // Parse arrays (simple string split since they're just quoted strings)
    const categories = categoriesMatch[1]
      .split(',')
      .map(s => s.trim().replace(/['"]/g, ''))
      .filter(Boolean);
    
    const popularCategories = popularMatch[1]
      .split(',')
      .map(s => s.trim().replace(/['"]/g, ''))
      .filter(Boolean);

    // Generate structured data for categories
    const categoryListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "OnlyFans Categories",
      "description": "Browse OnlyFans creators by category",
      "numberOfItems": categories.length,
      "itemListElement": categories.map((category, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "CollectionPage",
          "@id": `https://fanspedia.net/categories/${slugify(category)}/`,
          "name": capitalizeCategory(category),
          "url": `https://fanspedia.net/categories/${slugify(category)}/`
        }
      }))
    };

    // Read the static HTML template
    const htmlPath = path.join(process.cwd(), 'categories.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Inject structured data into <head>
    const schemaScript = `<script type="application/ld+json">\n${JSON.stringify(categoryListSchema, null, 2)}\n</script>`;
    html = html.replace('</head>', `${schemaScript}\n</head>`);

    // Generate popular categories HTML
    const popularHTML = popularCategories.map(category => {
      const slug = slugify(category);
      const label = capitalizeCategory(category);
      return `<a href="/categories/${slug}/" class="category-chip" rel="category tag"><i class="fas fa-tag" aria-hidden="true"></i>${escapeHtml(label)}</a>`;
    }).join('\n        ');

    // Generate all categories HTML
    const allCategoriesHTML = categories.map(category => {
      const slug = slugify(category);
      const label = capitalizeCategory(category);
      return `<a href="/categories/${slug}/" class="category-chip" rel="category tag"><i class="fas fa-tag" aria-hidden="true"></i>${escapeHtml(label)}</a>`;
    }).join('\n        ');

    // Inject popular categories
    html = html.replace(
      '<div id="popularGrid" class="chip-grid" aria-label="Popular categories"></div>',
      `<div id="popularGrid" class="chip-grid" aria-label="Popular categories">\n        ${popularHTML}\n      </div>`
    );

    // Inject all categories
    html = html.replace(
      '<div id="chipGrid" class="chip-grid" aria-label="Categories"></div>',
      `<div id="chipGrid" class="chip-grid" aria-label="Categories">\n        ${allCategoriesHTML}\n      </div>`
    );

    // Add SSR flag
    html = html.replace(
      '<body>',
      `<body data-ssr="true" data-categories-count="${categories.length}">`
    );

    // Send HTML with proper caching headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('X-SSR-Categories', 'true');
    res.status(200).send(html);

  } catch (error) {
    console.error('Categories SSR error:', error);
    
    // Fallback to static HTML on error
    const fs = require('fs');
    const path = require('path');
    const htmlPath = path.join(process.cwd(), 'categories.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-SSR-Error', error.message);
    res.status(200).send(html);
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function slugify(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function capitalizeCategory(str) {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
