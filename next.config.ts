import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Build popular category/country pages one at a time so Supabase is never
  // flooded with concurrent requests. Sequential build takes ~20s extra but
  // means every popular page is fully pre-rendered with cards — no skeleton ever.
  experimental: {
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
    return [
      { source: '/search', destination: '/search/', permanent: false },
    ];
  },
};

export default nextConfig;
