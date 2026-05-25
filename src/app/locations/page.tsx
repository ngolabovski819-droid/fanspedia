import type { Metadata } from 'next';
import Link from 'next/link';
import { COUNTRIES_LIST } from '@/config/countries';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'OnlyFans by Location — Countries | FansPedia',
  description: 'Browse OnlyFans creators by country. Find the best creators from the United States, UK, Australia, and 90+ other countries.',
  alternates: { canonical: 'https://fanspedia.net/locations/' },
};

export default function LocationsPage() {
  return (
    <>
      <section className="page-hero">
        <h1>Browse OnlyFans Creators by Country</h1>
        <p>Find creators from {COUNTRIES_LIST.length}+ countries around the world.</p>
      </section>

      <div className="country-grid">
        {COUNTRIES_LIST.map((c) => (
          <Link key={c.slug} href={`/country/${c.slug}/`} className="country-card">
            {c.label}
          </Link>
        ))}
      </div>
    </>
  );
}
