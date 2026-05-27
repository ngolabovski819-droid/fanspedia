import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;

const CARD_COLS = 'id,username,name,avatar,avatar_c144,isverified,subscribeprice';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('usernames') ?? '';
  // Sanitize: only allow safe username characters to prevent PostgREST injection
  const usernames = raw
    .split(',')
    .map((s) => s.trim().replace(/[^a-zA-Z0-9_.-]/g, ''))
    .filter(Boolean)
    .slice(0, 50); // hard cap

  if (usernames.length === 0) {
    return NextResponse.json({ creators: [] });
  }

  const list = usernames.join(',');
  const url = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?select=${CARD_COLS}&username=in.(${list})`;

  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Accept-Profile': 'public',
        Prefer: 'count=none',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ creators: [] }, { status: 502 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: Record<string, any>[] = await res.json();
    const creators = rows.map((row) => ({
      id: row.id,
      username: row.username,
      name: row.name ?? null,
      avatar: row.avatar ?? null,
      avatarC144: row.avatar_c144 ?? null,
      isVerified: Boolean(row.isverified),
      subscribePrice: row.subscribeprice ?? null,
    }));

    return NextResponse.json({ creators });
  } catch {
    return NextResponse.json({ creators: [] }, { status: 502 });
  }
}
