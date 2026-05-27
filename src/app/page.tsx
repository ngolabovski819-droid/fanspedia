import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchCreators } from '@/lib/supabase';
import CreatorGrid from '@/components/CreatorGrid';
import { popularCategories } from '@/config/categories';
import { COUNTRIES_LIST } from '@/config/countries';
import HomeSearch from '@/components/HomeSearch';
import { proxyImg } from '@/lib/image';

export const revalidate = 3600;

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
    revalidate: 3600,
  });

  const featuredCountries = COUNTRIES_LIST.slice(0, 20);

  return (
    <>
      {/* Hero */}
      <section className="page-hero">
        <h1>Find the Best OnlyFans Creators</h1>
        <p>Browse <strong>{total.toLocaleString()}+</strong> verified creators by category, location, and price.</p>
        <HomeSearch />
        {/* Visual teaser — avatars of top creators */}
        <div className="hero-preview-strip">
          {creators.slice(0, 6).filter((c) => c.avatar).map((c) => (
            <div key={c.id} className="hero-preview-avatar">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={proxyImg(c.avatar!, 96)} alt="" aria-hidden="true" />
            </div>
          ))}
          <span className="hero-preview-more">+{Math.max(0, total - 6).toLocaleString()} creators</span>
        </div>
        {/* Demoted secondary navigation */}
        <p className="hero-browse-links">
          or browse by{' '}
          <Link href="/categories/">categories</Link>
          {' · '}
          <Link href="/locations/">location</Link>
        </p>
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
