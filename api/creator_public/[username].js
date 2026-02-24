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
      p.set('is_published', 'eq.true');
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
      p.set('is_published', 'eq.true');
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
      // Enforce visibility inline (defense-in-depth even if CSS/JS is blocked)
      try {
        html = html.replace(/id="loadingState"([^>]*)>/i, 'id="loadingState"$1 style="display:none!important">');
        html = html.replace(/id="profileContent"([^>]*)>/i, 'id="profileContent"$1 style="display:block!important">');
      } catch(_) {}
        const safeJson = JSON.stringify(creator)
          .replace(/</g, '\\u003C')
          .replace(/>/g, '\\u003E')
          .replace(/&/g, '\\u0026')
          .replace(/\u2028/g, '\\u2028')
          .replace(/\u2029/g, '\\u2029')
          .replace(/<\/script/gi, '<\\/script');
        // Split inject into separate parts to avoid script parsing issues
        const iconLink = '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\'%3E%3Ctext y=\'14\' font-size=\'14\'%3E★%3C/text%3E%3C/svg%3E">';
        const visibilityStyle = '<style id="ssr-visibility">#loadingState{display:none!important} #profileContent{display:block!important}</style>';
        const jsonScript = '<script id="__CREATOR_SSR__" type="application/json">' + safeJson + '<\/script>';
        
        // SSR logic script - use <\/script> to avoid breaking the script tag
        // Wrap in DOMContentLoaded to ensure elements exist
        const ssrScript = '<script>' +
          'window.__SSR_USERNAME__=' + JSON.stringify(username) + ';' +
          'window.__SSR_CLEAN_URL__=' + JSON.stringify('/' + username) + ';' +
          'document.addEventListener("DOMContentLoaded",function(){' +
          '(function(){' +
          'try{' +
          'var dataEl=document.getElementById("__CREATOR_SSR__");' +
          'var c={};' +
          'if(dataEl){try{c=JSON.parse(dataEl.textContent||"{}");}catch(e){c={};}}' +
          'window.__CREATOR_SSR__=c;' +
          'function fmtNum(n){n=Number(n);if(!isFinite(n))return"N/A";if(n>=1e6)return(n/1e6).toFixed(1)+"M";if(n>=1e3)return(n/1e3).toFixed(1)+"K";return n.toLocaleString();}' +
          'function fmtPrice(p){p=Number(p);if(!isFinite(p))return"N/A";return p===0?"Free":("$"+p.toFixed(2));}' +
          'function fmtDate(s){try{var d=new Date(s);return d.toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"});}catch(e){return s||"";}}' +
          'function setText(id,val){var el=document.getElementById(id);if(el&&val!=null)el.textContent=String(val);}' +
          'function setHTML(id,html){var el=document.getElementById(id);if(el&&html!=null)el.innerHTML=String(html);}' +
          'function show(id){var el=document.getElementById(id);if(el){el.style.display="block";}}' +
          'function hide(id){var el=document.getElementById(id);if(el){el.style.display="none";}}' +
          'hide("loadingState");show("profileContent");' +
          'setText("breadcrumbName",c.name||c.username);' +
          'var avatar=(c.avatar)||"/static/no-image.png";' +
          'var img=document.getElementById("profileAvatar");' +
          'if(img){img.src=avatar;img.alt=(c.name||c.username||"")+" avatar";}' +
          'var a=document.getElementById("onlyfansLink");if(a){a.href="https://onlyfans.com/"+(c.username||"");}' +
          'setText("profileName",(c.name||c.username)+" OnlyFans profile");' +
          'setText("profileUsername","@"+(c.username||""));' +
          'setText("joinDate",fmtDate(c.firstPublishedPostDate||c.joinDate));' +
          'if(c.lastSeen){setText("lastSeen",fmtDate(c.lastSeen));var li=document.getElementById("lastSeenItem");if(li){li.style.display="flex";}}' +
          'if(c.isVerified){var vb=document.getElementById("verifiedBadge");if(vb){vb.style.display="block";}}' +
          'if(c.location){setText("location",c.location);var lc=document.getElementById("locationContainer");if(lc){lc.style.display="block";}}' +
          'var contentStats=[' +
          '{icon:"fa-image",label:"Photos",value:fmtNum(c.photoscount||c.photosCount||0)},' +
          '{icon:"fa-video",label:"Videos",value:fmtNum(c.videoscount||c.videosCount||0)},' +
          '{icon:"fa-file-alt",label:"Posts",value:fmtNum(c.postscount||c.postsCount||0)},' +
          '{icon:"fa-archive",label:"Archived Posts",value:fmtNum(c.archivedpostscount||c.archivedPostsCount||0)},' +
          '{icon:"fa-broadcast-tower",label:"Finished Streams",value:fmtNum(c.finishedstreamscount||c.finishedStreamsCount||0)},' +
          '{icon:"fa-music",label:"Audios",value:fmtNum(c.audioscount||c.audiosCount||0)}' +
          '];' +
          'var cs=document.getElementById("contentStats");' +
          'if(cs){try{cs.innerHTML=contentStats.map(function(s){return"<div class=\\"stat-card\\"><div class=\\"stat-card-header\\"><div class=\\"stat-card-icon\\"><i class=\\"fas "+s.icon+"\\"></i></div></div><div class=\\"stat-card-label\\">"+s.label+"</div><div class=\\"stat-card-value\\">"+s.value+"</div></div>";}).join("");}catch(e){console.error("contentStats error:",e);}}' +
          'var likes=fmtNum(c.favoritedcount||c.favoritedCount||0);' +
          'var subs=(c.showsubscriberscount||c.showSubscribersCount)?fmtNum(c.subscriberscount||c.subscribersCount||0):"Hidden";' +
          'var engStats=["<div class=\\"stat-card\\"><div class=\\"stat-card-header\\"><div class=\\"stat-card-icon\\"><i class=\\"fas fa-users\\"></i></div></div><div class=\\"stat-card-label\\">Subscribers</div><div class=\\"stat-card-value\\">"+subs+"</div></div>","<div class=\\"stat-card\\"><div class=\\"stat-card-header\\"><div class=\\"stat-card-icon\\"><i class=\\"fas fa-heart\\"></i></div></div><div class=\\"stat-card-label\\">Likes</div><div class=\\"stat-card-value\\">"+likes+"</div></div>"];' +
          'if(c.canearn||c.canEarn){engStats.push("<div class=\\"stat-card\\"><div class=\\"stat-card-header\\"><div class=\\"stat-card-icon\\"><i class=\\"fas fa-dollar-sign\\"></i></div></div><div class=\\"stat-card-label\\">Can Earn</div><div class=\\"stat-card-value\\">Yes</div></div>");}' +
          'var es=document.getElementById("engagementStats");' +
          'if(es){try{es.innerHTML=engStats.join("");}catch(e){console.error("engagementStats error:",e);}}' +
          'var prices=[];' +
          'var subPrice=c.subscribePrice||c.subscribeprice;' +
          'if(subPrice!==null&&subPrice!==undefined){var priceVal=fmtPrice(subPrice);var isFree=subPrice===0||subPrice==="0";prices.push({label:"Monthly Subscription",value:priceVal,duration:"per month",isFree:isFree});}' +
          'if(c.promotion1_price){prices.push({label:"Promotion Offer",value:fmtPrice(c.promotion1_price),discount:(c.promotion1_discount?(c.promotion1_discount+"% OFF"):null),isFree:false});}' +
          'var pg=document.getElementById("pricingGrid");' +
          'if(pg){if(prices.length){try{pg.innerHTML=prices.map(function(p){var cardClass=p.isFree?"price-card price-card-free":"price-card";return"<div class=\\""+cardClass+"\\"><div class=\\"price-card-label\\">"+p.label+"</div><div class=\\"price-card-value\\">"+(p.isFree?("<span style=\\"color:#00AFF0;\\">"+p.value+"</span>"):p.value)+"</div>"+(p.duration?("<div class=\\"price-card-duration\\">"+p.duration+"</div>"):"")+(p.discount?("<div class=\\"price-card-discount\\">"+p.discount+"</div>"):"")+"</div>";}).join("");}catch(e){console.error("pricingGrid error:",e);}}else{try{pg.innerHTML="";}catch(e){}}}' +
          'var bundles=[];' +
          'if(c.bundle1_price){bundles.push({duration:(c.bundle1_duration||"")+" months",price:fmtPrice(c.bundle1_price),discount:c.bundle1_discount?(c.bundle1_discount+"% OFF"):null});}' +
          'if(c.bundle2_price){bundles.push({duration:(c.bundle2_duration||"")+" months",price:fmtPrice(c.bundle2_price),discount:c.bundle2_discount?(c.bundle2_discount+"% OFF"):null});}' +
          'if(c.bundle3_price){bundles.push({duration:(c.bundle3_duration||"")+" months",price:fmtPrice(c.bundle3_price),discount:c.bundle3_discount?(c.bundle3_discount+"% OFF"):null});}' +
          'if(bundles.length){var bs=document.getElementById("bundlesSection");if(bs){bs.style.display="block";}var bg=document.getElementById("bundlesGrid");if(bg){try{bg.innerHTML=bundles.map(function(b){return"<div class=\\"price-card\\"><div class=\\"price-card-label\\">Bundle Deal</div><div class=\\"price-card-value\\">"+b.price+"</div><div class=\\"price-card-duration\\">"+b.duration+"</div>"+(b.discount?("<div class=\\"price-card-discount\\">"+b.discount+"</div>"):"")+"</div>";}).join("");}catch(e){console.error("bundlesGrid error:",e);}}}' +
          'try{if(c&&(c.name||c.username)){document.title=(c.name||c.username)+" • OnlyFans Profile • FansPedia";}}catch(_){}' +
          '}catch(e){}' +
          '})();' +
          '});' +
          '<\/script>';
        
        const inject = '\n' + iconLink + '\n' + visibilityStyle + '\n' + jsonScript + '\n' + ssrScript + '\n';
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
    // Also force-show content for SSR: hide loading, show profileContent
    try {
      html = html.replace(/id="loadingState"([^>]*?)>/i, (m, attrs) => {
        if (/style=/i.test(m)) return m.replace(/style="[^"]*"/i, 'style="display:none;"');
        return `id="loadingState"${attrs} style="display:none;">`;
      });
      html = html.replace(/id="profileContent"([^>]*?)>/i, (m, attrs) => {
        if (/style=/i.test(m)) return m.replace(/style="[^"]*"/i, 'style="display:block;"');
        return `id="profileContent"${attrs} style="display:block;">`;
      });
    } catch {}
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

  // --- CREATOR PAGES REMOVED: return 410 Gone ---
  // 410 tells Google/Bing to permanently de-index these pages immediately.
  res.status(410);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.send('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">'
    + '<title>Gone</title><meta name="robots" content="noindex,nofollow">'
    + '</head><body><h1>410 Gone</h1><p>This page has been permanently removed.</p></body></html>');
  return;

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
