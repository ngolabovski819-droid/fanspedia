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

// Generate full HTML
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
  
  <!-- Preconnect to critical domains -->
  <link rel="preconnect" href="https://images.weserv.nl">
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link rel="dns-prefetch" href="https://onlyfans.com">
  
  <!-- Preload OG image to avoid CLS -->
  <link rel="preload" as="image" href="${ogImage}">
  
  <!-- Bootstrap CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- Font Awesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  
  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
  
  <!-- Inject pre-fetched creator data for client hydration (no refetch needed) -->
  <script>
    window.__CREATOR__ = ${JSON.stringify(creator)};
  </script>
  
  <style>
    /* Critical CSS for above-the-fold content */
    :root { --brand:#00AFF0; --brand-d:#0099D6; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f7; margin: 0; }
    .loading-skeleton { display: none; }
    /* Header (uses creator.header if available) */
    .creator-header { position: relative; color: #fff; text-align: center; min-height: 220px; padding: 48px 20px 88px; background:
      linear-gradient(135deg, rgba(0,175,240,0.85) 0%, rgba(0,153,214,0.85) 100%);
      background-size: cover; background-position: center; }
    .creator-header.has-bg { background-blend-mode: overlay; }
  .page-container { max-width: 1280px; margin: 0 auto; padding: 0 20px; }
    /* Avatar overlay card */
    .avatar-card { position: relative; margin-top: -64px; display: flex; align-items: center; gap: 16px; background: #fff; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); padding: 16px 20px; }
    .creator-avatar { width: 120px; height: 120px; border-radius: 50%; border: 4px solid #fff; object-fit: cover; flex: 0 0 auto; }
    .creator-title { display: flex; flex-direction: column; align-items: flex-start; }
    .creator-name { font-size: 28px; font-weight: 800; margin: 4px 0; color: #1d1d1f; }
    .creator-username { font-size: 16px; color: #555; }
    .verified-badge { font-size: 13px; background: linear-gradient(135deg, var(--brand) 0%, var(--brand-d) 100%); color: #fff; padding: 6px 10px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px; }
    /* Stats grid */
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; max-width: 1280px; margin: 20px auto; padding: 0; }
  @media (max-width: 600px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    .stat-card { background: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .stat-value { font-size: 22px; font-weight: 800; color: var(--brand); }
    .stat-label { font-size: 13px; color: #666; margin-top: 6px; text-transform: uppercase; letter-spacing: .4px; }
    /* Content */
  .content-row { display: grid; grid-template-columns: minmax(0,1fr); gap: 16px; max-width: 1280px; margin: 20px auto 40px; }
    .card { background: #fff; border-radius: 16px; box-shadow: 0 6px 18px rgba(0,0,0,0.08); padding: 24px; }
    .card h2 { font-size: 20px; font-weight: 800; margin: 0 0 12px; color: #1d1d1f; }
    .card p { line-height: 1.7; color: #333; }
    .cta { text-align: center; margin: 26px 0 0; }
    .cta a { display: inline-block; background: linear-gradient(135deg, var(--brand) 0%, var(--brand-d) 100%); color: #fff; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: 800; font-size: 16px; box-shadow: 0 10px 22px rgba(0,175,240,0.25); }
  </style>
</head>
<body>
  <!-- Pre-rendered content for SEO and instant display -->
  <div class="creator-header ${headerImage ? 'has-bg' : ''}" ${headerImage ? `style="background-image: linear-gradient(135deg, rgba(0,175,240,0.70) 0%, rgba(0,153,214,0.70) 100%), url('${headerImage}')"` : ''}>
    <div class="page-container">
      <div class="page-title" style="max-width:1100px;margin:0 auto;">
        <h1 style="margin:0;font-size:28px;font-weight:800;">${displayName}</h1>
        <div style="opacity:.95; margin-top:6px;">@${username}</div>
      </div>
    </div>
  </div>
  <div class="page-container" style="margin-top:-60px;">
    <div class="avatar-card">
      <img src="${avatarThumb}" alt="${displayName} avatar" class="creator-avatar" width="120" height="120">
      <div class="creator-title">
        <div class="creator-name">${displayName}</div>
        <div class="creator-username">@${username}</div>
        ${creator.isVerified ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>' : ''}
      </div>
    </div>
  </div>
  
  <div class="stats-grid page-container" style="margin-top:16px;">
    <div class="stat-card">
      <div class="stat-value">${price}</div>
      <div class="stat-label">Subscription</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${creator.postsCount || 0}</div>
      <div class="stat-label">Posts</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${creator.photosCount || 0}</div>
      <div class="stat-label">Photos</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${creator.videosCount || 0}</div>
      <div class="stat-label">Videos</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${(creator.favoritedCount || 0).toLocaleString()}</div>
      <div class="stat-label">Favorites</div>
    </div>
  </div>
  
  <div class="content-row">
    <div class="card">
      <h2>About</h2>
      <p style="white-space: normal;">${bio || 'No description provided.'}</p>
      <div class="cta">
        <a href="https://onlyfans.com/${username}" rel="nofollow noopener" target="_blank">
          Visit OnlyFans Profile <i class="fas fa-external-link-alt" style="margin-left:8px;"></i>
        </a>
      </div>
    </div>
  </div>
  
  <!-- Full client-side template will hydrate without refetching -->
  <div id="creatorProfile" style="display: none;"></div>
  
  <!-- Load client-side JS for interactivity (theme toggle, favorites, etc) -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    // Client hydration will use window.__CREATOR__ data (no API fetch needed)
    console.log('Creator data pre-loaded for hydration:', window.__CREATOR__);
  </script>
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
