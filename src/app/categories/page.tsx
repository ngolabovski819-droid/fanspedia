import type { Metadata } from 'next';
import Link from 'next/link';
import { categories } from '@/config/categories';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'All OnlyFans Categories | FansPedia',
  description: 'Browse all OnlyFans categories on FansPedia. Find creators by niche, fetish, body type, and more.',
  alternates: { canonical: 'https://fanspedia.net/categories/' },
};

export default function CategoriesPage() {
  return (
    <>
      <section className="page-hero">
        <h1>Browse OnlyFans Categories</h1>
        <p>Find creators by niche, content type, body type, and more.</p>
      </section>

      <div className="container" style={{ paddingBottom: 48 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {categories.map((c) => (
            <Link key={c.slug} href={`/categories/${c.slug}/`} className="country-card">
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
