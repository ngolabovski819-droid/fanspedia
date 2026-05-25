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

  // Category / text search filter
  if (categoryTerms && categoryTerms.length > 0) {
    const fields = ['username', 'name', 'about', 'location'];
    const clauses = categoryTerms.flatMap((t) =>
      fields.map((f) => `${f}.ilike.*${t}*`)
    );
    urlStr += `&or=(${clauses.join(',')})`;
  } else if (q) {
    const fields = ['username', 'name', 'about', 'location'];
    const clauses = fields.map((f) => `${f}.ilike.*${q}*`);
    urlStr += `&or=(${clauses.join(',')})`;
  }

  const res = await fetch(urlStr, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Accept-Profile': 'public',
      Prefer: 'count=estimated',
    },
    next: { revalidate },
  });

  if (!res.ok) {
    console.error('Supabase fetch error', res.status, urlStr);
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
