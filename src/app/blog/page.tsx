import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Blog — OnlyFans Tips & Guides | FansPedia',
  description: 'Read OnlyFans tips, guides, and creator spotlights on the FansPedia blog.',
  alternates: { canonical: 'https://fanspedia.net/blog/' },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <section className="page-hero">
        <h1>FansPedia Blog</h1>
        <p>Tips, guides, and insights about OnlyFans creators.</p>
      </section>

      <div className="blog-grid">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}/`} className="blog-card" style={{ textDecoration: 'none' }}>
            {post.featuredImage && (
              <div className="blog-card-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.featuredImage} alt={post.featuredImageAlt || post.title} loading="lazy" />
              </div>
            )}
            <div className="blog-card-body">
              {post.categoryLabel && (
                <span className="blog-card-category">{post.categoryLabel}</span>
              )}
              <h2 className="blog-card-title">{post.title}</h2>
              {post.metaDescription && (
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {post.metaDescription}
                </p>
              )}
              <p className="blog-card-meta">
                {post.date && new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                {post.readTime && ` · ${post.readTime}`}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
