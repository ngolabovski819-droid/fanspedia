// Signed, short-lived proof that a /go/[username] link came from a page this site actually
// rendered — not a URL a script guessed or enumerated cold (exactly the pattern behind every
// bot hit found in this network's click logs: no referrer, straight to /go/, no prior page
// load). Minted server-side wherever a sponsored creator's card renders
// (src/lib/sponsorOverrides.ts), verified in the redirect route (src/pages/go/[username].ts).
//
// Deliberately NOT a hard gate: a missing/invalid token does not block logging — it only sets
// the click's link_verified column to false. A hard block risks silently losing real clicks on
// any edge case this rollout didn't anticipate (an old cached page whose token expired, a
// bookmarked/shared raw link, a rendering path this pass missed across a large site). The
// token instead powers a *visibility* signal — "what fraction of clicks are provably tied to a
// real page render" — that can graduate to an actual gate later, once the verified-rate has
// been observed in production and trusted.
import crypto from 'node:crypto';

const TOKEN_TTL_SECONDS = 30 * 60; // generous enough for a real visitor to browse before clicking

function sign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

// One token per (username, page render) — embed as `?t=<token>` on that creator's /go/ link.
export function mintClickToken(username: string, secret: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = `${username.toLowerCase()}:${expiresAt}`;
  const payloadB64 = Buffer.from(payload, 'utf8').toString('base64url');
  return `${payloadB64}.${sign(payloadB64, secret)}`;
}

// Not constant-time — fine here, since this isn't an auth token guarding access to anything.
// The worst case of a timing side-channel is someone learns a bit faster whether a click
// "counts", not any actual account/data access.
export function verifyClickToken(token: string | null | undefined, username: string, secret: string): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, signature] = parts;
  if (sign(payloadB64, secret) !== signature) return false;

  let payload: string;
  try {
    payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
  } catch {
    return false;
  }
  const [tokenUsername, expiresAtStr] = payload.split(':');
  const expiresAt = Number(expiresAtStr);
  if (!tokenUsername || !Number.isFinite(expiresAt)) return false;
  if (tokenUsername !== username.toLowerCase()) return false;
  return Math.floor(Date.now() / 1000) < expiresAt;
}
