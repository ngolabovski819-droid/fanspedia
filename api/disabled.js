export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, must-revalidate');
  // 410 Gone communicates the feature is intentionally unavailable
  res.status(410).json({ ok: false, disabled: true, feature: 'creator-profiles', message: 'Creator profiles are temporarily disabled.' });
}
