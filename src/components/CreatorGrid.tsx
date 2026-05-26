'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import CreatorCard from './CreatorCard';
import CreatorGridSkeleton from './CreatorGridSkeleton';
import type { Creator } from '@/types/creator';

interface Props {
  initialCreators: Creator[];
  initialHasMore: boolean;
  initialTotal: number;
  locationTerms?: string[];
  categoryTerms?: string[];
  skipLocationFilter?: boolean;
  verified?: boolean;
  maxPrice?: number;
  sort?: string;
  q?: string;
}

export default function CreatorGrid({
  initialCreators,
  initialHasMore,
  initialTotal,
  locationTerms,
  categoryTerms,
  skipLocationFilter,
  verified,
  maxPrice,
  sort,
  q,
}: Props) {
  const [creators, setCreators] = useState<Creator[]>(initialCreators);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(initialTotal);
  // True while auto-fetching on mount for pages that built empty (build-time 500)
  const [healing, setHealing] = useState(initialCreators.length === 0);
  const healedRef = useRef(false);
  // Prefetched page-1 data — populated silently on mount so first "Load More" is instant
  const prefetchRef = useRef<{ creators: Creator[]; hasMore: boolean } | null>(null);

  // Self-heal: if the server built this page with no creators (Supabase 500 during
  // build), fetch page 0 on mount so the first visitor never sees an empty grid.
  useEffect(() => {
    if (!healedRef.current && initialCreators.length === 0) {
      healedRef.current = true;
      void (async () => {
        try {
          const params = new URLSearchParams();
          params.set('page', '0');
          params.set('page_size', '24');
          if (locationTerms?.length) params.set('location_terms', locationTerms.join(','));
          if (categoryTerms?.length) params.set('category_terms', categoryTerms.join(','));
          if (skipLocationFilter) params.set('skip_location_filter', '1');
          if (verified) params.set('verified', '1');
          if (maxPrice !== undefined) params.set('price', String(maxPrice));
          if (sort) params.set('sort', sort);
          if (q) params.set('q', q);
          const res = await fetch(`/api/search?${params.toString()}`);
          if (res.ok) {
            const data: { creators: Creator[]; hasMore: boolean; total: number } = await res.json();
            if (data.creators.length > 0) {
              setCreators(data.creators);
              setHasMore(data.hasMore);
              setTotal(data.total);
              setPage(1);
            }
          }
        } catch { /* silent — fall through to empty state */ }
        setHealing(false);
      })();
    } else {
      setHealing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefetch page 1 silently on mount when we already have page 0 data.
  // This makes the first "Load More" click instant — data is already in memory.
  useEffect(() => {
    if (initialCreators.length === 0 || !initialHasMore) return;
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('page_size', '24');
    if (locationTerms?.length) params.set('location_terms', locationTerms.join(','));
    if (categoryTerms?.length) params.set('category_terms', categoryTerms.join(','));
    if (skipLocationFilter) params.set('skip_location_filter', '1');
    if (verified) params.set('verified', '1');
    if (maxPrice !== undefined) params.set('price', String(maxPrice));
    if (sort) params.set('sort', sort);
    if (q) params.set('q', q);
    fetch(`/api/search?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) prefetchRef.current = data; })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      // Use prefetched page-1 data if available — makes first "Load More" instant
      if (page === 1 && prefetchRef.current) {
        const data = prefetchRef.current;
        prefetchRef.current = null;
        setCreators((prev) => [...prev, ...data.creators]);
        setHasMore(data.hasMore);
        setPage(2);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', '24');
      if (locationTerms?.length) params.set('location_terms', locationTerms.join(','));
      if (categoryTerms?.length) params.set('category_terms', categoryTerms.join(','));
      if (skipLocationFilter) params.set('skip_location_filter', '1');
      if (verified) params.set('verified', '1');
      if (maxPrice !== undefined) params.set('price', String(maxPrice));
      if (sort) params.set('sort', sort);
      if (q) params.set('q', q);

      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error('Search failed');
      const data: { creators: Creator[]; hasMore: boolean } = await res.json();

      if (data.creators.length === 0) {
        // Nothing came back (API error or end of results) — stop the button
        setHasMore(false);
        return;
      }

      setCreators((prev) => [...prev, ...data.creators]);
      setHasMore(data.hasMore);
      setPage((p) => p + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, locationTerms, categoryTerms, skipLocationFilter, verified, maxPrice, sort, q]);

  if (healing) return <CreatorGridSkeleton />;

  if (creators.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
        No creators found. Try a different search.
      </div>
    );
  }

  return (
    <>
      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
      {initialTotal > 0 || total > 0 ? `${(total || initialTotal).toLocaleString()} creators found` : ''}
      </p>
      <div className="creator-grid" role="list">
        {creators.map((c, i) => (
          <div key={c.id} role="listitem">
            <CreatorCard creator={c} index={i} />
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="load-more-wrap">
          <button
            className="btn-load-more"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Load More'}
          </button>
        </div>
      )}
    </>
  );
}
