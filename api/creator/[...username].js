/* Lines 1-200 omitted - identical to previous [...params].js */
// ...existing code...
export default async function handler(req, res) {
  // Vercel catch-all: req.query.username is array for [...username]
  let username = req.query.username;
  console.log('[SSR] Incoming request path:', req.url);
  console.log('[SSR] Raw params:', username);
  if (Array.isArray(username)) {
    username = username.join('.');
  }
  console.log('[SSR] Parsed username:', username);
  if (!username) {
    console.log('[SSR] No username provided');
    res.status(400).send('Username required');
    return;
  }
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 2000)
    );
    const creator = await Promise.race([
      fetchCreator(username),
      timeoutPromise
    ]).catch(() => null);
    console.log('[SSR] Supabase result:', creator);
    if (!creator) {
      console.log('[SSR] Creator not found, sending 404');
      res.status(404);
      res.setHeader('X-SSR-Handler', 'creator-ssr-username');
      res.setHeader('X-SSR-Username', String(username));
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
      res.send(generate404Html(username));
      return;
    }
    const { html, etag } = generateHtml(creator);
    console.log('[SSR] Sending 200 response for creator:', username);
  res.setHeader('X-SSR-Handler', 'creator-ssr-username');
  res.setHeader('X-SSR-Username', String(username));
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('ETag', etag);
    res.setHeader('Vary', 'Accept-Encoding');
    const clientEtag = req.headers['if-none-match'];
    if (clientEtag === etag) {
      console.log('[SSR] ETag match, sending 304');
      res.status(304).end();
      return;
    }
    res.status(200).send(html);
  } catch (error) {
    console.error('SSR error:', error);
    res.status(500);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Render-Error', 'true');
    res.send(`<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"UTF-8\">
  <meta name=\"robots\" content=\"noindex\">
  <title>Loading Creator Profile...</title>
  <meta http-equiv=\"refresh\" content=\"0;url=/creator.html?username=${encodeURIComponent(username)}\">
</head>
<body>
  <p>Loading... <a href=\"/creator.html?username=${encodeURIComponent(username)}\">Click here if not redirected</a></p>
</body>
</html>`);
  }
}
/* Lines 201-287 omitted - identical to previous [...params].js */