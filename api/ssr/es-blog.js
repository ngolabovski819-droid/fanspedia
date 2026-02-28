/**
 * SSR handler for the Spanish blog listing page (/es/blog, /es/blog/)
 *
 * Reuses the English blog.html template (no separate es/blog.html exists)
 * and the readAllPosts utility from api/blog.js.
 *
 * Differences vs api/ssr/blog.js (EN):
 *   - <html lang="es"> injection
 *   - Spanish <title>, <meta description>, OG tags
 *   - Canonical URL: https://fanspedia.net/es/blog/
 *   - hreflang en↔es cross-links injected in <head>
 *   - Blog + ItemList JSON-LD use /es/blog/ URL
 *   - window.__BLOG_SSR_POSTS hydration data passes `lang:'es'` hint so the
 *     client's isSpanishRoute() renders dates in es-ES locale automatically
 *     (no JS changes needed — it checks window.location.pathname)
 *   - Post card hrefs point to /es/blog/:slug/
 *   - Date locale: es-ES
 *   - Fallback: serve plain blog.html (client renders correctly via /api/blog)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readAllPosts } from '../blog.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const BASE_URL = 'https://fanspedia.net';
const ES_BLOG_URL = `${BASE_URL}/es/blog/`;
const EN_BLOG_URL = `${BASE_URL}/blog/`;
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

function formatDateEs(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return ''; }
}

// ---------------------------------------------------------------------------
// Card renderer — same structure as blog.html buildCard() but:
//   - /es/blog/:slug/ hrefs
//   - es-ES dates
// ---------------------------------------------------------------------------
function renderCard(post, index) {
  const url = `${BASE_URL}/es/blog/${post.slug}/`;
  let imageHtml;
  if (post.featuredImage && post.featuredImage.trim()) {
    const proxy = `https://images.weserv.nl/?url=${encodeURIComponent(post.featuredImage.trim())}&w=600&h=338&fit=cover&output=webp&q=85`;
    const alt = escAttr(post.featuredImageAlt || post.title);
    const imgExtra = index === 0 ? ' loading="eager" fetchpriority="high"' : ' loading="lazy"';
    imageHtml = `<div class="post-card-image-placeholder"><img src="${escAttr(proxy)}" alt="${alt}"${imgExtra}></div>`;
  } else {
    const fallback = (post.emoji && post.emoji.trim()) ? post.emoji : '📝';
    imageHtml = `<div class="post-card-image-placeholder">${fallback}</div>`;
  }

  const date = formatDateEs(post.date);
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

    const cardsHtml = posts.slice(0, PAGE_SIZE).map((p, i) => renderCard(p, i)).join('\n');

    // Spanish meta copy
    const dynamicTitle = `Blog de FansPedia — ${count} Artículos sobre OnlyFans y Creadoras (${year})`;
    const metaDesc = `Descubre ${count} artículos sobre creadoras de OnlyFans, consejos, guías y noticias. Actualizado semanalmente.`;
    const ogImage = posts.find(p => p.featuredImage && p.featuredImage.trim())?.featuredImage || '';

    // OG / Twitter block (Spanish)
    const ogBlock = [
      `<meta property="og:type" content="website">`,
      `<meta property="og:title" content="Blog de FansPedia — OnlyFans Consejos y Noticias">`,
      `<meta property="og:description" content="${escAttr(metaDesc)}">`,
      `<meta property="og:url" content="${ES_BLOG_URL}">`,
      ogImage ? `<meta property="og:image" content="${escAttr(ogImage)}">` : '',
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="Blog de FansPedia — OnlyFans Consejos y Noticias">`,
      `<meta name="twitter:description" content="${escAttr(metaDesc)}">`,
      ogImage ? `<meta name="twitter:image" content="${escAttr(ogImage)}">` : '',
    ].filter(Boolean).join('\n');

    // hreflang cross-links
    const hreflangBlock = [
      `<link rel="alternate" hreflang="en" href="${EN_BLOG_URL}" />`,
      `<link rel="alternate" hreflang="es" href="${ES_BLOG_URL}" />`,
      `<link rel="alternate" hreflang="x-default" href="${EN_BLOG_URL}" />`,
    ].join('\n');

    // JSON-LD: Blog + ItemList (Spanish)
    const blogJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Blog de FansPedia',
      url: ES_BLOG_URL,
      inLanguage: 'es',
      description: 'Consejos, guías y noticias sobre creadoras de OnlyFans',
      publisher: { '@type': 'Organization', name: 'FansPedia', url: BASE_URL },
      blogPost: posts.slice(0, 10).map(p => ({
        '@type': 'BlogPosting',
        headline: p.title,
        url: `${BASE_URL}/es/blog/${p.slug}/`,
        datePublished: p.date,
        description: p.excerpt,
        inLanguage: 'es',
        author: { '@type': 'Organization', name: 'FansPedia' },
        ...(p.featuredImage ? { image: p.featuredImage } : {}),
      })),
    };

    const itemListJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Artículos del Blog de FansPedia',
      url: ES_BLOG_URL,
      numberOfItems: count,
      itemListElement: posts.slice(0, 20).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.title,
        url: `${BASE_URL}/es/blog/${p.slug}/`,
      })),
    };

    const jsonLdBlock =
      `<script type="application/ld+json">${JSON.stringify(blogJsonLd)}</script>\n` +
      `<script type="application/ld+json">${JSON.stringify(itemListJsonLd)}</script>`;

    // SSR hydration data (client uses isSpanishRoute() to detect /es/ from location)
    const ssrScript = `<script>window.__BLOG_SSR_POSTS=${JSON.stringify(posts)};</script>`;

    // -----------------------------------------------------------------------
    // Mutate HTML
    // -----------------------------------------------------------------------

    // 1. Switch lang="en" → lang="es"
    html = html.replace(/^<!DOCTYPE html>\s*<html[^>]*>/m, '<!DOCTYPE html>\n<html lang="es">');

    // 2. Replace <title>
    html = html.replace(/<title>[^<]+<\/title>/, `<title>${escHtml(dynamicTitle)}</title>`);

    // 3. Replace meta description
    html = html.replace(
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${escAttr(metaDesc)}">`
    );

    // 4. Update canonical to /es/blog/
    html = html.replace(
      /<link rel="canonical"[^>]*>/,
      `<link rel="canonical" href="${ES_BLOG_URL}" />`
    );

    // 5. Inject OG + hreflang + JSON-LD + SSR data before </head>
    html = html.replace('</head>', `${ogBlock}\n${hreflangBlock}\n${jsonLdBlock}\n${ssrScript}\n</head>`);

    // 6. Replace grid content (skeletons → rendered cards)
    html = html.replace(
      /(<div class="blog-grid" id="blogGrid">)[\s\S]*?(<\/div>\s*\n\s*<div class="load-more-wrap")/,
      `$1\n${cardsHtml}\n$2`
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    res.end(html);

  } catch (err) {
    console.error('ssr/es-blog error:', err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
  }
}
