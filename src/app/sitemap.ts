import type { MetadataRoute } from 'next';
import { ALL_COUNTRY_SLUGS } from '@/config/countries';
import { ALL_CATEGORY_SLUGS } from '@/config/categories';
import { getAllPostSlugs } from '@/lib/blog';

const BASE = 'https://fanspedia.net';

export const revalidate = 86400;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/categories/`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/locations/`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/search/`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/blog/`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/about/`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contact/`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/privacy/`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/dmca/`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const countryPages: MetadataRoute.Sitemap = ALL_COUNTRY_SLUGS.map((slug) => ({
    url: `${BASE}/country/${slug}/`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = ALL_CATEGORY_SLUGS.map((slug) => ({
    url: `${BASE}/categories/${slug}/`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const blogSlugs = getAllPostSlugs();
  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${BASE}/blog/${slug}/`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticPages, ...countryPages, ...categoryPages, ...blogPages];
}
