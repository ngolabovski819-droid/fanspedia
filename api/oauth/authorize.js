export default function handler(req, res) {
  const clientId = process.env.OAUTH_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('OAUTH_CLIENT_ID not configured');
    return;
  }
  const callbackUrl = 'https://www.fanspedia.net/api/oauth/callback';
  const scope = 'repo,user';
  const state = Math.random().toString(36).substr(2, 16);
  const url =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${state}`;
  res.redirect(302, url);
}
