// Creator profiles intentionally disabled.
// Redirect all old creator URLs (/:username and /c/:id/:slug) to homepage.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  return res.redirect(301, '/');
}
