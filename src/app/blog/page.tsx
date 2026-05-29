import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Blog — OnlyFans Tips & Guides | FansPedia',
  description: 'Read OnlyFans tips, guides, and creator spotlights on the FansPedia blog.',
  alternates: { canonical: 'https://fanspedia.net/blog/' },
};

const FILTER_CHIPS = ['All Posts', 'Guides', 'News', 'Tips', 'Creators', 'How-To'];

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      {/* Breadcrumb */}
      <nav className="blg-breadcrumb" aria-label="Breadcrumb">
        <a href="/">🏠 Home</a>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Blog</span>
      </nav>

      {/* Hero */}
      <section className="blg-hero">
        <h1>FansPedia <span className="blg-accent">Blog</span></h1>
        <p>Tips, guides &amp; creator news</p>
      </section>

      {/* Filter chips */}
      <div className="blg-filter-row" aria-label="Filter posts">
        {FILTER_CHIPS.map((chip, i) => (
          <span key={chip} className={`blg-chip${i === 0 ? ' blg-chip-active' : ''}`}>{chip}</span>
        ))}
      </div>

      {/* Grid */}
      <main>
        <div className="blg-grid">
          {posts.length === 0 && (
            <div className="blg-empty">No posts yet — check back soon.</div>
          )}
          {posts.map((post, idx) => (
            <Link key={post.slug} href={`/blog/${post.slug}/`} className="blg-card">
              <div className="blg-card-img">
                {post.featuredImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.featuredImage}
                    alt={post.featuredImageAlt || post.title}
                    loading={idx < 3 ? 'eager' : 'lazy'}
                  />
                ) : (
                  <div className="blg-card-img-placeholder">📝</div>
                )}
              </div>
              <div className="blg-card-body">
                {post.categoryLabel && (
                  <span className="blg-card-tag">{post.categoryLabel}</span>
                )}
                <h2 className="blg-card-title">{post.title}</h2>
                {post.metaDescription && (
                  <p className="blg-card-excerpt">{post.metaDescription}</p>
                )}
                <div className="blg-card-meta">
                  {post.date && (
                    <span>
                      📅 {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {post.readTime && <span>⏱ {post.readTime}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <style>{`
        .blg-breadcrumb {
          max-width: 1200px; margin: 0 auto; padding: 14px 20px;
          font-size: 13px; color: var(--text-muted);
        }
        .blg-breadcrumb a { color: var(--text-muted); text-decoration: none; }
        .blg-breadcrumb a:hover { color: var(--accent); }

        .blg-hero {
          text-align: center;
          padding: 56px 20px 40px;
          background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,175,240,0.1) 0%, transparent 70%);
        }
        .blg-hero h1 {
          font-size: clamp(2rem, 5vw, 3.2rem);
          font-weight: 900;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
          color: var(--text);
        }
        .blg-accent { color: var(--accent); }
        .blg-hero p {
          font-size: 1.1rem;
          color: var(--text-muted);
          max-width: 480px;
          margin: 0 auto;
        }

        .blg-filter-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 24px 20px 28px;
          max-width: 1200px;
          margin: 0 auto;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .blg-filter-row::-webkit-scrollbar { display: none; }
        .blg-chip {
          padding: 6px 16px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          cursor: default;
        }
        .blg-chip-active {
          border-color: var(--accent);
          background: rgba(0,175,240,0.1);
          color: var(--accent);
        }

        .blg-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
          padding: 0 20px 64px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .blg-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 64px 20px;
          color: var(--text-muted);
          font-size: 16px;
        }

        .blg-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .blg-card:hover {
          transform: translateY(-4px);
          border-color: rgba(0,175,240,0.35);
          box-shadow: 0 12px 40px rgba(0,0,0,0.35);
        }

        .blg-card-img {
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background: var(--bg);
          flex-shrink: 0;
        }
        .blg-card-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }
        .blg-card:hover .blg-card-img img { transform: scale(1.04); }
        .blg-card-img-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-size: 48px;
          background: linear-gradient(135deg, var(--bg) 0%, rgba(0,175,240,0.06) 100%);
        }

        .blg-card-body {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }
        .blg-card-tag {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          background: rgba(0,175,240,0.12);
          color: var(--accent);
          width: fit-content;
        }
        .blg-card-title {
          font-size: 16px;
          font-weight: 700;
          line-height: 1.4;
          color: var(--text);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin: 0;
        }
        .blg-card-excerpt {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
          margin: 0;
        }
        .blg-card-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: var(--text-muted);
          margin-top: auto;
          padding-top: 10px;
          border-top: 1px solid var(--border);
          flex-wrap: wrap;
        }

        @media (max-width: 480px) {
          .blg-grid { grid-template-columns: 1fr; padding: 0 12px 48px; }
          .blg-hero { padding: 40px 16px 28px; }
        }
      `}</style>
    </>
  );
}
