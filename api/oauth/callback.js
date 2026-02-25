export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    res.status(400).send(`OAuth error: ${error}`);
    return;
  }
  if (!code) {
    res.status(400).send('Missing code parameter');
    return;
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;

    if (!token) {
      res.status(400).send('Failed to get token: ' + JSON.stringify(tokenData));
      return;
    }

    // Send token back to Decap CMS via postMessage
    const tokenJson = JSON.stringify({ token, provider: 'github' });
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Authorizing...</title></head>
<body>
<p>Authorizing, please wait...</p>
<script>
(function() {
  var data = ${JSON.stringify(tokenJson)};
  function receiveMessage(e) {
    window.opener.postMessage(
      'authorization:github:success:' + data,
      e.origin
    );
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener.postMessage('authorizing:github', '*');
})();
</script>
</body>
</html>`);
  } catch (err) {
    res.status(500).send('Internal error: ' + String(err));
  }
}
