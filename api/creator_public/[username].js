// Creator profiles intentionally disabled.
// The scraper feeds Supabase directly; no public profile pages are served.
// 410 Gone tells Google/Bing to permanently de-index these URLs.
export default function handler(req, res) {
  res.status(410);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.send('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Gone</title><meta name="robots" content="noindex,nofollow"></head><body><h1>410 Gone</h1><p>This page has been permanently removed.</p></body></html>');
}
