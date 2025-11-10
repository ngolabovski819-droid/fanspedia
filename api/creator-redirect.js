// Redirect old /creator.html?u=username URLs to clean /:username format
export default function handler(req, res) {
  const { u } = req.query;
  
  if (u) {
    // 301 permanent redirect to clean URL
    res.writeHead(301, { Location: `/${u}` });
    res.end();
  } else {
    // No username provided, redirect to homepage
    res.writeHead(302, { Location: '/' });
    res.end();
  }
}
