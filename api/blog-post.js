import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

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

marked.setOptions({
  gfm: true,
  breaks: true,
});

function mdToHtml(md) {
  if (!md) return '';

  const html = marked.parse(md);

  return String(html)
    .replace(/<table>/g, '<div class="table-wrap"><table>')
    .replace(/<\/table>/g, '</table></div>');
}

export default function handler(req, res) {
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
