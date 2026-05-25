import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchCreators } from '@/lib/supabase';
import { getCategoryBySlug, ALL_CATEGORY_SLUGS } from '@/config/categories';
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

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) notFound();

  const { creators, total, hasMore } = await fetchCreators({
    categoryTerms: cat.terms,
    maxPrice: cat.maxPrice,
    sort: 'popular',
    pageSize: 24,
    skipLocationFilter: true,
    revalidate: 3600,
  });

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

      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <a href="/categories/">Categories</a>
        <span>/</span>
        <span>{cat.label}</span>
      </nav>

      {/* Hero */}
      <section className="page-hero">
        <h1>{title}</h1>
        <p>Browse verified OnlyFans {cat.label.toLowerCase()} creators. Sorted by popularity.</p>
      </section>

      {/* Grid */}
      <CreatorGrid
        initialCreators={creators}
        initialHasMore={hasMore}
        initialTotal={total}
        categoryTerms={cat.terms}
        skipLocationFilter
        sort="popular"
        {...(cat.maxPrice !== undefined ? { maxPrice: cat.maxPrice } : {})}
      />

      {/* FAQ */}
      <FAQ items={buildFAQ(cat.label)} />
    </>
  );
}
