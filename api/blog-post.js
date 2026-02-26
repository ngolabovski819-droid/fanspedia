import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentDir = join(__dirname, '..', 'content', 'blog');

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

function mdToHtml(md) {
  if (!md) return '';

  md = md.replace(/\r\n/g, '\n');

  md = md.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const langTrimmed = lang.trim().toLowerCase();
    // Handle Mermaid diagrams (flowchart, graph, sequenceDiagram, etc.)
    if (langTrimmed === 'mermaid' || langTrimmed === 'flowchart' || langTrimmed.startsWith('graph')) {
      return `<div class="mermaid">${code.trim()}</div>\n\n`;
    }
    // Regular code blocks
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre><code class="language-${langTrimmed}">${escaped.trim()}</code></pre>\n\n`;
  });

  md = md.replace(/`([^`]+)`/g, (_, c) => {
    const escaped = c.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<code>${escaped}</code>`;
  });

  const blocks = md.split(/\n\s*\n+/);

  const htmlBlocks = blocks.map(block => {
    block = block.trim();
    if (!block) return '';
    if (block.startsWith('<pre>')) return block;

    const tableLines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (
      tableLines.length >= 2 &&
      tableLines[0].includes('|') &&
      isMarkdownTableSeparator(tableLines[1])
    ) {
      const headers = splitMarkdownTableRow(tableLines[0]);
      const alignments = parseMarkdownTableAlignments(tableLines[1]);
      const bodyRows = tableLines
        .slice(2)
        .filter(line => line.includes('|'))
        .map(splitMarkdownTableRow)
        .filter(row => row.some(cell => cell.length > 0));

      const thead = `<thead><tr>${headers
        .map((cell, i) => `<th${tableAlignAttr(alignments[i])}>${inlineFormat(cell)}</th>`)
        .join('')}</tr></thead>`;

      const tbody = bodyRows.length
        ? `<tbody>${bodyRows
            .map(row => `<tr>${headers
              .map((_, i) => `<td${tableAlignAttr(alignments[i])}>${inlineFormat(row[i] || '')}</td>`)
              .join('')}</tr>`)
            .join('')}</tbody>`
        : '';

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
      const items = block
        .split('\n')
        .filter(l => /^[-*]\s+/.test(l))
        .map(l => `<li>${inlineFormat(l.replace(/^[-*]\s+/, ''))}</li>`);
      return `<ul>${items.join('')}</ul>`;
    }

    if (/^\d+\.\s+/.test(block)) {
      const items = block
        .split('\n')
        .filter(l => /^\d+\.\s+/.test(l))
        .map(l => `<li>${inlineFormat(l.replace(/^\d+\.\s+/, ''))}</li>`);
      return `<ol>${items.join('')}</ol>`;
    }

    const lines = block.split('\n').map(l => inlineFormat(l)).join('<br>');
    return `<p>${lines}</p>`;
  });

  return htmlBlocks.filter(Boolean).join('\n');
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
    const left = col.startsWith(':');
    const right = col.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    return 'left';
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

async function resolveFeaturedImageUrl(rawUrl) {
  if (!rawUrl) return '';

  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');

    if (host !== 'prnt.sc') {
      return rawUrl;
    }

    const response = await fetch(parsed.toString(), {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      return rawUrl;
    }

    const html = await response.text();
    const metaMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i) ||
      html.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*name=["']twitter:image(?::src)?["'][^>]*>/i);

    if (!metaMatch?.[1]) {
      return rawUrl;
    }

    return new URL(metaMatch[1], parsed).toString();
  } catch {
    return rawUrl;
  }
}

export default async function handler(req, res) {
  const slug = req.query.slug;
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    res.status(400).json({ error: 'Invalid slug' });
    return;
  }

  // First try exact filename match, then scan for frontmatter slug match
  let filePath = join(contentDir, `${slug}.md`);
  if (!existsSync(filePath)) {
    const files = readdirSync(contentDir).filter(f => f.endsWith('.md'));
    const match = files.find(f => {
      const raw2 = readFileSync(join(contentDir, f), 'utf8');
      const { data: d } = parseFrontmatter(raw2);
      return d.slug === slug;
    });
    if (!match) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    filePath = join(contentDir, match);
  }

  try {
    const raw = readFileSync(filePath, 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const bodyHtml = mdToHtml(body);
    const resolvedFeaturedImage = await resolveFeaturedImageUrl(data.featured_image || '');

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.end(JSON.stringify({
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
    }));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read post', message: String(err) });
  }
}
