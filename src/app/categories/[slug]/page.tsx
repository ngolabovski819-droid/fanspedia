import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchCreators } from '@/lib/supabase';
import { getCategoryBySlug, type CategoryConfig } from '@/config/categories';
import CreatorGrid from '@/components/CreatorGrid';
import CreatorGridSkeleton from '@/components/CreatorGridSkeleton';
import FAQ from '@/components/FAQ';

// ISR: once rendered, serve from cache for 1 hour (matches fetch cache in supabase.ts)
export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

// No build-time Supabase fetches — pages render on-demand and are cached after the
// first request. The Suspense boundary below streams the shell instantly while the
// grid fetches in the background, so users always see content within ~50ms.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) return {};
  const url = `https://fanspedia.net/categories/${slug}/`;
  const title = `Best OnlyFans ${cat.label} Creators`;
  const desc = `Discover the best OnlyFans ${cat.label.toLowerCase()} creators on FansPedia. Browse verified profiles and exclusive content.`;
  return {
    title: `${title} | FansPedia`,
    description: desc,
    alternates: { canonical: url },
    openGraph: { title, description: desc, url },
  };
}

function buildFAQ(label: string) {
  return [
    {
      question: `Where can I find the best OnlyFans ${label} creators?`,
      answer: `FansPedia lets you browse and filter ${label} creators by price, verification status, and popularity. Use the filters above to narrow down your results.`,
    },
    {
      question: `Are there free OnlyFans ${label} creators?`,
      answer: `Yes — some ${label} creators offer free subscriptions. Use the "Free" price filter to find them.`,
    },
    {
      question: `How do I subscribe to an OnlyFans ${label} creator?`,
      answer: `Click "View Profile" on any creator card to visit their OnlyFans page and subscribe directly.`,
    },
  ];
}

// Async server component — suspends while Supabase fetches, streams in via Suspense below
async function CategoryCreators({ cat }: { cat: CategoryConfig }) {
  const { creators, total, hasMore } = await fetchCreators({
    categoryTerms: cat.terms,
    maxPrice: cat.maxPrice,
    sort: 'popular',
    pageSize: 24,
    skipLocationFilter: true,
    revalidate: 3600,
  });

  return (
    <CreatorGrid
      initialCreators={creators}
      initialHasMore={hasMore}
      initialTotal={total}
      categoryTerms={cat.terms}
      skipLocationFilter
      sort="popular"
      {...(cat.maxPrice !== undefined ? { maxPrice: cat.maxPrice } : {})}
    />
  );
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) notFound();

  const title = `Best OnlyFans ${cat.label} Creators`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://fanspedia.net/' },
      { '@type': 'ListItem', position: 2, name: 'Categories', item: 'https://fanspedia.net/categories/' },
      { '@type': 'ListItem', position: 3, name: cat.label, item: `https://fanspedia.net/categories/${slug}/` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb — renders immediately, no data needed */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <a href="/categories/">Categories</a>
        <span>/</span>
        <span>{cat.label}</span>
      </nav>

      {/* Hero — renders immediately */}
      <section className="page-hero">
        <h1>{title}</h1>
        <p>Browse verified OnlyFans {cat.label.toLowerCase()} creators. Sorted by popularity.</p>
      </section>

      {/* Grid — skeleton shows instantly, real content streams in when Supabase responds */}
      <Suspense fallback={<CreatorGridSkeleton />}>
        <CategoryCreators cat={cat} />
      </Suspense>

      {/* FAQ */}
      <FAQ items={buildFAQ(cat.label)} />
    </>
  );
}
