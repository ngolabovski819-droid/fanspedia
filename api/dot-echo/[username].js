export default function handler(req, res) {
  let u = req.query.username;
  if (Array.isArray(u)) u = u.join('.');
  res.setHeader('Content-Type','application/json');
  res.setHeader('X-Dot-Echo','1');
  res.status(200).json({ ok: true, username: u, path: req.url });
}