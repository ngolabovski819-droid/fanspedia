// Lightweight analytics endpoint: logs events to serverless logs (best-effort)
// Method: POST
// Body: { event: string, slug?: string, q?: string, filters?: object, page?: number }
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }
    let body = {};
    try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); } catch {}
    const { event = 'unknown', slug = '', q = '', filters = {}, page = 1 } = body || {};
    // Log to serverless logs
    console.log('[analytics]', new Date().toISOString(), { event, slug, q, filters, page });
    // Return no-content to keep payload tiny
    return res.status(204).end();
  } catch (e) {
    console.error('analytics error', e);
    return res.status(204).end(); // swallow errors silently
  }
}
