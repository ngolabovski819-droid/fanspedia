import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Build one page at a time so Supabase isn't hit by N concurrent ilike queries.
    // 163 pages × ~3 s avg ≈ 8-min build — well within Vercel's 45-min limit.
    staticGenerationMaxConcurrency: 1,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.weserv.nl' },
      { protocol: 'https', hostname: 'thumbs.onlyfans.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      {
        source: '/country/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=600' },
        ],
      },
      {
        source: '/categories/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=600' },
        ],
      },
    ];
  },
  async redirects() {
    return [];
  },
};

export default nextConfig;
