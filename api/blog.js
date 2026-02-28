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

async function readAllPosts() {
  if (!existsSync(contentDir)) return [];
  const files = readdirSync(contentDir).filter(f => f.endsWith('.md'));
  const posts = await Promise.all(files.map(async file => {
    const raw = readFileSync(join(contentDir, file), 'utf8');
    const { data } = parseFrontmatter(raw);
    const slug = data.slug;
    if (!slug) return null;
    const resolvedFeaturedImage = await resolveFeaturedImageUrl(data.featured_image || '');
    return {
      slug,
      title: data.title || slug,
      excerpt: data.excerpt || '',
      category: data.category || 'guides',
      categoryLabel: data.categoryLabel || data.category || 'Guides',
      date: data.date || '2026-01-01',
      emoji: data.emoji || '',
      readTime: data.read_time || '5 min read',
      featuredImage: resolvedFeaturedImage,
      featuredImageAlt: data.featured_image_alt || data.title || '',
    };
  }));
  const filtered = posts.filter(Boolean);
  // Sort newest first
  return filtered.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export { readAllPosts };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const posts = await readAllPosts();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.end(JSON.stringify(posts));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read blog posts', message: String(err) });
  }
}
