import type { Creator } from '@/types/creator';
import {
  fetchCreators,
  fetchCreatorsByUsernames,
  type SearchParams,
  type SearchResult,
} from '@/lib/supabase';

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

export const FEATURED: Record<string, FeaturedRule> = {
  home: {
    pinned: [
      { username: 'miss-meringue', position: 1 },
    ],
    excluded: ['shaylust'],
  },
  // Examples — edit as needed:
  // 'category:bbw': { pinned: [{ username: 'somecreator', position: 1 }] },
  // 'country:argentina': {
  //   pinned: [{ username: 'a', position: 1 }, { username: 'b', position: 25 }],
  //   excluded: ['someoneelse'],
  // },
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
    return fetchCreators({ ...baseParams, page, pageSize });
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
      ? fetchCreators({
          ...baseParams,
          excludeUsernames: dbExclude,
          offset: naturalOffset,
          pageSize: naturalNeeded,
          page: 0, // ensures count is requested for total
        })
      : // Window is entirely pins — still grab the total cheaply.
        fetchCreators({
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
