import { NextResponse } from 'next/server';
import { fetchCreatorsByUsernames } from '@/lib/supabase';
import { SEARCH_SPONSOR_USERNAME } from '@/config/searchSponsor';

// Node.js runtime — same reasoning as /api/search (Supabase region latency).

export async function GET() {
  const headers = {
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  };

  if (!SEARCH_SPONSOR_USERNAME) {
    return NextResponse.json(null, { headers });
  }

  const [creator] = await fetchCreatorsByUsernames([SEARCH_SPONSOR_USERNAME]);
  return NextResponse.json(creator ?? null, { headers });
}
