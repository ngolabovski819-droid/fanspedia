import type { Creator } from '@/types/creator';

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
  urlParams.set('offset', String(page * pageSize));

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

  const fetchOptions = {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Accept-Profile': 'public',
      Prefer: 'count=estimated',
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
  const total = parseInt(contentRange.split('/')[1] ?? '0', 10) || 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: Record<string, any>[] = await res.json();
  const creators = rows.map(mapCreator);

  return {
    creators,
    total,
    // Use page-length check rather than estimated total — count=estimated can be
    // inaccurate, and if a fetch returns 0 rows this keeps hasMore=false so the
    // Load More button disappears instead of staying stuck.
    hasMore: creators.length === pageSize,
  };
}
