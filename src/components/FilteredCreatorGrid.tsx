'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import FilterBar, { type SortOption } from './FilterBar';
import CreatorCard from './CreatorCard';
import CreatorGridSkeleton from './CreatorGridSkeleton';
import type { Creator } from '@/types/creator';

interface Props {
  initialCreators: Creator[];
  initialHasMore: boolean;
  initialTotal: number;
  categoryTerms?: string[];
  locationTerms?: string[];
  skipLocationFilter?: boolean;
  scope?: string;
}

export default function FilteredCreatorGrid({
  initialCreators,
  initialHasMore,
  initialTotal,
  categoryTerms,
  locationTerms,
  skipLocationFilter,
  scope,
}: Props) {
  const [sort, setSort] = useState<SortOption>('popular');
  const [freeOnly, setFreeOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const [creators, setCreators] = useState<Creator[]>(initialCreators);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filtering, setFiltering] = useState(false);

  const isInitialMount = useRef(true);
  const healedRef = useRef(false);

  // Self-heal: if the page built empty (Supabase 504 during static gen),
  // fetch page 0 on mount so the user never sees an empty grid.
  useEffect(() => {
    if (initialCreators.length === 0 && !healedRef.current) {
      healedRef.current = true;
      void (async () => {
        setFiltering(true);
        try {
          const params = buildParams(0);
          const res = await fetch(`/api/search?${params.toString()}`);
          if (!res.ok) throw new Error();
          const data: { creators: Creator[]; hasMore: boolean; total: number } = await res.json();
          setCreators(data.creators);
          setHasMore(data.hasMore);
          setTotal(data.total);
          setPage(1);
        } catch { /* leave empty */ }
        setFiltering(false);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildParams(p: number, overrides?: Partial<{ sort: SortOption; freeOnly: boolean; verifiedOnly: boolean }>) {
    const params = new URLSearchParams();
    params.set('page', String(p));
    params.set('page_size', '24');
    if (categoryTerms?.length) params.set('category_terms', categoryTerms.join(','));
    if (locationTerms?.length) params.set('location_terms', locationTerms.join(','));
    if (skipLocationFilter) params.set('skip_location_filter', '1');
    if (scope) params.set('scope', scope);
    const s = overrides?.sort ?? sort;
    const fr = overrides?.freeOnly ?? freeOnly;
    const vr = overrides?.verifiedOnly ?? verifiedOnly;
    params.set('sort', s);
    if (fr) params.set('price', '0');
    if (vr) params.set('verified', '1');
    return params;
  }

  // When filters change, re-fetch from page 0
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    void (async () => {
      setFiltering(true);
      try {
        const params = buildParams(0);
        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) throw new Error();
        const data: { creators: Creator[]; hasMore: boolean; total: number } = await res.json();
        setCreators(data.creators);
        setHasMore(data.hasMore);
        setTotal(data.total);
        setPage(1);
      } catch { /* keep previous results */ }
      setFiltering(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, freeOnly, verifiedOnly]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const params = buildParams(page);
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data: { creators: Creator[]; hasMore: boolean; total: number } = await res.json();
      setCreators((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        return [...prev, ...data.creators.filter((c) => !seen.has(c.id))];
      });
      setHasMore(data.hasMore);
      setPage((p) => p + 1);
    } catch {}
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, hasMore, page, sort, freeOnly, verifiedOnly]);

  return (
    <>
      <FilterBar
        sort={sort}
        freeOnly={freeOnly}
        verifiedOnly={verifiedOnly}
        onSort={setSort}
        onFreeOnly={setFreeOnly}
        onVerifiedOnly={setVerifiedOnly}
        total={total}
      />

      {filtering ? (
        <CreatorGridSkeleton />
      ) : creators.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          No creators found matching these filters.
        </div>
      ) : (
        <>
          <div className="creator-grid" role="list">
            {creators.map((c, i) => (
              <div key={c.id} role="listitem">
                <CreatorCard creator={c} index={i} />
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="load-more-wrap">
              <button className="btn-load-more" onClick={loadMore} disabled={loading}>
                {loading ? 'Loading…' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
