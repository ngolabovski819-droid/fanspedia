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

    const creatorId = req.query.id || '61786830';
    
    const url = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?id=eq.${creatorId}&select=id,username,avatar,stories,name,favoritedcount`;
    
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
    
    // Return first result or null
    const creator = data && data.length > 0 ? data[0] : null;
    
    return res.status(200).json({ creator });
  } catch (err) {
    console.error('api/reel error', err);
    return res.status(500).json({ 
      error: 'internal_error', 
      message: err.message || String(err) 
    });
  }
}
