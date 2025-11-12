import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

function slugify(u) { return (u || '').replace(/\./g, '-'); }

async function fetchByExact(username) {
  try {
    const enc = encodeURIComponent(username);
    const u = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?select=id,username&username=eq.${enc}&limit=1`;
    const r = await fetch(u, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Accept-Profile': 'public' } });
    if (!r.ok) return null;
    const j = await r.json();
    return Array.isArray(j) && j[0] ? j[0] : null;
  } catch { return null; }
}

async function fetchByLike(username) {
  try {
    const enc = encodeURIComponent(username);
    const u = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?select=id,username&username=ilike.*${enc}*&limit=1`;
    const r = await fetch(u, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Accept-Profile': 'public' } });
    if (!r.ok) return null;
    const j = await r.json();
    return Array.isArray(j) && j[0] ? j[0] : null;
  } catch { return null; }
}

export default async function handler(req, res) {
  let username = req.query.username;
  if (Array.isArray(username)) username = username.join('.');
  username = (username || '').trim();
  if (!username) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('missing username');
    return;
  }
  let rec = await fetchByExact(username);
  let via = 'exact';
  if (!rec) { rec = await fetchByLike(username); via = rec ? 'ilike' : 'miss'; }
  if (!rec) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Dot-Redirect': 'not-found', 'X-Robots-Tag': 'noindex' });
    res.end('not found');
    return;
  }
  const target = `/c/${rec.id}/${slugify(rec.username)}`;
  res.writeHead(301, {
    'Location': target,
    'Cache-Control': 'no-store',
    'X-Dot-Redirect': via,
    'X-Robots-Tag': 'noindex'
  });
  res.end();
}
