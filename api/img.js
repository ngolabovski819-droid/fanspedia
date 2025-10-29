// Image proxy to fetch and serve external images (avoids hotlink blocking)
export default async function handler(req, res) {
  try {
    const url = req.query.url || "";
    
    if (!url || !url.startsWith("http")) {
      return res.status(400).json({ error: "Missing or invalid 'url' query parameter" });
    }

    // Fetch the remote image
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      console.error(`Image proxy fetch failed: ${response.status} for ${url}`);
      return res.status(404).send('Image not found');
    }

    // Get content type and buffer
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();
    
    // Reject suspiciously small images (likely 1x1 tracking pixels or errors)
    // Most real avatar thumbnails are at least 500 bytes
    if (buffer.byteLength < 500) {
      console.warn(`Image too small (${buffer.byteLength} bytes), likely 1x1 pixel: ${url}`);
      return res.status(404).send('Invalid image');
    }

    // Set caching headers (24 hours)
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    res.setHeader('CDN-Cache-Control', 'public, max-age=86400');
    
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Image proxy error:', err);
    return res.status(500).send('Proxy error');
  }
}
