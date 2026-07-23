import type { Creator } from '@/types/creator';
import {
  fetchCreators,
  fetchCreatorsByUsernames,
  type SearchParams,
  type SearchResult,
} from '@/lib/supabase';
import { ALL_CATEGORY_SLUGS } from './categories';

/**
 * Per-page rules for hiding and pinning specific creators.
 *
 *  - `pinned`   → creators placed at an EXACT global position in the grid.
 *                 `position` is 1-based and spans the whole paginated list, so
 *                 you can place creators on page 1 (1-24), page 2 (25-48), etc.
 *                 Pinned creators are auto-fetched even if they don't naturally
 *                 rank onto the page.
 *  - `excluded` → usernames hidden from the page entirely.
 *
 * Scope keys:
 *  - 'home'                → homepage Top Creators grid
 *  - 'category:<slug>'     → e.g. 'category:bbw'
 *  - 'country:<slug>'      → e.g. 'country:argentina'
 *
 * Username matching is case-insensitive. Pins apply across every page of the
 * grid (server-rendered first page AND "Load More"), so paid placements stay
 * fixed wherever you put them.
 *
 * Example:
 *   'home': {
 *     pinned: [
 *       { username: 'topcustomer',  position: 1  },  // very first card
 *       { username: 'anothercust',  position: 2  },  // second card
 *       { username: 'page2feature', position: 30 },  // 6th card on page 2
 *     ],
 *     excluded: ['shaylust'],
 *   }
 */
export interface PinnedPlacement {
  username: string;
  /** 1-based global position across all pages. */
  position: number;
}

export interface FeaturedRule {
  pinned?: PinnedPlacement[];
  excluded?: string[];
}

// Tier 1 GEOs (highest CPM/spend) — countries.ts has no tier field, so this list is
// maintained here, order-by-order, for paid geo placements.
const TIER1_COUNTRIES = [
  'united-states',
  'united-kingdom',
  'canada',
  'australia',
  'germany',
  'ireland',
  'new-zealand',
  'switzerland',
  'netherlands',
];

const pinFirst = (username: string): PinnedPlacement[] => [{ username, position: 1 }];

// Paid placement (emilylopz) — #1 on home, every Tier 1 country page, and every
// category page. Remove these entries (or replace the username) when the order ends.
const EMILYLOPZ_COUNTRY_PINS: Record<string, FeaturedRule> = Object.fromEntries(
  TIER1_COUNTRIES.map((slug) => [`country:${slug}`, { pinned: pinFirst('emilylopz') }]),
);
const EMILYLOPZ_CATEGORY_PINS: Record<string, FeaturedRule> = Object.fromEntries(
  ALL_CATEGORY_SLUGS.map((slug) => [`category:${slug}`, { pinned: pinFirst('emilylopz') }]),
);

export const FEATURED: Record<string, FeaturedRule> = {
  home: {
    pinned: pinFirst('emilylopz'),
    excluded: ['shaylust'],
  },
  ...EMILYLOPZ_COUNTRY_PINS,
  ...EMILYLOPZ_CATEGORY_PINS,
};

/** Build the scope key for a category page. */
export const categoryScope = (slug: string) => `category:${slug}`;
/** Build the scope key for a country page. */
export const countryScope = (slug: string) => `country:${slug}`;

/** Does this scope have any featured rules worth applying? */
export function hasFeatured(scope: string): boolean {
  const rule = FEATURED[scope];
  return Boolean(
    rule && ((rule.pinned?.length ?? 0) > 0 || (rule.excluded?.length ?? 0) > 0),
  );
}

/**
 * fetchCreators wrapper with a resilience fallback. The term-filtered ilike/OR
 * queries behind category/country pages can hit Supabase's statement timeout
 * under load (large, actively-growing table + concurrent scraper writes) —
 * fetchCreators() swallows that into `{ creators: [], total: 0 }`, which is
 * indistinguishable from a genuine zero-match result. For these pages a real
 * zero-match is effectively never correct (every category/country has a large
 * matching population), so treat an empty result as a failure signal and retry
 * once without the term filters — better a "popular" grid than an empty one,
 * and now that every category/country can carry a pin, an empty natural result
 * would otherwise render as just the sponsored card with nothing else on the page.
 */
async function fetchCreatorsResilient(params: SearchParams): Promise<SearchResult> {
  const res = await fetchCreators(params);
  const hasTermFilter = (params.categoryTerms?.length ?? 0) > 0 || (params.locationTerms?.length ?? 0) > 0;
  if (res.creators.length > 0 || !hasTermFilter) return res;

  const fallback = await fetchCreators({ ...params, categoryTerms: undefined, locationTerms: undefined });
  // The fallback query has no term filter, so its `total` is the whole table's
  // count (~millions) — displaying that under a category/country heading would
  // read as an obvious bug. Cap it to what's actually been fetched (+1 page if
  // there's more), same "floor" idea fetchCreators itself uses.
  const offset = params.offset ?? (params.page ?? 0) * (params.pageSize ?? 24);
  const cappedTotal = offset + fallback.creators.length + (fallback.hasMore ? (params.pageSize ?? 24) : 0);
  return { ...fallback, total: Math.min(fallback.total, cappedTotal) };
}

/**
 * Clean + sort pinned placements: drop excluded usernames, dedupe by username
 * and by position (first wins), and order by ascending position.
 */
function normalizePins(rule: FeaturedRule): PinnedPlacement[] {
  const excluded = new Set((rule.excluded ?? []).map((u) => u.toLowerCase()));
  const seenPos = new Set<number>();
  const seenUser = new Set<string>();
  return (rule.pinned ?? [])
    .filter((p) => p.username && Number.isFinite(p.position) && p.position >= 1)
    .filter((p) => !excluded.has(p.username.toLowerCase()))
    .sort((a, b) => a.position - b.position)
    .filter((p) => {
      const u = p.username.toLowerCase();
      if (seenPos.has(p.position) || seenUser.has(u)) return false;
      seenPos.add(p.position);
      seenUser.add(u);
      return true;
    });
}

/**
 * Fetch one page of creators for a scope with featured rules applied across the
 * full paginated list. Excluded creators are removed at the DB level; pinned
 * creators are slotted into their exact global positions on whatever page they
 * land on.
 *
 * @param baseParams Base query params (sort, categoryTerms, filters, etc.).
 *                   Do NOT include page/pageSize/offset — those are supplied here.
 */
export async function fetchFeaturedPage(
  scope: string,
  baseParams: SearchParams,
  page: number,
  pageSize: number,
): Promise<SearchResult> {
  const rule = FEATURED[scope];
  if (!rule || !hasFeatured(scope)) {
    return fetchCreatorsResilient({ ...baseParams, page, pageSize });
  }

  const pins = normalizePins(rule);
  const pinUsernames = pins.map((p) => p.username);
  const excludedLower = new Set([
    ...(rule.excluded ?? []).map((u) => u.toLowerCase()),
    ...pinUsernames.map((u) => u.toLowerCase()),
  ]);
  // Remove excluded + pinned from the natural stream so offsets line up and
  // pinned creators never appear twice.
  const dbExclude = [...(rule.excluded ?? []), ...pinUsernames];

  const windowStart = page * pageSize; // 0-based global index of first slot
  const windowEnd = windowStart + pageSize;

  // Map global index → pinned username for pins landing in this window;
  // count pins placed before the window (they shift natural rows right).
  const pinByIndex = new Map<number, string>();
  let pinsBefore = 0;
  for (const p of pins) {
    const idx = p.position - 1;
    if (idx < windowStart) pinsBefore++;
    else if (idx < windowEnd) pinByIndex.set(idx, p.username);
  }
  const pinsInWindow = pinByIndex.size;

  const naturalOffset = Math.max(0, windowStart - pinsBefore);
  const naturalNeeded = pageSize - pinsInWindow;

  // Resolve pinned creators and the natural fill in parallel — they're
  // independent Supabase calls, so running them serially just doubles latency.
  const windowPinUsernames = [...pinByIndex.values()];

  const naturalPromise =
    naturalNeeded > 0
      ? fetchCreatorsResilient({
          ...baseParams,
          excludeUsernames: dbExclude,
          offset: naturalOffset,
          pageSize: naturalNeeded,
          page: 0, // ensures count is requested for total
        })
      : // Window is entirely pins — still grab the total cheaply.
        fetchCreatorsResilient({
          ...baseParams,
          excludeUsernames: dbExclude,
          offset: 0,
          pageSize: 1,
          page: 0,
        });

  const pinnedPromise = windowPinUsernames.length
    ? fetchCreatorsByUsernames(windowPinUsernames)
    : Promise.resolve([] as Creator[]);

  const [naturalRes, pinnedCreators] = await Promise.all([
    naturalPromise,
    pinnedPromise,
  ]);

  // Safety net against case-mismatched exclusions slipping through.
  const natural =
    naturalNeeded > 0
      ? naturalRes.creators.filter(
          (c) => !excludedLower.has((c.username ?? '').toLowerCase()),
        )
      : [];
  const naturalTotal = naturalRes.total;

  const pinnedMap = new Map(
    pinnedCreators.map((c) => [(c.username ?? '').toLowerCase(), c]),
  );

  // Assemble the window slot-by-slot.
  const out: Creator[] = [];
  let ni = 0;
  for (let i = windowStart; i < windowEnd; i++) {
    const pinUser = pinByIndex.get(i);
    if (pinUser) {
      const c = pinnedMap.get(pinUser.toLowerCase());
      if (c) {
        out.push({ ...c, sponsored: true });
        continue;
      }
      // Pinned creator not found in DB — fall back to a natural creator so the
      // slot isn't left empty.
    }
    if (ni < natural.length) out.push(natural[ni++]);
  }

  // Merged total ≈ natural creators (after exclusions) + placed pins.
  const total = naturalTotal + pins.length;
  const hasMore = windowEnd < total;

  return { creators: out, total, hasMore };
}
