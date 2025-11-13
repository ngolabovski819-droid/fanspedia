/**
 * Homepage SSR - Server-Side Rendering for SEO
 * Pre-renders top 50 creators with structured data for search engines
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

export default async function handler(req, res) {
  try {
    // Fetch top 50 creators (verified, sorted by favorites)
    const params = new URLSearchParams({
      select: 'id,username,name,about,avatar,subscribeprice,favoritedcount,subscriberscount,isverified,bundle1_price',
      isverified: 'eq.true',
      order: 'favoritedcount.desc,subscribeprice.asc',
      limit: '50'
    });

    const url = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?${params}`;
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Accept-Profile': 'public'
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    const creators = await response.json();

    // Generate structured data for ItemList (rich snippets)
    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Top OnlyFans Creators",
      "description": "Best verified OnlyFans models and creators",
      "numberOfItems": creators.length,
      "itemListElement": creators.map((creator, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Person",
          "@id": `https://bestonlyfansgirls.net/c/${creator.id}/${slugify(creator.username)}`,
          "name": creator.name || creator.username,
          "url": `https://bestonlyfansgirls.net/c/${creator.id}/${slugify(creator.username)}`,
          "image": proxyImg(creator.avatar, 320, 427),
          "description": creator.about ? creator.about.substring(0, 200) : `${creator.name || creator.username} OnlyFans profile`
        }
      }))
    };

    // Read the static HTML template
    const fs = require('fs');
    const path = require('path');
    const htmlPath = path.join(process.cwd(), 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Inject structured data into <head>
    const schemaScript = `<script type="application/ld+json">\n${JSON.stringify(itemListSchema, null, 2)}\n</script>`;
    html = html.replace('</head>', `${schemaScript}\n</head>`);

    // Generate SEO-friendly HTML for creator cards
    const creatorsHTML = creators.map((creator, index) => {
      const isFirstCard = index === 0;
      const slug = slugify(creator.username);
      const creatorUrl = `/c/${creator.id}/${slug}`;
      const { src, srcset, sizes } = buildResponsiveSources(creator.avatar);
      const priceDisplay = creator.subscribeprice === 0 ? 'FREE' : `$${creator.subscribeprice}`;
      const verifiedBadge = creator.isverified ? '<i class="fas fa-check-circle verified-badge" title="Verified"></i>' : '';
      const bundleTag = creator.bundle1_price > 0 ? '<span class="bundle-tag">Bundle Deal</span>' : '';

      return `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2" data-id="${creator.id}">
          <article class="creator-card" itemscope itemtype="https://schema.org/Person">
            <a href="${creatorUrl}" class="card-link" itemprop="url">
              <div class="creator-card-image">
                <img 
                  src="${src}" 
                  srcset="${srcset}" 
                  sizes="${sizes}"
                  alt="${creator.name || creator.username} OnlyFans"
                  loading="${isFirstCard ? 'eager' : 'lazy'}"
                  fetchpriority="${isFirstCard ? 'high' : 'auto'}"
                  itemprop="image"
                  width="320"
                  height="427"
                />
                ${bundleTag}
              </div>
              <div class="creator-card-body">
                <h3 class="creator-name" itemprop="name">
                  ${escapeHtml(creator.name || creator.username)}
                  ${verifiedBadge}
                </h3>
                <p class="creator-username" itemprop="alternateName">@${escapeHtml(creator.username)}</p>
                ${creator.about ? `<p class="creator-bio" itemprop="description">${escapeHtml(creator.about.substring(0, 100))}${creator.about.length > 100 ? '...' : ''}</p>` : ''}
                <div class="creator-stats">
                  <span class="stat" title="Favorites">
                    <i class="fas fa-heart"></i> ${formatNumber(creator.favoritedcount)}
                  </span>
                  <span class="stat" title="Subscribers">
                    <i class="fas fa-users"></i> ${formatNumber(creator.subscriberscount)}
                  </span>
                </div>
                <div class="creator-price">${priceDisplay}</div>
              </div>
            </a>
            <button class="favorite-btn" data-id="${creator.id}" aria-label="Add to favorites" title="Add to favorites">
              <i class="far fa-heart"></i>
            </button>
          </article>
        </div>
      `;
    }).join('\n');

    // Inject creator cards into results div
    html = html.replace(
      '<div id="results" class="row g-3 justify-content-center"></div>',
      `<div id="results" class="row g-3 justify-content-center">\n${creatorsHTML}\n</div>`
    );

    // Add SSR flag for client-side hydration
    html = html.replace(
      '<body>',
      `<body data-ssr="true" data-initial-creators="${creators.length}">`
    );

    // Send HTML with proper caching headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.setHeader('X-SSR-Homepage', 'true');
    res.status(200).send(html);

  } catch (error) {
    console.error('Homepage SSR error:', error);
    
    // Fallback to static HTML on error
    const fs = require('fs');
    const path = require('path');
    const htmlPath = path.join(process.cwd(), 'index.html');
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
  if (!str) return 'creator';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function proxyImg(url, width, height) {
  if (!url) return '/static/no-image.png';
  const encoded = encodeURIComponent(url);
  return `https://images.weserv.nl/?url=${encoded}&w=${width}&h=${height}&fit=cover&output=webp&q=85`;
}

function buildResponsiveSources(originalUrl) {
  const widths = [144, 240, 320, 480, 720];
  const srcset = widths
    .map(w => `${proxyImg(originalUrl, w, Math.round(w * 4 / 3))} ${w}w`)
    .join(', ');
  const src = proxyImg(originalUrl, 320, Math.round(320 * 4 / 3));
  const sizes = '(max-width: 480px) 144px, (max-width: 768px) 240px, 320px';
  return { src, srcset, sizes };
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

function formatNumber(num) {
  if (!num || num === 0) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
