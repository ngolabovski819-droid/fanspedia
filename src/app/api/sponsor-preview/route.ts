import { NextResponse } from 'next/server';
import { fetchCreatorsByUsernames } from '@/lib/supabase';
import { SEARCH_SPONSOR_USERNAMES } from '@/config/searchSponsor';

// Node.js runtime — same reasoning as /api/search (Supabase region latency).

export async function GET() {
  const headers = {
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  };

  if (SEARCH_SPONSOR_USERNAMES.length === 0) {
    return NextResponse.json([], { headers });
  }

  const creators = await fetchCreatorsByUsernames(SEARCH_SPONSOR_USERNAMES);
  const byUsername = new Map(creators.map((creator) => [creator.username.toLowerCase(), creator]));
  const ordered = SEARCH_SPONSOR_USERNAMES
    .map((username) => byUsername.get(username.toLowerCase()))
    .filter((creator) => creator !== undefined);
  return NextResponse.json(ordered, { headers });
}
