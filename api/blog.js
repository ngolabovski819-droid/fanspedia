import { readFileSync, readdirSync, existsSync } from 'fs';
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

function readAllPosts() {
  if (!existsSync(contentDir)) return [];
  const files = readdirSync(contentDir).filter(f => f.endsWith('.md'));
  const posts = files.map(file => {
    const raw = readFileSync(join(contentDir, file), 'utf8');
    const { data } = parseFrontmatter(raw);
    const slug = data.slug;
    if (!slug) return null;
    return {
      slug,
      title: data.title || slug,
      excerpt: data.excerpt || '',
      category: data.category || 'guides',
      categoryLabel: data.categoryLabel || data.category || 'Guides',
      date: data.date || '2026-01-01',
      emoji: data.emoji || '',
      readTime: data.read_time || '5 min read',
      featuredImage: data.featured_image || '',
      featuredImageAlt: data.featured_image_alt || data.title || '',
    };
  }).filter(Boolean);
  // Sort newest first
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const posts = readAllPosts();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.end(JSON.stringify(posts));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read blog posts', message: String(err) });
  }
}
