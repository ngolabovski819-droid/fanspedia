import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchCreators } from '@/lib/supabase';
import { getCountry, ALL_COUNTRY_SLUGS } from '@/config/countries';
import CreatorGrid from '@/components/CreatorGrid';
import FAQ from '@/components/FAQ';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

// Pages are generated on-demand (ISR) to avoid flooding Supabase during build
export async function generateStaticParams() {
  return [];
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

export default async function CountryPage({ params }: Props) {
  const { slug } = await params;
  const country = getCountry(slug);
  if (!country) notFound();

  const { creators, total, hasMore } = await fetchCreators({
    locationTerms: country.terms,
    sort: 'popular',
    pageSize: 24,
    revalidate: 3600,
  });

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

      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <a href="/locations/">Locations</a>
        <span>/</span>
        <span>{country.label}</span>
      </nav>

      {/* Hero */}
      <section className="page-hero">
        <h1>{country.h1}</h1>
        <p>{country.metaDesc}</p>
      </section>

      {/* Grid */}
      <CreatorGrid
        initialCreators={creators}
        initialHasMore={hasMore}
        initialTotal={total}
        locationTerms={country.terms}
        sort="popular"
      />

      {/* FAQ */}
      <FAQ items={buildFAQ(country.label)} />
    </>
  );
}
