// Two independent, additive signals beyond the User-Agent bot filter (src/lib/botDetection.ts),
// aimed at scripts that never touch the UA string at all: same-IP rate limiting (blocking) and
// a best-effort datacenter/hosting-provider flag (informational only, see the caveat below).
//
// Nothing here ever stores a raw IP address. The click tables only ever get a salted SHA-256
// hash (CLICK_IP_SALT env var, shared across all 4 network sites) — enough to match "this is
// the same IP as N seconds ago" for rate-limiting, not enough to be a stored identifier.
import crypto from 'node:crypto';

export function extractClientIp(forwardedFor: string | null): string | null {
  // x-forwarded-for is a comma-separated hop chain (client, proxy1, proxy2, ...) set by
  // Vercel's edge network — the first entry is the original client.
  if (!forwardedFor) return null;
  const first = forwardedFor.split(',')[0]?.trim();
  return first || null;
}

export function hashIp(ip: string, salt: string): string {
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

export interface ClickGeo {
  country: string | null;
  city: string | null;
}

// Vercel's edge network attaches these to every request that reaches a serverless function —
// no third-party GeoIP call, no extra latency, no cost. Only present in production (Vercel's
// own infrastructure sets them); always absent in local dev, which is expected, not a bug.
// x-vercel-ip-city is URI-encoded (spaces etc.), the others aren't.
export function extractGeo(headers: { get(name: string): string | null }): ClickGeo {
  const country = headers.get('x-vercel-ip-country');
  const rawCity = headers.get('x-vercel-ip-city');
  let city: string | null = null;
  if (rawCity) {
    try {
      city = decodeURIComponent(rawCity);
    } catch {
      city = rawCity;
    }
  }
  return { country, city };
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isInCidr(ip: string, cidr: string): boolean {
  const [rangeIp, prefixStr] = cidr.split('/');
  const prefix = Number(prefixStr);
  const ipInt = ipv4ToInt(ip);
  const rangeInt = ipv4ToInt(rangeIp);
  if (ipInt === null || rangeInt === null) return false;
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

// CAVEAT — read before trusting this for anything beyond reporting: this is a short, hand-
// maintained list of well-known blocks for budget VPS providers that generic scraping/bot
// scripts commonly run on (chosen over AWS/GCP/Azure specifically because their allocations are
// enormous, fragmented, and change constantly — a hand-typed list for them risks being wrong in
// ways that are hard to notice). Even for the providers below, ranges get reassigned over time;
// treat a `true` here as "worth a second look in reporting," not as ground truth. It is
// deliberately NOT wired into the block/skip decision below for that reason — only the rate
// limit is. Replace with a real IP-intelligence service (IPinfo, MaxMind, etc.) if/when this
// needs to be authoritative rather than best-effort.
const DATACENTER_RANGES: { cidr: string; provider: string }[] = [
  // DigitalOcean
  { cidr: '134.209.0.0/16', provider: 'DigitalOcean' },
  { cidr: '138.68.0.0/16', provider: 'DigitalOcean' },
  { cidr: '142.93.0.0/16', provider: 'DigitalOcean' },
  { cidr: '159.65.0.0/16', provider: 'DigitalOcean' },
  { cidr: '159.89.0.0/16', provider: 'DigitalOcean' },
  { cidr: '164.90.0.0/16', provider: 'DigitalOcean' },
  { cidr: '167.71.0.0/16', provider: 'DigitalOcean' },
  { cidr: '167.99.0.0/16', provider: 'DigitalOcean' },
  { cidr: '178.62.0.0/16', provider: 'DigitalOcean' },
  { cidr: '206.189.0.0/16', provider: 'DigitalOcean' },
  // Hetzner
  { cidr: '5.9.0.0/16', provider: 'Hetzner' },
  { cidr: '78.46.0.0/15', provider: 'Hetzner' },
  { cidr: '88.99.0.0/16', provider: 'Hetzner' },
  { cidr: '95.216.0.0/15', provider: 'Hetzner' },
  { cidr: '116.202.0.0/16', provider: 'Hetzner' },
  { cidr: '138.201.0.0/16', provider: 'Hetzner' },
  { cidr: '168.119.0.0/16', provider: 'Hetzner' },
  { cidr: '176.9.0.0/16', provider: 'Hetzner' },
  // OVH
  { cidr: '51.68.0.0/14', provider: 'OVH' },
  { cidr: '54.36.0.0/14', provider: 'OVH' },
  { cidr: '141.94.0.0/16', provider: 'OVH' },
  { cidr: '145.239.0.0/16', provider: 'OVH' },
  { cidr: '158.69.0.0/16', provider: 'OVH' },
  // Linode / Akamai
  { cidr: '45.33.0.0/16', provider: 'Linode' },
  { cidr: '45.79.0.0/16', provider: 'Linode' },
  { cidr: '139.162.0.0/16', provider: 'Linode' },
  { cidr: '172.104.0.0/15', provider: 'Linode' },
  { cidr: '173.255.192.0/18', provider: 'Linode' },
  // Vultr
  { cidr: '45.32.0.0/16', provider: 'Vultr' },
  { cidr: '45.63.0.0/16', provider: 'Vultr' },
  { cidr: '45.76.0.0/16', provider: 'Vultr' },
  { cidr: '108.61.0.0/16', provider: 'Vultr' },
  { cidr: '149.28.0.0/16', provider: 'Vultr' },
];

export function isDatacenterIp(ip: string | null): boolean {
  if (!ip) return false;
  return DATACENTER_RANGES.some((r) => isInCidr(ip, r.cidr));
}

interface RateLimitParams {
  supabaseUrl: string;
  supabaseKey: string;
  table: string;
  timestampColumn: string;
  ipHash: string;
  windowSeconds?: number;
  maxClicks?: number;
}

// Same IP hitting the same sponsored link `maxClicks` times inside `windowSeconds` is a script,
// not a person — no real visitor re-clicks an outbound link 5 times in 10 seconds. Scoped per
// table (i.e. per creator per site), not globally per IP, so one visitor legitimately clicking
// several different creators' links in one session is never affected.
export async function isRateLimited({
  supabaseUrl,
  supabaseKey,
  table,
  timestampColumn,
  ipHash,
  windowSeconds = 10,
  maxClicks = 5,
}: RateLimitParams): Promise<boolean> {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const params = new URLSearchParams({
    select: 'id',
    ip_hash: `eq.${ipHash}`,
    [timestampColumn]: `gte.${since}`,
  });
  try {
    // Range: 0-0 asks PostgREST for just the first row (cheap), while Prefer: count=exact
    // still reports the true total of every matching row in Content-Range, unaffected by that.
    const resp = await fetch(`${supabaseUrl}/rest/v1/${table}?${params}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: 'count=exact',
        Range: '0-0',
      },
    });
    if (!resp.ok) return false; // fail open — a broken check must never block a real click
    const contentRange = resp.headers.get('content-range'); // "0-0/<total>"
    const total = contentRange ? Number(contentRange.split('/')[1]) : NaN;
    if (!Number.isFinite(total)) return false;
    return total >= maxClicks;
  } catch {
    return false; // fail open — same reasoning as above
  }
}
