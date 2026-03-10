// API endpoint to fetch a single creator for trending reels
export default async function handler(req, res) {
  try {
    const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
    const SUPABASE_KEY = process.env.SUPABASE_KEY || "";
    
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ 
        error: 'Missing SUPABASE_URL or SUPABASE_KEY env vars'
      });
    }

    // Accept single id= or comma-separated ids= for batch fetching
    const idsParam = req.query.ids || req.query.id || '61786830';
    const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean).slice(0, 10);
    const idFilter = ids.length === 1 ? `id=eq.${ids[0]}` : `id=in.(${ids.join(',')})`;

    const url = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?${idFilter}&select=id,username,avatar,name,favoritedcount,stories`;
    
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Accept': 'application/json'
    };

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'Supabase fetch failed',
        status: response.status
      });
    }

    const data = await response.json();
    const creators = Array.isArray(data) ? data : [];

    // Cache at CDN edge for 5 minutes — creator avatars don't change often
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    // Legacy single-ID compat: if single id requested return { creator }
    if (ids.length === 1) {
      return res.status(200).json({ creator: creators[0] || null });
    }
    return res.status(200).json({ creators });
  } catch (err) {
    console.error('api/reel error', err);
    return res.status(500).json({ 
      error: 'internal_error', 
      message: err.message || String(err) 
    });
  }
}
