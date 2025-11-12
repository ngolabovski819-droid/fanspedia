// Simple creator SSR endpoint for rewrites using query param (easier than dynamic route)
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const BASE_URL = 'https://bestonlyfansgirls.net';

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

function normalizeCreator(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    username: raw.username,
    name: raw.name,
    about: raw.about,
    avatar: raw.avatar,
    header: raw.header,
    subscribePrice: raw.subscribeprice,
    postsCount: raw.postscount,
    photosCount: raw.photoscount,
    videosCount: raw.videoscount,
    isVerified: raw.isverified,
    first_seen_at: raw.first_seen_at,
    last_seen_at: raw.last_seen_at,
    status: raw.status
  };
}

function generateJsonLd(creator) {
  const displayName = escapeHtml(creator.name || creator.username);
  const avatarUrl = proxyImage(creator.avatar, 400, 400);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": displayName,
    "alternateName": `@${creator.username}`,
    "image": avatarUrl,
    "url": `https://onlyfans.com/${creator.username}`
  };
}

function generate404Html(username) {
  return `<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Creator Not Found</title><meta name='robots' content='noindex'></head><body><h1>404 - @${escapeHtml(username)}</h1><p>Creator not found.</p></body></html>`;
}

function generateHtml(creator) {
  const displayName = escapeHtml(creator.name || creator.username);
  const username = escapeHtml(creator.username);
  const metaDesc = `${displayName} OnlyFans profile. ${creator.postsCount||0} posts. Subscribe price: ${creator.subscribePrice ?? 'Free'}`;
  const ogImage = proxyImage(creator.avatar, 1200, 630);
  const canonicalUrl = `${BASE_URL}/${username}`;
  const jsonLd = generateJsonLd(creator);
  return `<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>${displayName} (@${username}) OnlyFans Profile</title><meta name='description' content='${metaDesc}'><link rel='canonical' href='${canonicalUrl}'><meta property='og:type' content='profile'><meta property='og:url' content='${canonicalUrl}'><meta property='og:title' content='${displayName} OnlyFans Profile'><meta property='og:description' content='${metaDesc}'><meta property='og:image' content='${ogImage}'><meta name='twitter:card' content='summary_large_image'><meta name='twitter:title' content='${displayName} OnlyFans Profile'><meta name='twitter:description' content='${metaDesc}'><meta name='twitter:image' content='${ogImage}'><script type='application/ld+json'>${JSON.stringify(jsonLd)}</script><script>window.__CREATOR_SSR__=${JSON.stringify(creator)};window.__SSR_USERNAME__='${username}';</script></head><body><div style='padding:40px;text-align:center;font-family:sans-serif'>Loading ${displayName}...</div></body></html>`;
}

async function fetchCreator(username) {
  try {
    const encoded = encodeURIComponent(username);
    const url = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?username=ilike.*${encoded}*&limit=1`;
    const resp = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Accept-Profile': 'public' } });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return normalizeCreator(data[0]);
  } catch (e) {
    console.error('[creator.js] fetch error', e);
    return null;
  }
}

export default async function handler(req, res) {
  const username = (req.query.username || '').trim();
  if (!username) {
    res.status(400).json({ error: 'missing_username' });
    return;
  }
  const creator = await fetchCreator(username);
  if (!creator) {
    res.setHeader('X-SSR-Handler', 'creator-basic');
    res.setHeader('X-SSR-Username', username);
    res.status(404).setHeader('Content-Type','text/html; charset=utf-8').send(generate404Html(username));
    return;
  }
  res.setHeader('X-SSR-Handler', 'creator-basic');
  res.setHeader('X-SSR-Username', username);
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.status(200).send(generateHtml(creator));
}
