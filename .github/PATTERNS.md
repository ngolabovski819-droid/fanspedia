# Code Patterns Reference

## Frontend JavaScript Patterns

### API Call Pattern
```javascript
async function performSearch(resetPage = true, append = false) {
  if (isLoading || (!hasMore && !resetPage)) return;
  isLoading = true;
  
  try {
    if (resetPage) currentPage = 1;
    
    const apiUrl = `/api/search?q=${encodeURIComponent(q)}&page=${currentPage}&page_size=${pageSize}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    // Process data...
    
    currentPage++;
    hasMore = data.length === pageSize;
  } catch (error) {
    console.error('Search error:', error);
  } finally {
    isLoading = false;
  }
}
```

### Image Optimization Pattern
```javascript
// Generate responsive image sources
function buildResponsiveSources(originalUrl) {
  const widths = [144, 240, 320, 480, 720];
  const srcset = widths
    .map(w => `${proxyImg(originalUrl, w, Math.round(w * 4 / 3))} ${w}w`)
    .join(', ');
  const src = proxyImg(originalUrl, 320, Math.round(320 * 4 / 3));
  const sizes = '(max-width: 480px) 144px, (max-width: 768px) 240px, 320px';
  return { src, srcset, sizes };
}

// Use in HTML generation
const { src, srcset, sizes } = buildResponsiveSources(avatar);
const imgTag = `<img src="${src}" srcset="${srcset}" sizes="${sizes}" 
  loading="${isFirstCard ? 'eager' : 'lazy'}" 
  fetchpriority="${isFirstCard ? 'high' : 'low'}" />`;
```

### LocalStorage Pattern
```javascript
// Theme management
function getCurrentTheme() {
  const savedTheme = localStorage.getItem('theme');
  return savedTheme || 'light'; // Default to light
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

// Favorites management
let favorites = [];
try {
  const saved = localStorage.getItem('favorites');
  if (saved) favorites = JSON.parse(saved);
} catch (e) {
  console.error('Failed to parse favorites:', e);
  favorites = [];
}

function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}
```

### Event Delegation Pattern
```javascript
// Handle favorites across dynamically created cards
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.favorite-btn');
  if (!btn) return;
  
  const card = btn.closest('[data-id]');
  const id = card?.dataset.id;
  if (!id) return;
  
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
    btn.classList.remove('active');
  } else {
    favorites.push(id);
    btn.classList.add('active');
  }
  
  saveFavorites();
  updateFavoritesBar();
});
```

## Backend API Patterns

### Supabase REST Query Pattern
```javascript
// Build query with filters
const params = new URLSearchParams();
params.set('select', 'id,username,name,avatar');
params.set('order', 'favoritedcount.desc,subscribeprice.asc');
params.set('limit', '50');
params.set('offset', '0');

// Multi-column OR search
const terms = q.split(/[|,]/).map(s => s.trim()).filter(Boolean);
const cols = ['username', 'name', 'about'];
const expressions = terms.flatMap(term => 
  cols.map(c => `${c}.ilike.*${term}*`)
);
params.set('or', `(${expressions.join(',')})`);

// Filters
if (verified === 'true') params.set('isverified', 'eq.true');
if (bundles === 'true') params.set('bundle1_price', 'gt.0');
if (maxPrice) params.set('subscribeprice', `lte.${maxPrice}`);

const url = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?${params}`;
```

### Caching Pattern
```javascript
const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();

const cacheKey = url;
const cached = cache.get(cacheKey);
if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
  return res.status(200).json(cached.data);
}

// Fetch fresh data
const data = await fetch(url).then(r => r.json());
cache.set(cacheKey, { data, ts: Date.now() });
```

## Python Scraping Patterns

### Playwright Response Interception
```python
async def scrape_url(context, url, fieldnames, scraped_keys):
    page = await context.new_page()
    rows = []
    
    async def handle_response(response):
        try:
            if "/api2/v2/users/" in response.url:
                json_data = await response.json()
                row = extract_fields(json_data)
                key = str(row.get('id'))
                if key not in scraped_keys:
                    scraped_keys.add(key)
                    rows.append(row)
        except Exception as e:
            print(f"Response handler error: {e}")
    
    page.on("response", handle_response)
    await page.goto(url, wait_until="networkidle", timeout=60000)
    await asyncio.sleep(0.5)
    await page.close()
    
    return rows
```

### CSV Batch Writing Pattern
```python
# Append mode to preserve data on crashes
with open("temp.csv", "a", newline='', encoding="utf-8") as csvf:
    writer = csv.DictWriter(csvf, fieldnames=fieldnames)
    for row in rows:
        writer.writerow({k: row.get(k) for k in fieldnames})
```

### Retry Pattern with Exponential Backoff
```python
async def scrape_with_retries(url, retries=3, wait=0.5):
    attempt = 0
    while attempt < retries:
        try:
            result = await scrape_url(url)
            return result  # Success
        except Exception as e:
            attempt += 1
            print(f"Attempt {attempt}/{retries} failed: {e}")
            if attempt < retries:
                await asyncio.sleep(wait * 2)  # Exponential backoff
    
    # All retries failed
    return None
```

### Data Cleaning for Supabase Upload
```python
import pandas as pd
import numpy as np

# Load CSV
df = pd.read_csv('temp.csv')

# Clean NaN and infinity values
df = df.replace({np.nan: None, np.inf: None, -np.inf: None})

# Convert float IDs to integers
numeric_cols = ['id', 'subscriberscount', 'favoritedcount']
for col in numeric_cols:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')
        df[col] = df[col].fillna(0).astype('Int64')

# Normalize timestamps
df['joindate'] = df['joindate'].str.replace(r'\+0000$', '+00:00', regex=True)

# Convert to records for upload
records = df.to_dict('records')
```

## Category Management Patterns

### Adding a Category with Synonyms
```javascript
// In config/categories.js

// 1. Add to main categories array
export const categories = [
  // ... existing categories
  'new category name'
];

// 2. Add synonyms for better search
const synonymsOverrides = {
  'new category name': ['synonym1', 'synonym2', 'related term'],
  // ... existing synonyms
};

// 3. If compound (with filters)
export const compoundCategories = {
  'new-category-slug': {
    searchTerm: 'primary search term',
    synonyms: ['term1', 'term2'],
    filters: { maxPrice: 0 }, // or { verified: true, bundles: true }
    displayLabel: 'Display Name'
  }
};
```

### Version Cache Busting
```html
<!-- In index.html, category.html, categories.html -->
<!-- OLD -->
<script type="module">
  import { popularCategories } from '/config/categories.js?v=20251106-2';
</script>

<!-- NEW (increment date or number) -->
<script type="module">
  import { popularCategories } from '/config/categories.js?v=20251107-1';
</script>
```

## Testing Patterns

### Manual API Testing
```powershell
# Test basic search
curl "http://localhost:3000/api/search?q=test&page=1&page_size=10"

# Test with filters
curl "http://localhost:3000/api/search?q=goth&verified=true&bundles=true&price=20&page=1"

# Test multi-term search
curl "http://localhost:3000/api/search?q=goth|gothic|alt&page=1"
```

### Browser Console Testing
```javascript
// Test API from browser console
fetch('/api/search?q=test&page=1')
  .then(r => r.json())
  .then(data => console.table(data));

// Check localStorage
console.log('Theme:', localStorage.getItem('theme'));
console.log('Favorites:', JSON.parse(localStorage.getItem('favorites') || '[]'));

// Test category imports
import('/config/categories.js?v=20251107-1')
  .then(m => console.log('Categories:', m.categories.length));
```
