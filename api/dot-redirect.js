// Redirect dotted username path segment to canonical /c/{id}/{slug}
// Never index these intermediary URLs – always 301.
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

function slugify(u) { return (u || '').replace(/\./g, '-'); }

async function lookup(username) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const encoded = encodeURIComponent(username);
    const url = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?select=id,username&username=eq.${encoded}&limit=1`;
    const resp = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Accept-Profile': 'public' }});
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return data[0];
  } catch (e) {
    console.error('[dot-redirect] lookup error', e);
    return null;
  }
}

export default async function handler(req, res) {
  // Extract username from path: /api/dot-redirect/:username invoked via rewrite
  const username = (req.query.username || '').trim();
  if (!username) {
    res.status(400).json({ error: 'missing_username' });
    return;
  }
  const record = await lookup(username);
  if (!record) {
    // If exact match fails, try ilike fallback
    const fallbackEncoded = encodeURIComponent(username);
    try {
      const url = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?select=id,username&username=ilike.*${fallbackEncoded}*&limit=1`;
      const resp = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Accept-Profile': 'public' }});
      if (resp.ok) {
        const arr = await resp.json();
        if (Array.isArray(arr) && arr.length) {
          const rec = arr[0];
          const target = `/c/${rec.id}/${slugify(rec.username)}`;
          res.writeHead(301, { 'Location': target, 'Cache-Control': 'no-store', 'X-Dot-Redirect': 'fallback', 'X-Robots-Tag': 'noindex' });
          res.end();
          return;
        }
      }
    } catch {}
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Dot-Redirect': 'not-found', 'X-Robots-Tag': 'noindex' });
    res.end('Creator not found');
    return;
  }
  const target = `/c/${record.id}/${slugify(record.username)}`;
  res.writeHead(301, {
    'Location': target,
    'Cache-Control': 'no-store',
    'X-Dot-Redirect': 'primary',
    'X-Robots-Tag': 'noindex'
  });
  res.end();
}