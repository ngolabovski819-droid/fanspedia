// Serverless function to batch fetch favorites by username
// Query: /api/wishlist?users=user1,user2,user3
// Returns array in the same order as provided
const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();

export default async function handler(req, res) {
  try {
    const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
    const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: 'Missing SUPABASE_URL or SUPABASE_KEY env vars' });
    }

    const raw = (req.query.users || '').trim();
    if (!raw) return res.status(200).json([]);
    const inputOrder = raw.split(/[\|,]/).map(s => s.trim()).filter(Boolean);
    if (!inputOrder.length) return res.status(200).json([]);
    // Deduplicate while preserving order
    const seen = new Set();
    const usernames = [];
    for (const u of inputOrder) { if (!seen.has(u)) { seen.add(u); usernames.push(u); } }

    // Cache lookup (order matters, so we key by joined usernames string)
    const cacheKey = usernames.join('|');
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.status(200).json(cached.data);
    }

    // Build PostgREST OR filter: (username.eq.u1,username.eq.u2,...)
    const base = `${SUPABASE_URL}/rest/v1/onlyfans_profiles`;
    const params = new URLSearchParams();
    const selectCols = [
      'id','username','name','avatar','header','isverified','subscribeprice',
      'favoritedcount','subscriberscount','about','avatar_c144','avatar_c50'
    ].join(',');
    params.set('select', selectCols);
    params.set('limit', String(usernames.length));
    // OR expression
    const orExpr = '(' + usernames.map(u => `username.eq.${encodeURIComponent(u)}`).join(',') + ')';
    params.set('or', orExpr);

    const url = `${base}?${params.toString()}`;
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Accept-Profile': 'public',
      'Content-Profile': 'public'
    };

    let r;
    try { r = await fetch(url, { headers }); } catch (err) {
      return res.status(500).json({ error: 'fetch_error', detail: String(err && err.message) });
    }
    if (!r.ok) {
      const text = await r.text();
      return res.status(500).json({ error: 'upstream_error', status: r.status, detail: text });
    }
    const rows = await r.json();
    // Map for quick lookup
    const byUsername = new Map();
    (Array.isArray(rows) ? rows : []).forEach(item => {
      if (item && item.username) byUsername.set(item.username.toLowerCase(), item);
    });
    // Preserve original order
    const ordered = usernames
      .map(u => byUsername.get(u.toLowerCase()))
      .filter(Boolean)
      .map(item => ({
        ...item,
        isVerified: item.isverified === true || item.isverified === 'true',
        subscribePrice: item.subscribeprice
      }));

    // Cache store
    try { cache.set(cacheKey, { ts: Date.now(), data: ordered }); } catch {}

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.status(200).json(ordered);
  } catch (err) {
    console.error('api/wishlist error', err);
    return res.status(500).json({ error: 'internal_error', detail: err && err.message });
  }
}
