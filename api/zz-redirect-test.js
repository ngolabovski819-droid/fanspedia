// Simple health-style JSON endpoint that cannot be shadowed by rewrites
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, must-revalidate');
  const info = {
    ok: true,
    handler: 'api/zz-redirect-test',
    method: req.method,
    url: req.url,
    host: req.headers?.host || null,
    env: {
      supabaseUrl: !!process.env.SUPABASE_URL,
      supabaseKey: !!process.env.SUPABASE_KEY
    },
    timestamp: new Date().toISOString()
  };
  res.status(200).json(info);
}
