import type { MetadataRoute } from 'next';
import { PUBLISHED_CREATORS } from '@/config/creators';
import { CREATORS_PER_SITEMAP } from './profile-sitemap/sitemap';

const BASE = 'https://fanspedia.net';

export default function robots(): MetadataRoute.Robots {
  const profilePages = Math.max(
    1,
    Math.ceil(PUBLISHED_CREATORS.length / CREATORS_PER_SITEMAP),
  );
  const profileSitemaps = Array.from(
    { length: profilePages },
    (_, id) => `${BASE}/profile-sitemap/sitemap/${id}.xml`,
  );

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: [`${BASE}/sitemap.xml`, ...profileSitemaps],
  };
}
