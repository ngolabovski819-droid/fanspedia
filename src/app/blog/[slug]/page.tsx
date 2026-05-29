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

      {/* Author card */}
      <div className="author-card-wrap">
        <div className="author-card" tabIndex={0}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="author-avatar" src="/uploads/author-nick.jpg" alt="Nick Golabovski" width={44} height={44} loading="lazy" />
          <div className="author-info">
            <span className="author-name">Nick Golabovski</span>
            <span className="author-jobtitle">Founder, FansPedia</span>
          </div>
          <div className="author-tooltip" role="tooltip">
            <div className="author-tooltip-header">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="author-tooltip-avatar" src="/uploads/author-nick.jpg" alt="Nick Golabovski" width={56} height={56} loading="lazy" />
              <div>
                <div className="author-tooltip-name">Nick Golabovski</div>
                <div className="author-tooltip-title">Founder, FansPedia</div>
              </div>
            </div>
            <p className="author-tooltip-bio">Nick has been researching the creator economy since 2021. He built FansPedia to help fans discover real OnlyFans creators. He writes data-driven guides on creator platforms, monetisation, and audience growth.</p>
            <a className="author-tooltip-linkedin" href="https://www.linkedin.com/in/nikola-golabovski-28b124209/" target="_blank" rel="noopener noreferrer">
              <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              Connect on LinkedIn
            </a>
          </div>
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
        /* Author card */
        .author-card-wrap {
          max-width: 860px;
          margin: 0 auto 28px;
          padding: 0 20px;
          display: flex;
          justify-content: center;
        }
        .author-card {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          padding: 10px 20px 10px 10px;
          border: 1px solid var(--border);
          border-radius: 48px;
          background: var(--surface);
          cursor: pointer;
          position: relative;
          transition: border-color .2s, box-shadow .2s, background .2s;
          outline: none;
        }
        .author-card:hover, .author-card:focus-within {
          border-color: var(--accent);
          box-shadow: 0 4px 20px rgba(0,175,240,0.1);
        }
        .author-avatar {
          width: 44px; height: 44px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          border: 2px solid var(--accent);
        }
        .author-info { display: flex; flex-direction: column; gap: 2px; }
        .author-name { font-size: 14px; font-weight: 700; color: var(--text); line-height: 1.2; }
        .author-jobtitle { font-size: 11px; font-weight: 600; color: var(--accent); letter-spacing: .02em; }
        .author-tooltip {
          position: absolute;
          top: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%) translateY(6px);
          z-index: 200;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          width: 320px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.2);
          opacity: 0;
          pointer-events: none;
          transition: opacity .2s ease, transform .2s ease;
        }
        .author-card:hover .author-tooltip,
        .author-card:focus-within .author-tooltip {
          opacity: 1;
          pointer-events: auto;
          transform: translateX(-50%) translateY(0);
        }
        .author-tooltip::before {
          content: '';
          position: absolute;
          top: -7px; left: 50%;
          transform: translateX(-50%) rotate(45deg);
          width: 12px; height: 12px;
          background: var(--bg);
          border-left: 1px solid var(--border);
          border-top: 1px solid var(--border);
        }
        .author-tooltip-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }
        .author-tooltip-avatar { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid var(--accent); }
        .author-tooltip-name { font-size: 16px; font-weight: 700; color: var(--text); line-height: 1.2; }
        .author-tooltip-title { font-size: 12px; color: var(--accent); font-weight: 600; margin-top: 3px; }
        .author-tooltip-bio { font-size: 13px; line-height: 1.65; color: var(--text-muted); margin: 0 0 14px; }
        .author-tooltip-linkedin {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 16px;
          background: #0A66C2;
          color: #fff;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition: background .2s;
        }
        .author-tooltip-linkedin:hover { background: #004182; }
        @media (max-width: 480px) { .author-tooltip { width: calc(100vw - 48px); } }

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
