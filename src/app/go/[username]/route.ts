import { NextRequest, NextResponse, after } from 'next/server';
import { getSponsorOverride } from '@/config/sponsors';

// Node.js runtime (not Edge) — same reasoning as /api/search: keeps the function
// in the same region as Supabase so the click-log write doesn't add latency.

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;

// Best-effort bot filter so crawlers/scanners don't inflate delivered-click counts.
const BOT_UA_RE = /bot|crawl|spider|slurp|curl|wget|python-requests|headless|facebookexternalhit|bingpreview/i;

const OWN_HOSTS = new Set(['fanspedia.net', 'www.fanspedia.net']);

/**
 * Turn a raw Referer header into a short human-readable placement label —
 * 'home' / 'category:bbw' / 'country:germany' / 'profile' for our own pages,
 * `external:<hostname>` for anywhere else (e.g. the client's own site), or
 * null when no referrer was sent at all (some platforms strip it).
 */
function derivePlacement(referrer: string | null): string | null {
  if (!referrer) return null;
  let url: URL;
  try {
    url = new URL(referrer);
  } catch {
    return null;
  }
  if (!OWN_HOSTS.has(url.hostname)) return `external:${url.hostname}`;

  const path = url.pathname;
  if (path === '/') return 'home';
  if (path.startsWith('/categories/')) return `category:${path.split('/')[2] ?? ''}`;
  if (path.startsWith('/country/')) return `country:${path.split('/')[2] ?? ''}`;
  if (path.startsWith('/creator/')) return 'profile';
  if (path.startsWith('/search')) return 'search';
  if (path.startsWith('/wishlist')) return 'wishlist';
  return path;
}

async function logClick(table: string, req: NextRequest) {
  try {
    const referrer = req.headers.get('referer') ?? null;
    await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify([
        {
          user_agent: req.headers.get('user-agent') ?? null,
          referrer,
          placement: derivePlacement(referrer),
        },
      ]),
    });
  } catch {
    // Never let a logging failure break the redirect.
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const override = getSponsorOverride(username);
  const destination = override?.linkOverride ?? `https://onlyfans.com/${username}`;

  const ua = req.headers.get('user-agent') ?? '';
  if (override?.clickTable && !BOT_UA_RE.test(ua)) {
    // Runs after the redirect response is sent — visitor doesn't wait on it, and
    // `after()` (vs. a bare unawaited call) keeps it alive past the response on Vercel.
    after(() => logClick(override.clickTable!, req));
  }

  return NextResponse.redirect(destination, { status: 302 });
}
