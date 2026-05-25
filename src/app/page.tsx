import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchCreators } from '@/lib/supabase';
import CreatorGrid from '@/components/CreatorGrid';
import { popularCategories } from '@/config/categories';
import { COUNTRIES_LIST } from '@/config/countries';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'FansPedia — Find the Best OnlyFans Creators',
  description: 'Discover top OnlyFans creators worldwide. Search by category, location, price, and more.',
  alternates: { canonical: 'https://fanspedia.net/' },
  openGraph: { title: 'FansPedia — Find the Best OnlyFans Creators', url: 'https://fanspedia.net/' },
};

export default async function HomePage() {
  const { creators, total, hasMore } = await fetchCreators({
    sort: 'popular',
    pageSize: 24,
    revalidate: 300,
  });

  const featuredCountries = COUNTRIES_LIST.slice(0, 20);

  return (
    <>
      {/* Hero */}
      <section className="page-hero">
        <h1>Find the Best OnlyFans Creators</h1>
        <p>Browse thousands of verified creators by category, location, and price.</p>
        <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/categories/" className="btn-primary" style={{ borderRadius: 10, textDecoration: 'none' }}>Browse Categories</Link>
          <Link href="/locations/" style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 15 }}>By Location</Link>
        </div>
      </section>

      {/* Popular categories */}
      <div className="section-heading">
        <h2>Popular Categories</h2>
        <Link href="/categories/">See all →</Link>
      </div>
      <div className="category-chips">
        {popularCategories.map((c) => (
          <Link key={c.slug} href={`/categories/${c.slug}/`} className="category-chip">
            {c.label}
          </Link>
        ))}
      </div>

      {/* Top creators */}
      <div className="section-heading">
        <h2>Top Creators</h2>
      </div>
      <CreatorGrid
        initialCreators={creators}
        initialHasMore={hasMore}
        initialTotal={total}
        sort="popular"
      />

      {/* Countries */}
      <div className="section-heading" style={{ marginTop: 20 }}>
        <h2>Browse by Country</h2>
        <Link href="/locations/">See all →</Link>
      </div>
      <div className="country-grid">
        {featuredCountries.map((c) => (
          <Link key={c.slug} href={`/country/${c.slug}/`} className="country-card">
            {c.label}
          </Link>
        ))}
      </div>
    </>
  );
}
