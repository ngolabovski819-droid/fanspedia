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

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// In Vercel's bundled environment process.cwd() == /var/task which is where
// includeFiles are placed. Locally __dirname/../.. == project root (same result).
const ROOT = (process.env.VERCEL || process.env.NOW_REGION)
  ? process.cwd()
  : join(__dirname, '..', '..');
const contentDir = join(ROOT, 'content', 'blog');
const BASE_URL = 'https://fanspedia.net';

// ---------------------------------------------------------------------------
// Markdown / frontmatter helpers (self-contained to avoid cross-bundle imports)
// ---------------------------------------------------------------------------
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const data = {};
  match[1].split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      data[key] = val;
    }
  });
  return { data, body: match[2].trim() };
}

function splitMarkdownTableRow(line) {
  const normalized = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return normalized.split('|').map(cell => cell.trim());
}
function isMarkdownTableSeparator(line) {
  const cols = splitMarkdownTableRow(line);
  return cols.length > 0 && cols.every(col => /^:?-{3,}:?$/.test(col));
}
function parseMarkdownTableAlignments(line) {
  return splitMarkdownTableRow(line).map(col => {
    const left = col.startsWith(':'); const right = col.endsWith(':');
    if (left && right) return 'center'; if (right) return 'right'; return 'left';
  });
}
function tableAlignAttr(align) {
  if (align === 'center') return ' style="text-align:center"';
  if (align === 'right') return ' style="text-align:right"';
  return '';
}
function inlineFormat(text) {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
}

function mdToHtml(md) {
  if (!md) return '';
  md = md.replace(/\r\n/g, '\n');
  md = md.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const langTrimmed = lang.trim().toLowerCase();
    if (langTrimmed === 'mermaid' || langTrimmed === 'flowchart' || langTrimmed.startsWith('graph')) {
      return `<div class="mermaid">${code.trim()}</div>\n\n`;
    }
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre><code class="language-${langTrimmed}">${escaped.trim()}</code></pre>\n\n`;
  });
  md = md.replace(/`([^`]+)`/g, (_, c) => {
    const escaped = c.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<code>${escaped}</code>`;
  });
  const blocks = md.split(/\n\s*\n+/);
  const htmlBlocks = blocks.map(block => {
    block = block.trim(); if (!block) return ''; if (block.startsWith('<pre>')) return block;
    const tableLines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (tableLines.length >= 2 && tableLines[0].includes('|') && isMarkdownTableSeparator(tableLines[1])) {
      const headers = splitMarkdownTableRow(tableLines[0]);
      const alignments = parseMarkdownTableAlignments(tableLines[1]);
      const bodyRows = tableLines.slice(2).filter(line => line.includes('|')).map(splitMarkdownTableRow).filter(row => row.some(cell => cell.length > 0));
      const thead = `<thead><tr>${headers.map((cell, i) => `<th${tableAlignAttr(alignments[i])}>${inlineFormat(cell)}</th>`).join('')}</tr></thead>`;
      const tbody = bodyRows.length ? `<tbody>${bodyRows.map(row => `<tr>${headers.map((_, i) => `<td${tableAlignAttr(alignments[i])}>${inlineFormat(row[i] || '')}</td>`).join('')}</tr>`).join('')}</tbody>` : '';
      return `<div class="table-wrap"><table>${thead}${tbody}</table></div>`;
    }
    if (/^###\s+/.test(block)) return `<h3>${inlineFormat(block.replace(/^###\s+/, ''))}</h3>`;
    if (/^##\s+/.test(block)) return `<h2>${inlineFormat(block.replace(/^##\s+/, ''))}</h2>`;
    if (/^#\s+/.test(block)) return `<h1>${inlineFormat(block.replace(/^#\s+/, ''))}</h1>`;
    if (/^>\s+/.test(block)) {
      const content = block.split('\n').map(l => l.replace(/^>\s?/, '')).join('\n');
      return `<blockquote>${inlineFormat(content)}</blockquote>`;
    }
    if (/^---+$/.test(block)) return '<hr>';
    if (/^[-*]\s+/.test(block)) {
      const items = block.split('\n').filter(l => /^[-*]\s+/.test(l)).map(l => `<li>${inlineFormat(l.replace(/^[-*]\s+/, ''))}</li>`);
      return `<ul>${items.join('')}</ul>`;
    }
    if (/^\d+\.\s+/.test(block)) {
      const items = block.split('\n').filter(l => /^\d+\.\s+/.test(l)).map(l => `<li>${inlineFormat(l.replace(/^\d+\.\s+/, ''))}</li>`);
      return `<ol>${items.join('')}</ol>`;
    }
    const lines = block.split('\n').map(l => inlineFormat(l)).join('<br>');
    return `<p>${lines}</p>`;
  });
  return htmlBlocks.filter(Boolean).join('\n');
}

async function resolveFeaturedImageUrl(rawUrl) {
  if (!rawUrl || !rawUrl.trim()) return '';
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (host !== 'prnt.sc') return rawUrl;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    let response;
    try {
      response = await fetch(parsed.toString(), {
        signal: controller.signal,
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' },
      });
    } finally { clearTimeout(timeoutId); }
    if (!response.ok) return rawUrl;
    const html = await response.text();
    const metaMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i);
    if (!metaMatch?.[1]) return rawUrl;
    return new URL(metaMatch[1], parsed).toString();
  } catch { return rawUrl; }
}

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
// Load and parse a single blog post directly from the filesystem
// (avoids an internal HTTP call that can cause cold-start hangs on Vercel)
// ---------------------------------------------------------------------------
async function loadPost(slug) {
  let filePath = join(contentDir, `${slug}.md`);
  if (!existsSync(filePath)) {
    const files = readdirSync(contentDir).filter(f => f.endsWith('.md'));
    const matchFile = files.find(f => {
      const raw2 = readFileSync(join(contentDir, f), 'utf8');
      const { data: d } = parseFrontmatter(raw2);
      return d.slug === slug;
    });
    if (!matchFile) return null;
    filePath = join(contentDir, matchFile);
  }
  const raw = readFileSync(filePath, 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const bodyHtml = mdToHtml(body);
  const resolvedFeaturedImage = await resolveFeaturedImageUrl(data.featured_image || '');
  return {
    slug,
    title: data.title || slug,
    seoTitle: data.seo_title || data.title || slug,
    metaDescription: data.meta_description || data.excerpt || '',
    excerpt: data.excerpt || '',
    category: data.category || 'guides',
    categoryLabel: data.categoryLabel || data.category || 'Guides',
    date: data.date || '',
    emoji: data.emoji || '',
    readTime: data.read_time || '5 min read',
    featuredImage: resolvedFeaturedImage,
    featuredImageAlt: data.featured_image_alt || data.title || '',
    bodyHtml,
  };
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
    // Load post directly from the filesystem — no internal HTTP hop
    const post = await loadPost(slug);

    if (!post) {
      // Unknown slug — serve plain shell so client shows its own 404 message
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(rawHtml);
    }
    const canonicalUrl = `${BASE_URL}/blog/${post.slug}/`;
    const desc     = cleanDesc(post);
    const seoTitle = escHtml(`${post.seoTitle || post.title} — FansPedia Blog`);
    const ogImage  = (post.featuredImage && post.featuredImage.startsWith('http'))
                       ? post.featuredImage
                       : `${BASE_URL}/og-image.jpg`;

    let html = rawHtml;

    // 1. <title>
    html = html.replace(
      /<title id="pageTitle">[^<]*<\/title>/,
      `<title id="pageTitle">${seoTitle}</title>`
    );

    // 2. <meta description>
    html = html.replace(
      /<meta name="description" id="pageDesc" content="[^"]*">/,
      `<meta name="description" id="pageDesc" content="${escHtml(desc)}">`
    );

    // 3. <link canonical>
    html = html.replace(
      /<link rel="canonical" id="pageCanonical" href="[^"]*">/,
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
      /<main id="articleMain">[\s\S]*?<\/main>/,
      `<main id="articleMain">${articleHtml}\n</main>`
    );

    // 6. Send
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(html);

  } catch (err) {
    console.error('[ssr/blog-post] error:', err.message);
    // Fallback to plain template — client renders the post
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(rawHtml);
  }
}
