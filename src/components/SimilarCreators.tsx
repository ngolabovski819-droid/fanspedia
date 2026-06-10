'use client';

import { useCallback, useState } from 'react';
import CreatorCard from './CreatorCard';
import type { Creator } from '@/types/creator';

interface Props {
  initialCreators: Creator[];
  initialHasMore: boolean;
  /** Search terms (usually the creator's location) used to find similar creators. */
  categoryTerms?: string[];
  /** Current creator's username — filtered out of every page so she never lists herself. */
  excludeUsername: string;
}

const PAGE_SIZE = 12; // 2 rows × 6 columns

export default function SimilarCreators({
  initialCreators,
  initialHasMore,
  categoryTerms,
  excludeUsername,
}: Props) {
  const [creators, setCreators] = useState<Creator[]>(initialCreators);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(PAGE_SIZE));
      params.set('sort', 'popular');
      if (categoryTerms?.length) {
        params.set('category_terms', categoryTerms.join(','));
        params.set('skip_location_filter', '1');
      }
      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const data: { creators: Creator[]; hasMore: boolean } = await res.json();
        setCreators((prev) => {
          const seen = new Set(prev.map((c) => c.id));
          const fresh = data.creators.filter(
            (c) => !seen.has(c.id) && c.username.toLowerCase() !== excludeUsername.toLowerCase(),
          );
          return [...prev, ...fresh];
        });
        setHasMore(data.hasMore);
        setPage((p) => p + 1);
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    }
    setLoading(false);
  }, [loading, hasMore, page, categoryTerms, excludeUsername]);

  if (creators.length === 0) return null;

  return (
    <>
      <div className="creator-grid">
        {creators.map((creator, i) => (
          <CreatorCard key={creator.id} creator={creator} index={i} />
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
  );
}
