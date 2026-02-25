import { readFileSync, existsSync } from 'fs';
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

// Minimal Markdown → HTML converter
function mdToHtml(md) {
  if (!md) return '';

  // Fenced code blocks
  md = md.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre><code class="language-${lang.trim()}">${escaped.trim()}</code></pre>\n\n`;
  });

  // Inline code
  md = md.replace(/`([^`]+)`/g, (_, c) => {
    const escaped = c.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<code>${escaped}</code>`;
  });

  // Split into blocks by double newline
  const blocks = md.split(/\n{2,}/);
  const htmlBlocks = blocks.map(block => {
    block = block.trim();
    if (!block) return '';

    // Already HTML (from code block replacement)
    if (block.startsWith('<pre>')) return block;

    // Headings
    if (/^### /.test(block)) return `<h3>${inlineFormat(block.slice(4))}</h3>`;
    if (/^## /.test(block)) return `<h2>${inlineFormat(block.slice(3))}</h2>`;
    if (/^# /.test(block)) return `<h1>${inlineFormat(block.slice(2))}</h1>`;

    // Blockquote
    if (/^> /.test(block)) {
      const content = block.split('\n').map(l => l.replace(/^> /, '')).join('\n');
      return `<blockquote>${inlineFormat(content)}</blockquote>`;
    }

    // Horizontal rule
    if (/^---+$/.test(block)) return '<hr>';

    // Unordered list
    if (/^[-*] /.test(block)) {
      const items = block.split('\n').filter(l => /^[-*] /.test(l)).map(l => `<li>${inlineFormat(l.slice(2))}</li>`);
      return `<ul>${items.join('')}</ul>`;
    }

    // Ordered list
    if (/^\d+\. /.test(block)) {
      const items = block.split('\n').filter(l => /^\d+\. /.test(l)).map(l => `<li>${inlineFormat(l.replace(/^\d+\. /, ''))}</li>`);
      return `<ol>${items.join('')}</ol>`;
    }

    // Paragraph
    const lines = block.split('\n').map(l => inlineFormat(l)).join('<br>');
    return `<p>${lines}</p>`;
  });

  return htmlBlocks.filter(Boolean).join('\n');
}

function inlineFormat(text) {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
}

export default function handler(req, res) {
  const slug = req.query.slug;
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    res.status(400).json({ error: 'Invalid slug' });
    return;
  }

  const filePath = join(contentDir, `${slug}.md`);
  if (!existsSync(filePath)) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }

  try {
    const raw = readFileSync(filePath, 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const bodyHtml = mdToHtml(body);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.end(JSON.stringify({
      slug,
      title: data.title || slug,
      seoTitle: data.seo_title || data.title || slug,
      metaDescription: data.meta_description || data.excerpt || '',
      excerpt: data.excerpt || '',
      category: data.category || 'guides',
      categoryLabel: data.categoryLabel || data.category || 'Guides',
      date: data.date || '',
      emoji: data.emoji || '📝',
      readTime: data.read_time || '5 min read',
      bodyHtml,
    }));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read post', message: String(err) });
  }
}
