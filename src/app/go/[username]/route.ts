import { NextRequest, NextResponse } from 'next/server';
import { getSponsorOverride, resolveGoAlias } from '@/config/sponsors';
import { isBotUserAgent } from '@/lib/botDetection';
import { extractClientIp, hashIp, isDatacenterIp, isRateLimited, extractGeo } from '@/lib/clickIntegrity';
import { verifyClickToken } from '@/lib/clickToken';

// Node.js runtime (not Edge) — same reasoning as /api/search: keeps the function
// in the same region as Supabase so the click-log write (now awaited, see GET below)
// adds as little latency as possible.

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;
const CLICK_IP_SALT = process.env.CLICK_IP_SALT;
const CLICK_TOKEN_SECRET = process.env.CLICK_TOKEN_SECRET;

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

async function logClick(table: string, username: string, req: NextRequest, placementOverride: string | null) {
  try {
    const referrer = req.headers.get('referer') ?? null;
    const clientIp = extractClientIp(req.headers.get('x-forwarded-for'));
    const ipHash = clientIp && CLICK_IP_SALT ? hashIp(clientIp, CLICK_IP_SALT) : null;
    const linkVerified = CLICK_TOKEN_SECRET
      ? verifyClickToken(req.nextUrl.searchParams.get('t'), username, CLICK_TOKEN_SECRET)
      : false;
    const geo = extractGeo(req.headers);

    // Same IP hammering this exact link is a script, whatever UA it claims — checked before
    // logging so a rate-limited hit still gets its redirect but never counts as a click.
    if (ipHash) {
      const rateLimited = await isRateLimited({
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_KEY,
        table,
        timestampColumn: 'clicked_at',
        ipHash,
      });
      if (rateLimited) return;
    }

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
          placement: placementOverride ?? derivePlacement(referrer),
          ip_hash: ipHash,
          is_datacenter_ip: isDatacenterIp(clientIp),
          link_verified: linkVerified,
          ip_address: clientIp,
          country: geo.country,
          city: geo.city,
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
  const { username: slug } = await params;
  // Vanity aliases (GO_ALIASES in src/config/sponsors.ts): `/go/sierraskyprivate` resolves
  // to rinayanami's linkOverride + clickTable and is logged as placement
  // 'vanity:sierraskyprivate', so every shared link reports separately in the panel.
  // Non-aliases resolve to themselves, so plain `/go/<username>` is unchanged.
  const { username, isAlias } = resolveGoAlias(slug);
  const override = getSponsorOverride(username);
  const destination = override?.linkOverride ?? `https://onlyfans.com/${username}`;
  // Lets a specific widget (e.g. the search-history dropdown) self-identify its
  // placement instead of relying on derivePlacement()'s referrer-path guess,
  // which can't tell "clicked from a dropdown on this page" from "clicked the
  // page's own grid card". A vanity alias self-identifies the same way.
  const placementOverride =
    req.nextUrl.searchParams.get('placement') ?? (isAlias ? `vanity:${slug.trim().toLowerCase()}` : null);

  const ua = req.headers.get('user-agent') ?? '';
  if (override?.clickTable && !isBotUserAgent(ua)) {
    // Awaited, NOT deferred via after() — a previous `after()`-based version of this let the
    // redirect return before the row (and the rate-limit check it depends on) landed, so a
    // rapid-fire script could get several requests' worth of "no prior clicks yet" checks in
    // before any of them had actually written a row (verified directly: 7 rapid hits from the
    // same IP all got logged instead of being capped at 5). Rate limiting only means anything
    // if "how many clicks already happened" is accurate at check time, which requires the write
    // to finish before the next request's check can run — same tradeoff onlyamericanfans.com
    // already made ("click accuracy for a paid deliverable matters more than shaving ~50-100ms").
    await logClick(override.clickTable, username, req, placementOverride);
  }

  return NextResponse.redirect(destination, { status: 302 });
}
