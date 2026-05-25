'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CreatorCard from '@/components/CreatorCard';
import type { Creator } from '@/types/creator';

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get('q') ?? '';

  const [q, setQ] = useState(initialQ);
  const [inputVal, setInputVal] = useState(initialQ);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (term: string, pg: number, append: boolean) => {
    if (!term.trim()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: term, page: String(pg), page_size: '24' });
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data: { creators: Creator[]; total: number; hasMore: boolean } = await res.json();
      setCreators((prev) => (append ? [...prev, ...data.creators] : data.creators));
      setTotal(data.total);
      setHasMore(data.hasMore);
      setPage(pg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Run search on mount / q change from URL
  useEffect(() => {
    const term = searchParams.get('q') ?? '';
    setQ(term);
    setInputVal(term);
    if (term) search(term, 0, false);
  }, [searchParams, search]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const term = inputVal.trim();
    if (!term) return;
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <>
      <section className="page-hero">
        <h1>Search OnlyFans Creators</h1>
        <p>Find creators by name, niche, or keyword.</p>
      </section>

      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrap">
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Search by name, username, location, niche..."
            aria-label="Search creators"
            autoFocus
          />
          <button type="submit">Search</button>
        </div>
      </form>

      {q && !loading && creators.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 20px' }}>
          No results for &quot;{q}&quot;. Try a different term.
        </p>
      )}

      {creators.length > 0 && (
        <>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            {total.toLocaleString()} results for &quot;{q}&quot;
          </p>
          <div className="creator-grid">
            {creators.map((c, i) => (
              <CreatorCard key={c.id} creator={c} index={i} />
            ))}
          </div>
          {hasMore && (
            <div className="load-more-wrap">
              <button
                className="btn-load-more"
                onClick={() => search(q, page + 1, true)}
                disabled={loading}
              >
                {loading ? 'Loading…' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}

      {loading && creators.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 20px' }}>Searching…</p>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  );
}
