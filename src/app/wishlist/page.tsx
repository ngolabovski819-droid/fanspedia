'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Metadata } from 'next';
import CreatorCard from '@/components/CreatorCard';
import type { Creator } from '@/types/creator';
import { getWishlist, toggleWishlist } from '@/lib/wishlist';

// Note: metadata must be in a server component — this page is 'use client'
// so metadata is handled via the layout title template

export default function WishlistPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadWishlist = useCallback(async () => {
    const usernames = getWishlist();
    if (!usernames.length) {
      setCreators([]);
      setLoading(false);
      return;
    }
    try {
      const params = new URLSearchParams({ q: usernames.join(','), page_size: '48' });
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data: { creators: Creator[] } = await res.json();
      // Keep wishlist order and only show what's actually wishlisted
      const byUsername = new Map(data.creators.map((c) => [c.username, c]));
      const ordered = usernames.flatMap((u) => (byUsername.has(u) ? [byUsername.get(u)!] : []));
      setCreators(ordered);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWishlist();
  }, [loadWishlist]);

  function handleClearAll() {
    if (!confirm(`Remove all ${creators.length} creators from your wishlist?`)) return;
    creators.forEach((c) => toggleWishlist(c.username));
    setCreators([]);
  }

  return (
    <>
      <section className="page-hero">
        <h1>♥ My Wishlist</h1>
        <p>Your saved OnlyFans creators. Click the heart icon on any card to remove.</p>
      </section>

      {loading && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px' }}>Loading your wishlist…</p>
      )}

      {error && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px' }}>
          Could not load wishlist. Please try again.
        </p>
      )}

      {!loading && !error && creators.length === 0 && (
        <div className="wishlist-empty">
          <div className="wishlist-empty-icon">♡</div>
          <h2>Your wishlist is empty</h2>
          <p>Start adding your favorite creators by clicking the heart icon on their cards.</p>
          <a href="/" className="btn-primary" style={{ display: 'inline-block', marginTop: 16, borderRadius: 10, textDecoration: 'none' }}>
            Browse Creators
          </a>
        </div>
      )}

      {!loading && creators.length > 0 && (
        <>
          <div className="section-heading">
            <h2>{creators.length} saved creator{creators.length !== 1 ? 's' : ''}</h2>
            <button
              onClick={handleClearAll}
              style={{ fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Clear all
            </button>
          </div>
          <div className="creator-grid">
            {creators.map((c, i) => (
              <CreatorCard key={c.id} creator={c} index={i} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
