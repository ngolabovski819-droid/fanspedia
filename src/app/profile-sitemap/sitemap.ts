import type { MetadataRoute } from 'next';
import { PUBLISHED_CREATORS } from '@/config/creators';

const BASE = 'https://fanspedia.net';

// modelsearcher-style paginated profile sitemap: each file holds up to 200
// published creator profile URLs. New creators (added in src/config/creators.ts)
// fill the current page; once it hits 200 a new page is generated automatically.
export const CREATORS_PER_SITEMAP = 200;

export const revalidate = 86400;

// Tell Next.js how many profile sitemap files to generate (0-based ids).
// Always at least one file so /profile-sitemap/sitemap/0.xml exists.
export async function generateSitemaps() {
  const pages = Math.max(1, Math.ceil(PUBLISHED_CREATORS.length / CREATORS_PER_SITEMAP));
  return Array.from({ length: pages }, (_, id) => ({ id }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const pageId = Number(id) || 0;
  const start = pageId * CREATORS_PER_SITEMAP;
  const slice = PUBLISHED_CREATORS.slice(start, start + CREATORS_PER_SITEMAP);
  const now = new Date();

  return slice.map((username) => ({
    url: `${BASE}/creator/${username}/`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));
}
