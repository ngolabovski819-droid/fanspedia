import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchCreators } from '@/lib/supabase';
import { getCountry, ALL_COUNTRY_SLUGS, type CountryConfig } from '@/config/countries';
import CreatorGrid from '@/components/CreatorGrid';
import CreatorGridSkeleton from '@/components/CreatorGridSkeleton';
import FAQ from '@/components/FAQ';

// ISR: regenerate every 5 min. Short enough to fix pages that built empty (Supabase 500).
export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

// Pre-render ALL country pages at build time.
// staticGenerationMaxConcurrency: 1 (next.config.ts) serialises Supabase fetches
// so they never compete with each other regardless of how many pages there are.
export async function generateStaticParams() {
  return ALL_COUNTRY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const country = getCountry(slug);
  if (!country) return {};
  const url = `https://fanspedia.net/country/${slug}/`;
  return {
    title: `${country.h1} | FansPedia`,
    description: country.metaDesc,
    alternates: { canonical: url },
    openGraph: { title: country.h1, description: country.metaDesc, url },
  };
}

function buildFAQ(label: string) {
  return [
    {
      question: `How do I find OnlyFans creators from ${label}?`,
      answer: `Use FansPedia to search and filter creators by location. Browse the ${label} page to see the most popular creators sorted by subscriber count and engagement.`,
    },
    {
      question: `Are there free OnlyFans creators from ${label}?`,
      answer: `Yes — many creators from ${label} offer free subscriptions. Use the price filter to find free accounts.`,
    },
    {
      question: `How many OnlyFans creators are from ${label}?`,
      answer: `FansPedia indexes thousands of creators globally, including a large selection from ${label}. Browse to see the full list.`,
    },
  ];
}

// Async server component — suspends while Supabase fetches, streams in via Suspense below
async function CountryCreators({ country }: { country: CountryConfig }) {
  const { creators, total, hasMore } = await fetchCreators({
    // Use categoryTerms + skipLocationFilter so the query goes through the
    // search_text column (has trigram index) instead of location column (no index).
    categoryTerms: country.terms,
    skipLocationFilter: true,
    sort: 'popular',
    pageSize: 24,
    revalidate: 300,
  });

  return (
    <CreatorGrid
      initialCreators={creators}
      initialHasMore={hasMore}
      initialTotal={total}
      categoryTerms={country.terms}
      skipLocationFilter
      sort="popular"
    />
  );
}

export default async function CountryPage({ params }: Props) {
  const { slug } = await params;
  const country = getCountry(slug);
  if (!country) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://fanspedia.net/' },
      { '@type': 'ListItem', position: 2, name: 'Locations', item: 'https://fanspedia.net/locations/' },
      { '@type': 'ListItem', position: 3, name: country.label, item: `https://fanspedia.net/country/${slug}/` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb — renders immediately, no data needed */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <a href="/locations/">Locations</a>
        <span>/</span>
        <span>{country.label}</span>
      </nav>

      {/* Hero — renders immediately */}
      <section className="page-hero">
        <h1>{country.h1}</h1>
        <p>{country.metaDesc}</p>
      </section>

      {/* Grid — skeleton shows instantly, real content streams in when Supabase responds */}
      <Suspense fallback={<CreatorGridSkeleton />}>
        <CountryCreators country={country} />
      </Suspense>

      {/* FAQ */}
      <FAQ items={buildFAQ(country.label)} />
    </>
  );
}
