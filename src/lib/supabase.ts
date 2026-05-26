import type { Creator } from '@/types/creator';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;

const CARD_COLS = [
  'id', 'username', 'name', 'about', 'location',
  'avatar', 'avatar_c144',
  'isverified', 'subscribeprice', 'favoritedcount', 'subscriberscount',
  'postscount', 'photoscount', 'videoscount',
  'bundle1_price', 'bundle1_duration', 'bundle1_discount',
  'bundle2_price', 'bundle2_duration', 'bundle2_discount',
  'bundle3_price', 'bundle3_duration', 'bundle3_discount',
  'promotion1_price', 'promotion1_discount',
].join(',');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCreator(row: Record<string, any>): Creator {
  return {
    id: row.id,
    username: row.username,
    name: row.name ?? null,
    about: row.about ?? null,
    location: row.location ?? null,
    avatar: row.avatar ?? null,
    avatarC144: row.avatar_c144 ?? null,
    isVerified: Boolean(row.isverified),
    subscribePrice: row.subscribeprice ?? null,
    favoritedCount: row.favoritedcount ?? 0,
    subscribersCount: row.subscriberscount ?? null,
    postsCount: row.postscount ?? null,
    photosCount: row.photoscount ?? null,
    videosCount: row.videoscount ?? null,
    bundle1Price: row.bundle1_price ?? null,
    bundle1Duration: row.bundle1_duration ?? null,
    bundle1Discount: row.bundle1_discount ?? null,
    bundle2Price: row.bundle2_price ?? null,
    bundle2Duration: row.bundle2_duration ?? null,
    bundle2Discount: row.bundle2_discount ?? null,
    bundle3Price: row.bundle3_price ?? null,
    bundle3Duration: row.bundle3_duration ?? null,
    bundle3Discount: row.bundle3_discount ?? null,
    promotion1Price: row.promotion1_price ?? null,
    promotion1Discount: row.promotion1_discount ?? null,
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
    // Single-column ilike on search_text is ~4x faster than 4-column OR
    urlStr += `&search_text=ilike.*${encodeURIComponent(q)}*`;
  }

  const fetchOptions = {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Accept-Profile': 'public',
      Prefer: 'count=estimated',
    },
    next: { revalidate },
  };

  // Retry up to 5 times on 500 (transient Supabase overload during build).
  // Generous backoff: 1s, 2s, 3s, 4s — gives Supabase time to recover between attempts.
  const MAX_RETRIES = 5;
  let res: Response | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    res = await fetch(urlStr, fetchOptions);
    if (res.ok) break;
    if (res.status !== 500 || attempt === MAX_RETRIES - 1) break;
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
    hasMore: page * pageSize + creators.length < total,
  };
}
