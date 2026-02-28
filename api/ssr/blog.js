/**
 * SSR handler for the blog listing page (/blog)
 *
 * Reads all blog posts from content/blog/*.md, then injects them into
 * blog.html so Googlebot sees a fully-rendered page on first request.
 *
 * Injected into the page:
 *   - Dynamic <title>, <meta description>
 *   - Open Graph + Twitter Card tags
 *   - Blog + ItemList JSON-LD (Google rich results)
 *   - window.__BLOG_SSR_POSTS = [...] hydration data (client skips /api/blog fetch)
 *   - Pre-rendered first 9 post cards replacing skeleton placeholders in #blogGrid
 *
 * Fallback: on any error, serves the plain blog.html for client-side rendering.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readAllPosts } from '../blog.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const BASE_URL = 'https://fanspedia.net';
const BLOG_URL = `${BASE_URL}/blog/`;
const PAGE_SIZE = 9;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escAttr(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return ''; }
}

// ---------------------------------------------------------------------------
// Card renderer — mirrors buildCard() in blog.html
// ---------------------------------------------------------------------------
function renderCard(post, index) {
  const url = `${BASE_URL}/blog/${post.slug}/`;
  let imageHtml;
  if (post.featuredImage && post.featuredImage.trim()) {
    const proxy = `https://images.weserv.nl/?url=${encodeURIComponent(post.featuredImage.trim())}&w=600&h=338&fit=cover&output=webp&q=85`;
    const alt = escAttr(post.featuredImageAlt || post.title);
    const imgExtra = index === 0
      ? ' loading="eager" fetchpriority="high"'
      : ' loading="lazy"';
    imageHtml = `<div class="post-card-image-placeholder"><img src="${escAttr(proxy)}" alt="${alt}"${imgExtra}></div>`;
  } else {
    const fallback = (post.emoji && post.emoji.trim()) ? post.emoji : '📝';
    imageHtml = `<div class="post-card-image-placeholder">${fallback}</div>`;
  }

  const date = formatDate(post.date);
  const calSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  const clockSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

  return (
    `<a class="post-card" href="${escAttr(url)}">` +
    imageHtml +
    `<div class="post-card-body">` +
    `<span class="post-card-tag">${escHtml(post.categoryLabel)}</span>` +
    `<div class="post-card-title">${escHtml(post.title)}</div>` +
    `<div class="post-card-excerpt">${escHtml(post.excerpt)}</div>` +
    `<div class="post-card-meta">${calSvg}<span>${escHtml(date)}</span>${clockSvg}<span>${escHtml(post.readTime)}</span></div>` +
    `</div></a>`
  );
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  let html;
  try {
    html = readFileSync(join(ROOT, 'blog.html'), 'utf8');
  } catch (e) {
    res.status(500).send('Blog template not found');
    return;
  }

  try {
    const posts = await readAllPosts();
    const count = posts.length;
    const year = new Date().getFullYear();

    // Pre-render first page of cards
    const cardsHtml = posts.slice(0, PAGE_SIZE).map((p, i) => renderCard(p, i)).join('\n');

    // Meta copy
    const dynamicTitle = `FansPedia Blog — ${count} Articles on OnlyFans Tips &amp; Creator News (${year})`;
    const metaDesc = `Browse ${count} articles on OnlyFans creators, tips, guides and news. Updated weekly.`;
    const ogImage = posts.find(p => p.featuredImage && p.featuredImage.trim())?.featuredImage || '';

    // JSON-LD: Blog
    const blogJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'FansPedia Blog',
      url: BLOG_URL,
      description: 'Tips, guides and creator news about OnlyFans creators',
      publisher: { '@type': 'Organization', name: 'FansPedia', url: BASE_URL },
      blogPost: posts.slice(0, 10).map(p => ({
        '@type': 'BlogPosting',
        headline: p.title,
        url: `${BASE_URL}/blog/${p.slug}/`,
        datePublished: p.date,
        description: p.excerpt,
        author: { '@type': 'Organization', name: 'FansPedia' },
        ...(p.featuredImage ? { image: p.featuredImage } : {}),
      })),
    };

    // JSON-LD: ItemList
    const itemListJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'FansPedia Blog Posts',
      url: BLOG_URL,
      numberOfItems: count,
      itemListElement: posts.slice(0, 20).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.title,
        url: `${BASE_URL}/blog/${p.slug}/`,
      })),
    };

    // OG / Twitter tags block
    const ogBlock = [
      `<meta property="og:type" content="website">`,
      `<meta property="og:title" content="FansPedia Blog — OnlyFans Tips &amp; Creator News">`,
      `<meta property="og:description" content="${escAttr(metaDesc)}">`,
      `<meta property="og:url" content="${BLOG_URL}">`,
      ogImage ? `<meta property="og:image" content="${escAttr(ogImage)}">` : '',
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="FansPedia Blog — OnlyFans Tips &amp; Creator News">`,
      `<meta name="twitter:description" content="${escAttr(metaDesc)}">`,
      ogImage ? `<meta name="twitter:image" content="${escAttr(ogImage)}">` : '',
    ].filter(Boolean).join('\n');

    const jsonLdBlock =
      `<script type="application/ld+json">${JSON.stringify(blogJsonLd)}</script>\n` +
      `<script type="application/ld+json">${JSON.stringify(itemListJsonLd)}</script>`;

    // Hydration — inject all posts so client skips /api/blog roundtrip
    const ssrScript = `<script>window.__BLOG_SSR_POSTS=${JSON.stringify(posts)};</script>`;

    // -----------------------------------------------------------------------
    // Mutate HTML
    // -----------------------------------------------------------------------

    // 1. Replace <title>
    html = html.replace(/<title>[^<]+<\/title>/, `<title>${dynamicTitle}</title>`);

    // 2. Replace meta description
    html = html.replace(
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${escAttr(metaDesc)}">`
    );

    // 3. Inject OG + JSON-LD + SSR data before </head>
    html = html.replace('</head>', `${ogBlock}\n${jsonLdBlock}\n${ssrScript}\n</head>`);

    // 4. Replace grid content (skeletons → rendered cards)
    //    Match everything inside blogGrid up to the closing </div> that
    //    immediately precedes the .load-more-wrap element.
    html = html.replace(
      /(<div class="blog-grid" id="blogGrid">)[\s\S]*?(<\/div>\s*\n\s*<div class="load-more-wrap")/,
      `$1\n${cardsHtml}\n$2`
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    res.end(html);

  } catch (err) {
    console.error('ssr/blog error:', err);
    // Graceful fallback — client will render via /api/blog
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
  }
}
