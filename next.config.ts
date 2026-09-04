import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.onlyfans.com' },
    ],
    deviceSizes: [240, 360, 480, 640, 720, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [32, 48, 64, 72, 96, 128, 256, 384],
    minimumCacheTTL: 2592000,
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
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=3600' },
        ],
      },
      {
        source: '/categories/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=3600' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Legacy Spanish (/es/*) URLs were dropped in the React migration.
      // Permanently redirect them to their English equivalents.
      {
        source: '/es',
        destination: '/',
        permanent: true,
      },
      {
        source: '/es/:path*',
        destination: '/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
