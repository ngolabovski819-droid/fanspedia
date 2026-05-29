import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllPostSlugs, getPostBySlug } from '@/lib/blog';
import { MDXRemote } from 'next-mdx-remote/rsc';
import AiSummaryPanel from '@/components/AiSummaryPanel';

export const revalidate = 86400;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const url = `https://fanspedia.net/blog/${slug}/`;
  return {
    title: `${post.seoTitle || post.title} | FansPedia`,
    description: post.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.metaDescription,
      url,
      ...(post.featuredImage ? { images: [{ url: post.featuredImage, alt: post.featuredImageAlt }] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.date,
    url: `https://fanspedia.net/blog/${slug}/`,
    publisher: {
      '@type': 'Organization',
      name: 'FansPedia',
      url: 'https://fanspedia.net',
    },
    ...(post.featuredImage ? { image: post.featuredImage } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <a href="/blog/">Blog</a>
        <span>/</span>
        <span>{post.title}</span>
      </nav>

      {/* Article hero — category, title, meta */}
      <div className="article-hero">
        {post.categoryLabel && (
          <span className="article-tag">{post.categoryLabel}</span>
        )}
        <h1 className="article-title">{post.seoTitle || post.title}</h1>
        <div className="article-meta">
          {post.date && (
            <span>📅 {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          )}
          {post.readTime && <span>⏱ {post.readTime}</span>}
        </div>
      </div>

      {/* Featured image — full 16:9, max 860px */}
      {post.featuredImage && (
        <div className="blog-hero-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.featuredImage}
            alt={post.featuredImageAlt}
            loading="eager"
          />
        </div>
      )}

      {/* AI summary panel */}
      <div style={{ maxWidth: 860, margin: '0 auto 0', padding: '0 20px 4px' }}>
        <hr style={{ border: 'none', height: 1, background: 'linear-gradient(90deg, transparent, var(--border), transparent)' }} />
      </div>
      <AiSummaryPanel blogUrl={`https://fanspedia.net/blog/${post.slug}`} />

      {/* Article body */}
      <article className="article-body blog-prose">
        <MDXRemote source={post.content} />
      </article>

      <style>{`
        .article-hero {
          max-width: 860px;
          margin: 0 auto;
          padding: 32px 20px 24px;
          text-align: center;
        }
        .article-tag {
          display: inline-flex;
          align-items: center;
          padding: 4px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: rgba(0,175,240,0.12);
          color: var(--accent);
          margin-bottom: 20px;
        }
        .article-title {
          font-size: clamp(1.6rem, 4vw, 2.4rem);
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.25;
          color: var(--text);
          margin-bottom: 16px;
        }
        .article-meta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          font-size: 13px;
          color: var(--text-muted);
          flex-wrap: wrap;
        }
        .blog-hero-image {
          max-width: 860px;
          margin: 0 auto 32px;
          padding: 0 20px;
        }
        .blog-hero-image img {
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.25);
          display: block;
        }
        .article-body {
          max-width: 760px;
          margin: 0 auto;
          padding: 0 20px 80px;
          font-size: 17px;
          line-height: 1.75;
          color: var(--text-muted);
        }
        .blog-prose h2 {
          font-size: 1.45rem;
          font-weight: 700;
          color: var(--text);
          margin-top: 2.2em;
          margin-bottom: 0.7em;
          padding-bottom: 12px;
          position: relative;
        }
        .blog-prose h2::after {
          content: '';
          display: block;
          position: absolute;
          left: 0; bottom: 0;
          height: 3px;
          width: 100%;
          border-radius: 3px;
          background: linear-gradient(90deg, #00AFF0 0%, #0099D6 30%, transparent 72%);
        }
        .blog-prose h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text);
          margin-top: 1.8em;
          margin-bottom: 0.6em;
          padding-bottom: 8px;
          position: relative;
        }
        .blog-prose h3::after {
          content: '';
          display: block;
          position: absolute;
          left: 0; bottom: 0;
          height: 2px;
          width: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, rgba(0,175,240,0.55) 0%, rgba(0,153,214,0.4) 28%, transparent 60%);
        }
        .blog-prose p { margin-bottom: 1.3em; }
        .blog-prose ul, .blog-prose ol { padding-left: 1.5em; margin-bottom: 1.3em; }
        .blog-prose li { margin-bottom: 0.5em; }
        .blog-prose a { color: var(--accent); text-decoration: underline; }
        .blog-prose strong { color: var(--text); font-weight: 700; }
        .blog-prose blockquote {
          border-left: 4px solid var(--accent);
          margin: 1.5em 0;
          padding: 12px 20px;
          background: rgba(0,175,240,0.07);
          border-radius: 0 8px 8px 0;
          font-style: italic;
          color: var(--text-muted);
        }
        .blog-prose code { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 2px 6px; font-size: 0.87em; }
        .blog-prose img { max-width: 100%; border-radius: 12px; margin: 1.5em 0; display: block; }
        .blog-prose hr { border: none; border-top: 1px solid var(--border); margin: 2em 0; }
        .blog-prose table { width: 100%; border-collapse: collapse; font-size: 0.95em; margin: 1.5em 0; border: 2px solid var(--border); }
        .blog-prose th, .blog-prose td { border: 1px solid var(--border); padding: 10px 14px; vertical-align: top; }
        .blog-prose th { background: var(--surface); font-weight: 700; text-align: left; }
      `}</style>
    </>
  );
}
