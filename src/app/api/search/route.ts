import { NextRequest, NextResponse } from 'next/server';
import { fetchCreators } from '@/lib/supabase';

// Node.js runtime (not Edge) — keeps function in iad1 (same region as Supabase us-east-1).
// Edge Runtime caused 18s+ hangs because cross-region latency killed the Supabase fetch.

// Simple in-memory rate limiter: 15 requests per 10 seconds per IP
const rateMap = new Map<string, { count: number; reset: number }>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + 10_000 });
    return true;
  }
  if (entry.count >= 15) return false;
  entry.count++;
  return true;
}

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  if (!checkRate(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;

  const q = searchParams.get('q') ?? undefined;
  const page = parseInt(searchParams.get('page') ?? '0', 10);
  const pageSize = Math.min(parseInt(searchParams.get('page_size') ?? '24', 10), 48);
  const sort = (searchParams.get('sort') ?? 'popular') as 'popular' | 'new' | 'price_asc' | 'price_desc';
  const verified = searchParams.get('verified') === '1';
  const maxPrice = searchParams.has('price') ? parseFloat(searchParams.get('price')!) : undefined;
  const skipLocationFilter = searchParams.get('skip_location_filter') === '1';

  const locationTermsRaw = searchParams.get('location_terms');
  const locationTerms = locationTermsRaw ? locationTermsRaw.split(',').filter(Boolean) : undefined;

  const categoryTermsRaw = searchParams.get('category_terms');
  const categoryTerms = categoryTermsRaw ? categoryTermsRaw.split(',').filter(Boolean) : undefined;

  const result = await fetchCreators({
    q,
    page,
    pageSize,
    sort,
    verified: verified || undefined,
    maxPrice,
    skipLocationFilter,
    locationTerms,
    categoryTerms,
    revalidate: 3600,
    maxRetries: 2, // fail fast at runtime — max ~3s delay vs 10s with 5 retries
  });

  return NextResponse.json(result, {
    headers: {
      // Cache at Vercel's edge for 1 hour; serve stale for up to 24h while
      // revalidating in background. Reduces Supabase hits dramatically and
      // keeps creators visible even when Supabase CPU is exhausted.
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
