/**
 * SSR handler for blog post pages (/blog/:slug)
 *
 * Fetches post data from the existing /api/blog-post endpoint (which handles
 * Markdown parsing, frontmatter, and image resolution), then injects it into
 * blog-post.html so Googlebot sees the full article on first request.
 *
 * Injected into the page:
 *   - Dynamic <title>, <meta description>, <link canonical>
 *   - Open Graph + Twitter Card tags
 *   - Article + BreadcrumbList JSON-LD (Google rich results / Discover)
 *   - window.__BLOG_POST_SSR hydration flag (client skips duplicate fetch)
 *   - Pre-rendered article HTML in <main id="articleMain">
 *
 * Fallback: on any error, serves the plain blog-post.html for client-side
 * rendering — transparent to the user.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const BASE_URL = 'https://fanspedia.net';

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

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  } catch { return ''; }
}

// api/blog-post.js's simple YAML parser sets meta_description to '>' for
// block-scalar values — detect and fall back to excerpt.
function cleanDesc(post) {
  const d = post.metaDescription;
  return (!d || d === '>') ? (post.excerpt || '') : d;
}

// ---------------------------------------------------------------------------
// Article HTML renderer (mirrors renderArticle() in blog-post.html)
// ---------------------------------------------------------------------------
function renderArticleHtml(post) {
  let heroImageHTML = '';
  if (post.featuredImage && post.featuredImage.trim()) {
    const base = post.featuredImage.trim();
    const alt = escHtml(post.featuredImageAlt || post.title || '');
    const desk = escHtml(`https://images.weserv.nl/?url=${encodeURIComponent(base)}&w=1200&h=675&fit=cover&output=webp&q=85`);
    const mob  = escHtml(`https://images.weserv.nl/?url=${encodeURIComponent(base)}&w=800&h=450&fit=cover&output=webp&q=85`);
    heroImageHTML = `
    <div class="blog-hero-image">
      <picture>
        <source media="(min-width: 768px)" srcset="${desk}">
        <img src="${mob}" alt="${alt}" loading="eager" fetchpriority="high">
      </picture>
    </div>`;
  }

  const emojiHTML = (post.emoji && post.emoji.trim())
    ? `<span class="article-emoji">${escHtml(post.emoji)}</span>`
    : '';

  const desc = cleanDesc(post);

  return `
  <div class="back-bar">
    <a href="/blog/" class="back-btn"><i class="fas fa-arrow-left"></i> Back to Blog</a>
  </div>
  <div class="article-hero">
    ${emojiHTML}
    <h1 class="article-title">${escHtml(post.title || '')}</h1>
    <p class="article-excerpt">${escHtml(desc)}</p>
    <div class="article-meta">
      <span><i class="fas fa-calendar-alt"></i> ${formatDate(post.date)}</span>
      <span><i class="fas fa-clock"></i> ${escHtml(post.readTime || '5 min read')}</span>
      <span class="article-tag article-tag-inline">${escHtml(post.categoryLabel || post.category || '')}</span>
    </div>
  </div>
  ${heroImageHTML}
  <div class="article-divider"><hr></div>
  <article class="article-body">${post.bodyHtml || ''}</article>`;
}

// ---------------------------------------------------------------------------
// JSON-LD structured data
// ---------------------------------------------------------------------------
function buildJsonLd(post, canonicalUrl) {
  const desc = cleanDesc(post);
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.seoTitle || post.title,
    ...(desc && { description: desc }),
    ...(post.date && {
      datePublished: new Date(post.date).toISOString(),
      dateModified:  new Date(post.date).toISOString(),
    }),
    ...(post.featuredImage && { image: post.featuredImage }),
    author: {
      '@type': 'Organization',
      name: 'FansPedia',
      url: `${BASE_URL}/`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'FansPedia',
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/favicon.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',  item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog',  item: `${BASE_URL}/blog/` },
      { '@type': 'ListItem', position: 3, name: post.title, item: canonicalUrl },
    ],
  };

  return [
    `<script type="application/ld+json">${JSON.stringify(article)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  const slug = (req.query.slug || '').trim();
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).send('Invalid slug');
  }

  // Read template early — fail fast before the async work
  let rawHtml;
  try {
    rawHtml = readFileSync(join(ROOT, 'blog-post.html'), 'utf8');
  } catch (readErr) {
    console.error('[ssr/blog-post] cannot read blog-post.html:', readErr.message);
    return res.status(500).send('Internal Server Error');
  }

  try {
    // Delegate parsing/markdown/image-resolution to the existing API endpoint
    const host = req.headers.host || 'fanspedia.net';
    const proto = (host.includes('localhost') || host.includes('127.0.0.1')) ? 'http' : 'https';
    const apiUrl = `${proto}://${host}/api/blog-post?slug=${encodeURIComponent(slug)}`;

    const apiRes = await fetch(apiUrl);

    if (apiRes.status === 404) {
      // Unknown slug — serve plain shell so client shows its own 404 message
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(rawHtml);
    }
    if (!apiRes.ok) throw new Error(`blog-post API returned ${apiRes.status}`);

    const post = await apiRes.json();
    const canonicalUrl = `${BASE_URL}/blog/${post.slug}/`;
    const desc     = cleanDesc(post);
    const seoTitle = escHtml(`${post.seoTitle || post.title} — FansPedia Blog`);
    const ogImage  = (post.featuredImage && post.featuredImage.startsWith('http'))
                       ? post.featuredImage
                       : `${BASE_URL}/og-image.jpg`;

    let html = rawHtml;

    // 1. <title>
    html = html.replace(
      '<title id="pageTitle">Blog — FansPedia</title>',
      `<title id="pageTitle">${seoTitle}</title>`
    );

    // 2. <meta description>
    html = html.replace(
      '<meta name="description" id="pageDesc" content="Read the latest guides and tips on FansPedia.">',
      `<meta name="description" id="pageDesc" content="${escHtml(desc)}">`
    );

    // 3. <link canonical>
    html = html.replace(
      '<link rel="canonical" id="pageCanonical" href="https://www.fanspedia.net/blog/">',
      `<link rel="canonical" id="pageCanonical" href="${escHtml(canonicalUrl)}">`
    );

    // 4. OG tags + Twitter cards + JSON-LD + SSR hydration flag
    const ogBlock = [
      `  <meta property="og:type" content="article">`,
      `  <meta property="og:url" content="${escHtml(canonicalUrl)}">`,
      `  <meta property="og:title" content="${escHtml(post.seoTitle || post.title)}">`,
      `  <meta property="og:description" content="${escHtml(desc)}">`,
      `  <meta property="og:image" content="${escHtml(ogImage)}">`,
      `  <meta property="og:image:width" content="1200">`,
      `  <meta property="og:image:height" content="675">`,
      `  <meta property="og:site_name" content="FansPedia">`,
      `  <meta name="twitter:card" content="summary_large_image">`,
      `  <meta name="twitter:title" content="${escHtml(post.seoTitle || post.title)}">`,
      `  <meta name="twitter:description" content="${escHtml(desc)}">`,
      `  <meta name="twitter:image" content="${escHtml(ogImage)}">`,
    ].join('\n');

    const jsonLd  = buildJsonLd(post, canonicalUrl);
    const ssrFlag = `<script>window.__BLOG_POST_SSR=${JSON.stringify({ slug: post.slug })};</script>`;

    html = html.replace('</head>', `${ogBlock}\n${jsonLd}\n${ssrFlag}\n</head>`);

    // 5. Pre-render article body into <main id="articleMain">
    const articleHtml = renderArticleHtml(post);
    html = html.replace(
      `<main id="articleMain">
  <div class="state-center" id="loadingState">
    <div class="state-emoji">⏳</div>
    <h2 data-i18n-key="blog_loadingArticle">Loading article...</h2>
  </div>
</main>`,
      `<main id="articleMain">${articleHtml}
</main>`
    );

    // 6. Send
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    return res.status(200).send(html);

  } catch (err) {
    console.error('[ssr/blog-post] error:', err.message);
    // Fallback to plain template — client renders the post
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(rawHtml);
  }
}
