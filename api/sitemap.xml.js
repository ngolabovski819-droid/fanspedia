/**
 * Dynamic Sitemap Generator for Creator Profiles
 * Lists top N active creators with proper lastmod dates
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const BASE_URL = 'https://bestonlyfansgirls.net';
const MAX_CREATORS = 1000; // Top 1000 creators by favorites

export default async function handler(req, res) {
  try {
    // Fetch top active creators sorted by popularity
    const url = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?select=username,last_seen_at,firstpublishedpostdate&status=eq.active&order=favoritedcount.desc&limit=${MAX_CREATORS}`;
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Accept-Profile': 'public'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch creators');
    }
    
    const creators = await response.json();
    
    // Generate sitemap XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>
  
  <!-- Categories Hub -->
  <url>
    <loc>${BASE_URL}/categories/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>
  
`;

    // Add creator profiles
    for (const creator of creators) {
      // Use last_seen_at or firstpublishedpostdate as lastmod, or current date
      let lastmod = creator.last_seen_at || creator.firstpublishedpostdate;
      if (lastmod) {
        // Extract just the date part (YYYY-MM-DD)
        lastmod = lastmod.split('T')[0];
      } else {
        lastmod = new Date().toISOString().split('T')[0];
      }
      
      xml += `  <url>
    <loc>${BASE_URL}/${creator.username}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
    <lastmod>${lastmod}</lastmod>
  </url>
`;
    }
    
    xml += `</urlset>`;
    
    // Set headers for XML and cache for 1 day
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400'); // Cache at edge for 24h
    
    res.status(200).send(xml);
    
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>');
  }
}
