import type { Creator, CreatorProfile, BundleOffer, Snapshot } from '@/types/creator';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;

// Only select columns that CreatorCard actually renders — keeps payloads small.
// ORDER BY (favoritedcount) works without it being in SELECT.
const CARD_COLS = [
  'id', 'username', 'name',
  'avatar', 'avatar_c144',
  'isverified', 'subscribeprice',
].join(',');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCreator(row: Record<string, any>): Creator {
  return {
    id: row.id,
    username: row.username,
    name: row.name ?? null,
    avatar: row.avatar ?? null,
    avatarC144: row.avatar_c144 ?? null,
    isVerified: Boolean(row.isverified),
    subscribePrice: row.subscribeprice ?? null,
  };
}

export interface SearchParams {
  q?: string;
  verified?: boolean;
  maxPrice?: number;
  sort?: 'popular' | 'new' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
  locationTerms?: string[];
  categoryTerms?: string[];
  skipLocationFilter?: boolean;
  revalidate?: number;
  /** Max Supabase retry attempts on 500/504. Default 2. */
  maxRetries?: number;
  /** Usernames to exclude from results at the DB level (case-insensitive-ish). */
  excludeUsernames?: string[];
  /** Explicit row offset. Overrides page*pageSize when provided. */
  offset?: number;
}

export interface SearchResult {
  creators: Creator[];
  total: number;
  hasMore: boolean;
}

export async function fetchCreators(params: SearchParams = {}): Promise<SearchResult> {
  const {
    q,
    verified,
    maxPrice,
    sort = 'popular',
    page = 0,
    pageSize = 24,
    locationTerms,
    categoryTerms,
    skipLocationFilter = false,
    revalidate = 3600,
    maxRetries = 2,
    excludeUsernames,
    offset,
  } = params;

  const base = `${SUPABASE_URL}/rest/v1/onlyfans_profiles`;
  const urlParams = new URLSearchParams();

  urlParams.set('select', CARD_COLS);

  if (verified) urlParams.set('isverified', 'eq.true');
  if (maxPrice !== undefined) urlParams.set('subscribeprice', `lte.${maxPrice}`);

  // Sorting
  switch (sort) {
    case 'popular':    urlParams.set('order', 'favoritedcount.desc.nullslast'); break;
    case 'new':        urlParams.set('order', 'id.desc'); break;
    case 'price_asc':  urlParams.set('order', 'subscribeprice.asc.nullslast'); break;
    case 'price_desc': urlParams.set('order', 'subscribeprice.desc.nullslast'); break;
  }

  // Pagination
  urlParams.set('limit', String(pageSize));
  urlParams.set('offset', String(offset ?? page * pageSize));

  let urlStr = `${base}?${urlParams.toString()}`;

  // Location filter — target `location` column only to avoid false positives
  if (!skipLocationFilter && locationTerms && locationTerms.length > 0) {
    const terms = locationTerms.filter((t) => t.length >= 3);
    if (terms.length > 0) {
      const locClauses = terms.map((t) => `location.ilike.*${t}*`).join(',');
      urlStr += `&or=(${locClauses})`;
    }
  }

  // Category / text search filter — use search_text (single indexed column) for speed
  if (categoryTerms && categoryTerms.length > 0) {
    const clauses = categoryTerms.map((t) => `search_text.ilike.*${t}*`);
    urlStr += `&or=(${clauses.join(',')})`;
  } else if (q) {
    // Split multi-word queries into tokens and AND them together.
    // PostgREST ANDs multiple same-column filters: &col=ilike.*a*&col=ilike.*b*
    // e.g. "big cock oral" → must contain "big" AND "cock" AND "oral"
    const tokens = q.trim().split(/\s+/).filter((w) => w.length >= 2);
    if (tokens.length <= 1) {
      urlStr += `&search_text=ilike.*${encodeURIComponent(q.trim())}*`;
    } else {
      for (const token of tokens) {
        urlStr += `&search_text=ilike.*${encodeURIComponent(token)}*`;
      }
    }
  }

  // Exclude specific usernames at the DB level so offset/limit stay aligned.
  if (excludeUsernames && excludeUsernames.length > 0) {
    const list = excludeUsernames
      .map((u) => `"${u.replace(/"/g, '')}"`)
      .join(',');
    urlStr += `&username=not.in.(${list})`;
  }

  const fetchOptions = {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Accept-Profile': 'public',
      // count=planned uses pg_class.reltuples and is ~10x faster than
      // count=estimated for filtered OR-ilike queries (160ms vs 1.5s on a
      // 4-term ilike OR over 474k rows). The displayed total is slightly
      // approximate but that's fine for "X creators" UI — exact counts aren't
      // worth the latency tax. Subsequent pages skip counting entirely.
      Prefer: page === 0 ? 'count=planned' : 'count=none',
    },
    next: { revalidate },
    // Hard 20-second timeout — prevents build workers from hanging 60s waiting
    // for a slow Supabase response and getting killed by Next.js's page timeout.
    signal: AbortSignal.timeout(20000),
  };

  // Retry on 500 (transient Supabase overload). Fail fast on timeout/504.
  let res: Response | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      res = await fetch(urlStr, fetchOptions);
    } catch {
      // AbortError from 20s timeout — fail immediately, don't retry
      console.error('Supabase fetch error (timeout)', urlStr);
      return { creators: [], total: 0, hasMore: false };
    }
    if (res.ok) break;
    if (res.status !== 500 || attempt === maxRetries - 1) break;
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
  }

  if (!res || !res.ok) {
    console.error('Supabase fetch error', res?.status, urlStr);
    return { creators: [], total: 0, hasMore: false };
  }

  const contentRange = res.headers.get('content-range') ?? '';
  const rawTotal = parseInt(contentRange.split('/')[1] ?? '0', 10) || 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: Record<string, any>[] = await res.json();
  const creators = rows.map(mapCreator);

  const hasMore = creators.length === pageSize;
  const effectiveOffset = offset ?? page * pageSize;
  // count=planned uses pg_class statistics and can wildly undercount filtered
  // queries (e.g. argentina ilike-OR returns planned=190 but exact=5454).
  // Clamp the displayed total to a sensible floor so "X creators found" never
  // contradicts what the user is actually seeing on screen.
  const floor = effectiveOffset + creators.length + (hasMore ? 1 : 0);
  const total = Math.max(rawTotal, floor);

  return {
    creators,
    total,
    // Use page-length check rather than estimated total — count=estimated can be
    // inaccurate, and if a fetch returns 0 rows this keeps hasMore=false so the
    // Load More button disappears instead of staying stuck.
    hasMore,
  };
}

/**
 * Fetch specific creators by exact username (case-insensitive).
 * Used to "pin" featured creators onto a page even when they don't
 * naturally rank into the popular results. Returns whatever is found —
 * missing usernames are silently skipped.
 */
export async function fetchCreatorsByUsernames(
  usernames: string[],
  revalidate = 86400,
): Promise<Creator[]> {
  const cleaned = usernames.map((u) => u.trim()).filter(Boolean);
  if (cleaned.length === 0) return [];

  const base = `${SUPABASE_URL}/rest/v1/onlyfans_profiles`;
  const urlParams = new URLSearchParams();
  urlParams.set('select', CARD_COLS);
  // Case-insensitive match on each username, OR'd together.
  const orClauses = cleaned.map((u) => `username.ilike.${u}`).join(',');
  urlParams.set('or', `(${orClauses})`);
  urlParams.set('limit', String(cleaned.length));

  const urlStr = `${base}?${urlParams.toString()}`;

  try {
    const res = await fetch(urlStr, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Accept-Profile': 'public',
        Prefer: 'count=none',
      },
      next: { revalidate },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.error('Supabase fetchCreatorsByUsernames error', res.status, urlStr);
      return [];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: Record<string, any>[] = await res.json();
    return rows.map(mapCreator);
  } catch {
    console.error('Supabase fetchCreatorsByUsernames error (timeout)', urlStr);
    return [];
  }
}

// Full set of columns for the standalone creator profile page.
const PROFILE_COLS = [
  'id', 'username', 'name', 'about', 'location',
  'avatar', 'avatar_c144', 'header',
  'isverified', 'subscribeprice',
  'favoritedcount', 'photoscount', 'videoscount', 'postscount',
  'audioscount', 'mediascount', 'archivedpostscount', 'finishedstreamscount',
  'subscriberscount', 'joindate', 'lastseen',
  'bundle1_price', 'bundle1_discount', 'bundle1_duration',
  'bundle2_price', 'bundle2_discount', 'bundle2_duration',
  'bundle3_price', 'bundle3_discount', 'bundle3_duration',
].join(',');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBundles(row: Record<string, any>): BundleOffer[] {
  const bundles: BundleOffer[] = [];
  for (const i of [1, 2, 3]) {
    const price = row[`bundle${i}_price`];
    const duration = row[`bundle${i}_duration`];
    if (price != null && duration != null) {
      bundles.push({
        duration: Number(duration),
        price: Number(price),
        discount: row[`bundle${i}_discount`] != null ? Number(row[`bundle${i}_discount`]) : 0,
      });
    }
  }
  return bundles.sort((a, b) => a.duration - b.duration);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfile(row: Record<string, any>): CreatorProfile {
  return {
    id: row.id,
    username: row.username,
    name: row.name ?? null,
    avatar: row.avatar ?? null,
    avatarC144: row.avatar_c144 ?? null,
    isVerified: Boolean(row.isverified),
    subscribePrice: row.subscribeprice ?? null,
    about: row.about ?? null,
    location: row.location ?? null,
    header: row.header ?? null,
    favoritedCount: row.favoritedcount ?? null,
    photosCount: row.photoscount ?? null,
    videosCount: row.videoscount ?? null,
    postsCount: row.postscount ?? null,
    audiosCount: row.audioscount ?? null,
    mediasCount: row.mediascount ?? null,
    archivedPostsCount: row.archivedpostscount ?? null,
    finishedStreamsCount: row.finishedstreamscount ?? null,
    subscribersCount: row.subscriberscount ?? null,
    joinDate: row.joindate ?? null,
    lastSeen: row.lastseen ?? null,
    bundles: mapBundles(row),
  };
}

/**
 * Fetch a single full creator profile by exact username (case-insensitive).
 * Returns null when no creator matches — the page renders a 404.
 */
export async function fetchCreatorProfile(
  username: string,
  revalidate = 300,
): Promise<CreatorProfile | null> {
  const clean = username.trim();
  if (!clean) return null;

  const base = `${SUPABASE_URL}/rest/v1/onlyfans_profiles`;
  const urlParams = new URLSearchParams();
  urlParams.set('select', PROFILE_COLS);
  urlParams.set('username', `ilike.${clean}`);
  urlParams.set('limit', '1');

  const urlStr = `${base}?${urlParams.toString()}`;

  try {
    const res = await fetch(urlStr, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Accept-Profile': 'public',
        Prefer: 'count=none',
      },
      next: { revalidate },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.error('Supabase fetchCreatorProfile error', res.status, urlStr);
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: Record<string, any>[] = await res.json();
    if (rows.length === 0) return null;
    return mapProfile(rows[0]);
  } catch {
    console.error('Supabase fetchCreatorProfile error (timeout)', urlStr);
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSnapshot(row: Record<string, any>): Snapshot {
  return {
    capturedAt: row.captured_at,
    favoritedCount: row.favoritedcount ?? null,
    finishedStreamsCount: row.finishedstreamscount ?? null,
    postsCount: row.postscount ?? null,
    videosCount: row.videoscount ?? null,
    audiosCount: row.audioscount ?? null,
    mediasCount: row.mediascount ?? null,
    archivedPostsCount: row.archivedpostscount ?? null,
  };
}

/**
 * Fetch the historical snapshot series for a creator, oldest first.
 * Each row is one scrape (1st time, 2nd time, ...) and feeds the growth charts.
 */
export async function fetchCreatorSnapshots(
  creatorId: number,
  revalidate = 300,
): Promise<Snapshot[]> {
  const base = `${SUPABASE_URL}/rest/v1/onlyfans_profile_snapshots`;
  const urlParams = new URLSearchParams();
  urlParams.set(
    'select',
    'captured_at,favoritedcount,finishedstreamscount,postscount,videoscount,audioscount,mediascount,archivedpostscount',
  );
  urlParams.set('creator_id', `eq.${creatorId}`);
  urlParams.set('order', 'captured_at.asc');
  urlParams.set('limit', '1000');

  const urlStr = `${base}?${urlParams.toString()}`;

  try {
    const res = await fetch(urlStr, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Accept-Profile': 'public',
        Prefer: 'count=none',
      },
      next: { revalidate },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.error('Supabase fetchCreatorSnapshots error', res.status, urlStr);
      return [];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: Record<string, any>[] = await res.json();
    return rows.map(mapSnapshot);
  } catch {
    console.error('Supabase fetchCreatorSnapshots error (timeout)', urlStr);
    return [];
  }
}
