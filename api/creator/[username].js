/**
 * Server-Side Rendered Creator Profile Page
 * Fetches data from Supabase and returns fully rendered HTML with SEO meta tags
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const BASE_URL = 'https://bestonlyfansgirls.net';

// Normalize field names from database (lowercase) to camelCase for client consistency
function normalizeCreator(raw) {
  if (!raw) return null;
  
  return {
    id: raw.id,
    username: raw.username,
    name: raw.name,
    about: raw.about,
    location: raw.location,
    website: raw.website,
    wishlist: raw.wishlist,
    view: raw.view,
    avatar: raw.avatar,
    header: raw.header,
    archivedPostsCount: raw.archivedpostscount,
    audiosCount: raw.audioscount,
    favoritedCount: raw.favoritedcount,
    favoritesCount: raw.favoritescount,
    finishedStreamsCount: raw.finishedstreamscount,
    mediasCount: raw.mediascount,
    photosCount: raw.photoscount,
    postsCount: raw.postscount,
    privateArchivedPostsCount: raw.privatearchivedpostscount,
    subscribersCount: raw.subscriberscount,
    videosCount: raw.videoscount,
    subscribePrice: raw.subscribeprice,
    currentSubscribePrice: raw.currentsubscribeprice,
    tipsEnabled: raw.tipsenabled,
    tipsMax: raw.tipsmax,
    tipsMin: raw.tipsmin,
    tipsMinInternal: raw.tipsmininternal,
    tipsTextEnabled: raw.tipstextenabled,
    isVerified: raw.isverified,
    isPerformer: raw.isperformer,
    isAdultContent: raw.isadultcontent,
    isBlocked: raw.isblocked,
    joinDate: raw.joindate,
    lastSeen: raw.lastseen,
    firstPublishedPostDate: raw.firstpublishedpostdate,
    // Thumbnails
    avatar_c50: raw.avatar_c50,
    avatar_c144: raw.avatar_c144,
    header_w480: raw.header_w480,
    header_w760: raw.header_w760,
    // Bundles
    bundle1_id: raw.bundle1_id,
    bundle1_price: raw.bundle1_price,
    bundle1_discount: raw.bundle1_discount,
    bundle1_duration: raw.bundle1_duration,
    bundle2_id: raw.bundle2_id,
    bundle2_price: raw.bundle2_price,
    bundle3_id: raw.bundle3_id,
    bundle3_price: raw.bundle3_price,
    // Promotions
    promotion1_price: raw.promotion1_price,
    promotion1_discount: raw.promotion1_discount,
    // V2 tracking
    first_seen_at: raw.first_seen_at,
    last_seen_at: raw.last_seen_at,
    status: raw.status
  };
}

// HTML escape to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Proxy image through weserv.nl with fixed dimensions
function proxyImage(url, width, height) {
  if (!url) return '';
  const encoded = encodeURIComponent(url);
  return `https://images.weserv.nl/?url=${encoded}&w=${width}&h=${height}&fit=cover&output=webp`;
}

// Generate JSON-LD structured data
function generateJsonLd(creator) {
  const displayName = escapeHtml(creator.name || creator.username);
  const bio = creator.about ? escapeHtml(creator.about.substring(0, 280)) : '';
  const avatarUrl = proxyImage(creator.avatar, 400, 400);
  
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "dateCreated": creator.first_seen_at || creator.joinDate,
        "dateModified": creator.last_seen_at || new Date().toISOString(),
        "mainEntity": {
          "@type": "Person",
          "name": displayName,
          "alternateName": `@${creator.username}`,
          "image": avatarUrl,
          "description": bio,
          "url": `https://onlyfans.com/${creator.username}`,
          ...(creator.location && { "address": { "@type": "PostalAddress", "addressLocality": escapeHtml(creator.location) } })
        }
      }
    ]
  };
}

// Fetch creator from Supabase
async function fetchCreator(username) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?username=ilike.${encodeURIComponent(username)}&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Accept-Profile': 'public'
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data || data.length === 0) return null;
    
    return normalizeCreator(data[0]);
  } catch (error) {
    console.error('Fetch creator error:', error);
    return null;
  }
}

// Generate full HTML matching creator.html structure exactly
function generateHtml(creator) {
  const displayName = escapeHtml(creator.name || creator.username);
  const username = escapeHtml(creator.username);
  const bioRaw = creator.about || '';
  const bioEscaped = escapeHtml(bioRaw)
    .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
    .replace(/\n+/g, '<br>');
  const bio = bioEscaped;
  const bioPreview = (bioRaw || '').replace(/<[^>]*>/g, '').substring(0, 155);
  
  const price = creator.subscribePrice !== null && creator.subscribePrice !== undefined 
    ? `$${creator.subscribePrice}/month` 
    : 'Free';
  
  const stats = `${creator.postsCount || 0} posts • ${creator.photosCount || 0} photos • ${creator.videosCount || 0} videos`;
  const metaDesc = `${displayName} OnlyFans profile. ${stats}. Subscribe for ${price}. ${bioPreview}`;
  
  // Use proxied and sized images for OG tags
  const ogImage = proxyImage(creator.avatar, 1200, 630);
  const avatarThumb = proxyImage(creator.avatar, 400, 400);
  const headerImage = creator.header ? proxyImage(creator.header, 1600, 360) : '';
  const canonicalUrl = `${BASE_URL}/${username}`;
  
  const jsonLd = generateJsonLd(creator);
  
  // Calculate ETag from last_seen_at or current time
  const etag = `"${Buffer.from(creator.last_seen_at || new Date().toISOString()).toString('base64').substring(0, 16)}"`;
  
  // Hybrid approach: Redirect to creator.html with username to maintain 100% visual parity
  // The static creator.html will handle all the UI/UX while SSR provides SEO meta tags
  return {
    html: `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  
  <!-- Primary Meta Tags -->
  <title>${displayName} (@${username}) OnlyFans Profile • Stats & Pricing</title>
  <meta name="description" content="${metaDesc}">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="profile">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${displayName} OnlyFans Profile">
  <meta property="og:description" content="${metaDesc}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${canonicalUrl}">
  <meta name="twitter:title" content="${displayName} OnlyFans Profile">
  <meta name="twitter:description" content="${metaDesc}">
  <meta name="twitter:image" content="${ogImage}">
  
  <!-- Preconnect -->
  <link rel="preconnect" href="https://images.weserv.nl">
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  
  <!-- JSON-LD Structured Data for SEO -->
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
  
  <!-- Instant redirect to static creator.html with cached data -->
  <meta http-equiv="refresh" content="0;url=/creator.html?u=${encodeURIComponent(username)}">
  
  <!-- Pre-cache creator data for zero-latency client render -->
  <script>
    window.__CREATOR_SSR__ = ${JSON.stringify(creator)};
    window.__SSR_USERNAME__ = ${JSON.stringify(username)};
    // Instant client-side redirect (faster than meta refresh)
    window.location.replace('/creator.html?u=' + encodeURIComponent(${JSON.stringify(username)}));
  </script>
</head>
<body>
  <p style="font-family: sans-serif; text-align: center; padding: 60px 20px;">
    Loading ${displayName}'s profile... 
    <a href="/creator.html?u=${encodeURIComponent(username)}" style="color: #00AFF0;">Click here if not redirected</a>
  </p>
</body>
</html>`,
    etag
  };
}

// Generate 404 page
function generate404Html(username) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Creator Not Found - BestOFGirls</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f7; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
    .error-container { max-width: 500px; }
    h1 { font-size: 72px; margin: 0; color: #00AFF0; }
    h2 { font-size: 24px; margin: 20px 0; color: #333; }
    p { color: #666; line-height: 1.6; }
    a { color: #00AFF0; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>404</h1>
    <h2>Creator Not Found</h2>
    <p>The creator <strong>@${escapeHtml(username)}</strong> could not be found in our database.</p>
    <p><a href="/">← Back to Home</a></p>
  </div>
</body>
</html>`;
}

// Main handler
export default async function handler(req, res) {
  const { username } = req.query;
  
  if (!username) {
    res.status(400).send('Username required');
    return;
  }
  
  try {
    // Fetch creator (with 2s timeout)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 2000)
    );
    
    const creator = await Promise.race([
      fetchCreator(username),
      timeoutPromise
    ]).catch(() => null);
    
    if (!creator) {
      // 404 with noindex
      res.status(404);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300'); // Cache 404s for 5 min
      res.send(generate404Html(username));
      return;
    }
    
    // Generate HTML
    const { html, etag } = generateHtml(creator);
    
    // Set headers for edge caching and validation
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('ETag', etag);
    res.setHeader('Vary', 'Accept-Encoding');
    
    // Check If-None-Match for 304 response
    const clientEtag = req.headers['if-none-match'];
    if (clientEtag === etag) {
      res.status(304).end();
      return;
    }
    
    res.status(200).send(html);
    
  } catch (error) {
    console.error('SSR error:', error);
    
    // Fallback: Return minimal HTML with noindex and client-side render trigger
    res.status(500);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Render-Error', 'true');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex">
  <title>Loading Creator Profile...</title>
  <meta http-equiv="refresh" content="0;url=/creator.html?username=${encodeURIComponent(username)}">
</head>
<body>
  <p>Loading... <a href="/creator.html?username=${encodeURIComponent(username)}">Click here if not redirected</a></p>
</body>
</html>`);
  }
}
