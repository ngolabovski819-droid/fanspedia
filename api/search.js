// Vercel serverless function (Node) to proxy queries to Supabase REST
// Expects SUPABASE_URL and SUPABASE_KEY to be set in Vercel Environment

// Simple in-memory cache. Note: serverless platforms may spin down instances so cache is best-effort.
const CACHE_TTL_MS = 60 * 1000; // 60s
const cache = new Map();

export default async function handler(req, res) {
  try {
    const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
    const SUPABASE_KEY = process.env.SUPABASE_KEY || "";
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ 
        error: 'Missing SUPABASE_URL or SUPABASE_KEY env vars',
        debug: {
          hasUrl: !!process.env.SUPABASE_URL,
          hasKey: !!process.env.SUPABASE_KEY
        }
      });
    }

    const q = (req.query.q || "").trim();
    const verified = (req.query.verified || "").toString().trim().toLowerCase();
    const bundles = (req.query.bundles || "").toString().trim().toLowerCase();
    const max_price = (req.query.price || "").toString().trim();
    const page = parseInt(req.query.page || "1", 10) || 1;
    const page_size = Math.max(1, Math.min(parseInt(req.query.page_size || "50", 10) || 50, 1000)); // Allow up to 1000 per request

    const selectCols = [
      "id","username","name","location","avatar",
      "isverified","subscribeprice","header","avatar_c50","avatar_c144","bundle1_price"
    ].join(',');

    const base = `${SUPABASE_URL}/rest/v1/onlyfans_profiles`;
    const params = new URLSearchParams();
    params.set('select', selectCols);
    params.set('order', 'favoritedcount.desc,subscribeprice.asc');
    params.set('limit', String(page_size));
    params.set('offset', String((page - 1) * page_size));

    if (q) {
      const ors = ['username','name','location','about'].map(c => `${c}.ilike.*${q}*`);
      params.set('or', `(${ors.join(',')})`);
    }

    if (verified === 'true' || verified === 'false') {
      params.set('isverified', `eq.${verified === 'true' ? 'true' : 'false'}`);
    }

    if (bundles === 'true') {
      params.set('bundle1_price', 'gt.0');
    }

    if (max_price) {
      const n = Number(max_price);
      if (!Number.isNaN(n)) params.set('subscribeprice', `lte.${n}`);
    }

    const url = `${base}?${params.toString()}`;
    // Check cache (keyed by final URL)
    const cacheKey = url;
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.status(200).json(cached.data);
    }
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Accept-Profile': 'public',
      'Content-Profile': 'public',
      'Prefer': 'count=exact'
    };

    const r = await fetch(url, { headers });
    if (!r.ok) {
      const text = await r.text();
      return res.status(500).json({ error: true, status: r.status, message: text });
    }

    const data = await r.json();

    // Store in cache
    cache.set(cacheKey, { data, ts: Date.now() });

    // Add cache-control headers to prevent stale responses
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Normalize field names to what the frontend expects (camelCase)
    const mapped = (Array.isArray(data) ? data : []).map(item => ({
      ...item,
      isVerified: item.isverified === true || item.isverified === 'true',
      subscribePrice: item.subscribeprice,
    }));

    // Save to cache (best-effort)
    try { cache.set(cacheKey, { ts: Date.now(), data: mapped }); } catch (e) { /* ignore */ }

    return res.status(200).json(mapped);
  } catch (err) {
    console.error('api/search error', err);
    return res.status(500).json({ error: 'internal_error', message: err.message || String(err) });
  }
}
