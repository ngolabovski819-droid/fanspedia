# Categories Configuration

This directory contains the single source of truth for all OnlyFans categories used throughout the site.

## Files

### `categories.js`
Central configuration for all categories and popular categories.

**Exports:**
- `categories` - Complete list of all 60+ categories
- `popularCategories` - Top 10 categories for header dropdown/mobile drawer
- `categoryToSlug(category)` - Convert category name to URL slug (e.g., "big tits" → "big-tits")
- `slugToLabel(slug)` - Convert slug back to display label

## Usage

### In Node.js scripts (sitemap generator)
```js
import { categories, categoryToSlug } from '../config/categories.js';

categories.forEach(cat => {
  const slug = categoryToSlug(cat);
  // use slug...
});
```

### In HTML files (categories.html)
```html
<script type="module">
  import { categories, categoryToSlug } from './config/categories.js';
  
  // Render category chips
  categories.forEach(cat => {
    const slug = categoryToSlug(cat);
    // create links...
  });
</script>
```

### In header dropdowns (index.html, category.html)
```html
<script type="module">
  import { popularCategories, categoryToSlug } from './config/categories.js';
  
  // Render popular categories in dropdown
  popularCategories.forEach(cat => {
    const slug = categoryToSlug(cat);
    // create menu items...
  });
</script>
```

## Adding/Removing Categories

1. Edit `config/categories.js`
2. Add/remove from the `categories` array
3. Regenerate sitemap: `npm run sitemap`
4. Commit and push changes

**Files automatically synced:**
- ✅ categories.html (category chips)
- ✅ sitemap.xml (via `npm run sitemap`)
- ⚠️ Header dropdowns (manual update needed - see below)

## Updating Header Dropdowns

The popular categories in header dropdowns are **hardcoded** in:
- `index.html`
- `categories.html`
- `category.html`

To update them, either:
1. Manually edit the dropdown HTML in each file, or
2. Convert to dynamic rendering with `popularCategories` import

## Benefits

✅ Single source of truth  
✅ No category drift between pages  
✅ Easy to add/remove categories  
✅ Sitemap auto-generated from same list  
✅ Type-safe helpers (slug conversion)
