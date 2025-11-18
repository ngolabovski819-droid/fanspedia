/**
 * Public Server-Side Rendered Creator Profile Page (single-creator enablement)
 * Fetches data from Supabase and returns fully rendered HTML with SEO meta tags.
 * This is a copy of api/creator/[username].js with routing adjusted to /api/creator_public/*
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const BASE_URL = 'https://fanspedia.net';

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
    avatar_c50: raw.avatar_c50,
    avatar_c144: raw.avatar_c144,
    header_w480: raw.header_w480,
    header_w760: raw.header_w760,
    bundle1_id: raw.bundle1_id,
    bundle1_price: raw.bundle1_price,
    bundle1_discount: raw.bundle1_discount,
    bundle1_duration: raw.bundle1_duration,
    bundle2_id: raw.bundle2_id,
    bundle2_price: raw.bundle2_price,
    bundle3_id: raw.bundle3_id,
    bundle3_price: raw.bundle3_price,
    promotion1_price: raw.promotion1_price,
    promotion1_discount: raw.promotion1_discount,
    first_seen_at: raw.first_seen_at,
    last_seen_at: raw.last_seen_at,
    status: raw.status
  };
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function proxyImage(url, width, height) {
  if (!url) return '';
  const encoded = encodeURIComponent(url);
  return `https://images.weserv.nl/?url=${encoded}&w=${width}&h=${height}&fit=cover&output=webp`;
}

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

async function fetchCreator(username) {
  const debug = { variants: [], attempts: [], match: null };
  try {
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Accept-Profile': 'public',
      'Content-Profile': 'public',
      'Prefer': 'count=exact'
    };

    const base = `${(SUPABASE_URL || '').replace(/\/+$/, '')}/rest/v1/onlyfans_profiles`;

    const variants = [];
    const u = String(username || '').trim();
    if (u) variants.push(u);
    const noDots = u.replace(/\./g, '');
    if (noDots && noDots !== u) variants.push(noDots);
    const noPunct = u.replace(/[._-]+/g, '');
    if (noPunct && !variants.includes(noPunct)) variants.push(noPunct);
    debug.variants = variants.slice(0);

    for (const v of variants) {
      const p = new URLSearchParams();
      p.set('select', '*,avatar_c50,avatar_c144,header_w480,header_w760');
      p.set('username', `eq.${v}`);
      p.set('limit', '1');
      const url = `${base}?${p.toString()}`;
      debug.attempts.push({ type: 'eq', v });
      try {
        const r = await fetch(url, { headers });
        if (r.ok) {
          const j = await r.json();
          if (Array.isArray(j) && j[0]) {
            debug.match = { type: 'eq', v };
            return { creator: normalizeCreator(j[0]), debug };
          }
        }
      } catch {}
    }

    for (const v of variants) {
      const p = new URLSearchParams();
      p.set('select', '*,avatar_c50,avatar_c144,header_w480,header_w760');
      p.set('username', `ilike.*${v}*`);
      p.set('limit', '1');
      const url = `${base}?${p.toString()}`;
      debug.attempts.push({ type: 'ilike', v });
      try {
        const r = await fetch(url, { headers });
        if (r.ok) {
          const j = await r.json();
          if (Array.isArray(j) && j[0]) {
            debug.match = { type: 'ilike', v };
            return { creator: normalizeCreator(j[0]), debug };
          }
        }
      } catch {}
    }

    return { creator: null, debug };
  } catch (error) {
    return { creator: null, debug: { error: String(error && error.message ? error.message : error) } };
  }
}

function buildRedirectHtml(creator, username) {
  const displayName = escapeHtml(creator.name || creator.username || username);
  const bioPreview = (creator.about || '').toString().replace(/<[^>]*>/g, '').substring(0, 155);
  const ogImage = proxyImage(creator.avatar, 1200, 630);
  const canonicalUrl = `${BASE_URL}/${encodeURIComponent(username)}`;
  const jsonLd = generateJsonLd({ ...creator, username });
  const v = '20251114-1';
  const target = `/creator.html?v=${v}&u=${encodeURIComponent(username)}&ssr=1&cleanUrl=${encodeURIComponent('/' + username)}`;
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${displayName} (@${escapeHtml(username)}) OnlyFans Profile • FansPedia</title>
  <meta name="description" content="${escapeHtml(bioPreview)}">
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:type" content="profile">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${displayName} OnlyFans Profile">
  <meta property="og:description" content="${escapeHtml(bioPreview)}">
  <meta property="og:image" content="${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${canonicalUrl}">
  <meta name="twitter:title" content="${displayName} OnlyFans Profile">
  <meta name="twitter:description" content="${escapeHtml(bioPreview)}">
  <meta name="twitter:image" content="${ogImage}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <script>(function(){try{window.location.replace('${target}')}catch(e){window.location.href='${target}'}})();</script>
  <noscript><meta http-equiv="refresh" content="0;url=${target}"></noscript>
  <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:60px 20px;text-align:center}</style>
  </head>
  <body>
    <p>Loading ${displayName}'s profile...</p>
  </body>
  </html>`;
}

function getOrigin(req) {
  try {
    const host = (req.headers['x-forwarded-host'] || req.headers['host'] || '').toString();
    const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
    if (!host) return BASE_URL;
    return `${proto}://${host}`;
  } catch {
    return BASE_URL;
  }
}

async function renderCreatorHtmlFromOrigin(req, creator, username) {
  // Fetch the deployed creator.html, inject SSR globals, and return complete HTML
  const origin = getOrigin(req);
  const version = '20251114-1';
  // Use internal template path that rewrites to creator.html (since /creator.html redirects to /)
  const templateUrl = `${origin}/_templates/creator?v=${version}`;
  try {
    const r = await fetch(templateUrl, { headers: { 'accept': 'text/html' } });
    if (!r.ok) throw new Error(`template_fetch_${r.status}`);
    let html = await r.text();
    // Guard: treat empty or malformed template as failure
    const looksMalformed = !html || html.length < 1000 || (!html.includes('<html') && !html.includes('</head>'));
    if (looksMalformed) {
      throw new Error('template_malformed');
    }
    const inject = `\n<script>\n  window.__CREATOR_SSR__ = ${JSON.stringify(creator)};\n  window.__SSR_USERNAME__ = ${JSON.stringify(username)};\n  window.__SSR_CLEAN_URL__ = ${JSON.stringify('/' + username)};\n</script>\n`;
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${inject}</head>`);
    } else if (html.includes('<head')) {
      // Insert right after <head>
      html = html.replace(/<head[^>]*>/i, (m) => `${m}${inject}`);
    } else if (html.startsWith('<!DOCTYPE html>')) {
      // Insert after doctype as last resort
      html = '<!DOCTYPE html>' + inject + html.substring('<!DOCTYPE html>'.length);
    } else {
      html = inject + html;
    }
    return html;
  } catch (e) {
    // Fallback to minimal SEO + redirect if template fetch fails
    return null;
  }
}

export default async function handler(req, res) {
  let buildSSRTemplate;
  try {
    ({ buildSSRTemplate } = await import('../creator/ssr-template.js'));
  } catch (e) {
    // If import fails, we'll fall back to the minimal HTML builder below
    buildSSRTemplate = null;
  }
  let username = req.query?.params ?? req.query?.username ?? null;
  if (Array.isArray(username)) username = username.join('/');
  if (!username && typeof req.url === 'string') {
    const m = req.url.match(/\/api\/(?:creator_public|creator)\/(.*)$/);
    if (m && m[1]) username = decodeURIComponent(m[1]);
  }
  if (typeof username === 'string') {
    username = username.replace(/^\/+|\/+$/g, '');
  }
  if (!username) {
    res.status(400).send('Username required');
    return;
  }

  try {
    const timeoutMs = 5000;
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs));
    const result = await Promise.race([
      fetchCreator(username),
      timeoutPromise
    ]).catch((err) => ({ creator: null, debug: { error: (err && err.message) || 'timeout' } }));
    const creator = result && result.creator ? result.creator : null;
    const debug = result && result.debug ? result.debug : {};
    if (!creator) {
      res.status(404);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
      return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Creator Not Found</title></head><body><p>Creator not found.</p></body></html>`);
    }

    // Prefer fetching the full static template first for perfect styling
    let html = await renderCreatorHtmlFromOrigin(req, creator, username);
    if (!html && buildSSRTemplate) {
      const displayName = escapeHtml(creator.name || creator.username);
      const usernameEsc = escapeHtml(creator.username);
      const bioRaw = creator.about || '';
      const bioEscaped = escapeHtml(bioRaw).replace(/&lt;br\s*\/?&gt;/gi, '<br>').replace(/\n+/g, '<br>');
      const price = (creator.subscribePrice === 0 || creator.subscribePrice === '0' || creator.subscribePrice === null || creator.subscribePrice === undefined)
        ? 'Free'
        : `$${Number(creator.subscribePrice || 0)}/month`;
      const stats = `${creator.postsCount || 0} posts • ${creator.photosCount || 0} photos • ${creator.videosCount || 0} videos`;
      const bioPreview = (bioRaw || '').replace(/<[^>]*>/g, '').substring(0, 155);
      const metaDesc = `${displayName} OnlyFans profile. ${stats}. Subscribe for ${price}. ${bioPreview}`;
      const ogImage = proxyImage(creator.avatar, 1200, 630);
      const avatarThumb = proxyImage(creator.avatar, 400, 400);
      const canonicalUrl = `${BASE_URL}/${creator.username}`;
      const jsonLd = generateJsonLd(creator);
      html = buildSSRTemplate({
        creator,
        displayName,
        username: usernameEsc,
        bio: bioEscaped,
        metaDesc,
        ogImage,
        avatarThumb,
        canonicalUrl,
        jsonLd
      });
      // No debug marker in output; keep HTML starting at doctype
    }
    if (!html) {
      // Last resort: minimal SEO + redirect
      html = buildRedirectHtml(creator, username);
    }
    // Set headers BEFORE sending body; send exactly once
    res.setHeader('X-SSR-Handler', 'creator-public');
    if (debug && debug.match) res.setHeader('X-SSR-Match', `${debug.match.type}:${debug.match.v}`);
    if (debug && debug.variants) res.setHeader('X-SSR-Variants', debug.variants.join('|'));
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    return res.status(200).send(html);
  } catch (error) {
    res.status(500).send('Internal error');
  }
}
