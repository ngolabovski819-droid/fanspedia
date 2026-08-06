// Mints short-lived click-verification tokens (src/lib/clickToken.ts) for sponsored creators,
// called by client-side JS after a page has actually loaded (src/components/
// SponsoredLinkTokenizer.tsx) — never at render time, since this site's creator listings are
// either ISR-cached (up to 24h) or served from a CDN-cached /api/search response.
//
// Always uncached (Cache-Control: no-store) — the whole point is that this reflects "someone's
// browser is looking at this page right now," not a value that can be fetched once and reused.
//
// What this actually proves, and what it doesn't: a plain HTTP client (curl/requests/aiohttp/
// Go/Java — every bot UA actually seen in this network's click logs) never executes page
// JavaScript at all, so it never calls this endpoint in the normal course of hitting /go/
// directly, which is the exact pattern behind every confirmed bot hit audited so far. A
// `Sec-Fetch-Site` header check was tried and dropped — tested directly and found unreliable on
// genuine browser requests AND trivially forgeable by any script willing to set it, so it added
// false confidence without real protection. This is a real, if modest, hurdle against the
// passive/naive scripts actually observed here, not a wall against someone who deliberately
// reverse-engineers and replicates this exact call.
import { NextRequest, NextResponse } from 'next/server';
import { getSponsorOverride } from '@/config/sponsors';
import { isBotUserAgent } from '@/lib/botDetection';
import { mintClickToken } from '@/lib/clickToken';

export const runtime = 'nodejs';

const CLICK_TOKEN_SECRET = process.env.CLICK_TOKEN_SECRET;

export async function GET(req: NextRequest) {
  const usernames = (req.nextUrl.searchParams.get('u') ?? '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, 20); // defensive cap — no real page renders anywhere near this many sponsored cards

  const userAgent = req.headers.get('user-agent') ?? '';
  const tokens: Record<string, string> = {};

  if (!isBotUserAgent(userAgent) && CLICK_TOKEN_SECRET) {
    for (const username of usernames) {
      const override = getSponsorOverride(username);
      if (override?.clickTable || override?.linkOverride) {
        tokens[username.toLowerCase()] = mintClickToken(username, CLICK_TOKEN_SECRET);
      }
    }
  }

  return NextResponse.json({ tokens }, { headers: { 'Cache-Control': 'no-store' } });
}
