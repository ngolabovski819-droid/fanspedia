import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllPostSlugs, getPostBySlug } from '@/lib/blog';
import { MDXRemote } from 'next-mdx-remote/rsc';

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

      <article className="prose-page">
        {post.featuredImage && (
          <div style={{ marginBottom: 28, borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.featuredImage}
              alt={post.featuredImageAlt}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="eager"
            />
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          {post.categoryLabel && (
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginRight: 12 }}>
              {post.categoryLabel}
            </span>
          )}
          {post.date && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          )}
          {post.readTime && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}> · {post.readTime}</span>
          )}
        </div>

        <div
          style={{
            color: 'var(--text-muted)',
            lineHeight: 1.8,
          }}
          className="blog-prose"
        >
          <MDXRemote source={post.content} />
        </div>
      </article>

      <style>{`
        .blog-prose h1, .blog-prose h2, .blog-prose h3 { color: var(--accent); font-family: 'Oswald', sans-serif; margin: 28px 0 14px; }
        .blog-prose h1 { font-size: 28px; }
        .blog-prose h2 { font-size: 22px; }
        .blog-prose h3 { font-size: 18px; }
        .blog-prose p { margin-bottom: 16px; font-size: 15px; }
        .blog-prose ul, .blog-prose ol { padding-left: 24px; margin-bottom: 16px; }
        .blog-prose li { margin-bottom: 8px; font-size: 15px; }
        .blog-prose a { color: var(--accent); }
        .blog-prose strong { color: var(--text); }
        .blog-prose blockquote { border-left: 3px solid var(--accent); padding-left: 16px; color: var(--text-muted); margin: 20px 0; }
        .blog-prose code { background: var(--surface-raised); padding: 2px 6px; border-radius: 4px; font-size: 13px; }
      `}</style>
    </>
  );
}
