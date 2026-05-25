import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  category: string;
  categoryLabel: string;
  readTime: string;
  featuredImage: string;
  featuredImageAlt: string;
  seoTitle: string;
  metaDescription: string;
  content: string;
}

export interface BlogPostMeta extends Omit<BlogPost, 'content'> {}

export function getAllPostSlugs(): string[] {
  try {
    return fs
      .readdirSync(BLOG_DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''));
  } catch {
    return [];
  }
}

export function getAllPosts(): BlogPostMeta[] {
  const slugs = getAllPostSlugs();
  return slugs
    .map((slug) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, `${slug}.md`), 'utf8');
      const { data } = matter(raw);
      return {
        slug: data.slug ?? slug,
        title: data.title ?? '',
        date: data.date ? String(data.date) : '',
        category: data.category ?? '',
        categoryLabel: data.categoryLabel ?? data.category ?? '',
        readTime: data.read_time ?? '',
        featuredImage: data.featured_image ?? '',
        featuredImageAlt: data.featured_image_alt ?? '',
        seoTitle: data.seo_title ?? data.title ?? '',
        metaDescription: data.meta_description ?? '',
      } as BlogPostMeta;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  return {
    slug: data.slug ?? slug,
    title: data.title ?? '',
    date: data.date ? String(data.date) : '',
    category: data.category ?? '',
    categoryLabel: data.categoryLabel ?? data.category ?? '',
    readTime: data.read_time ?? '',
    featuredImage: data.featured_image ?? '',
    featuredImageAlt: data.featured_image_alt ?? '',
    seoTitle: data.seo_title ?? data.title ?? '',
    metaDescription: data.meta_description ?? '',
    content,
  };
}
