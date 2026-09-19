import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.onlyfans.com' },
    ],
    // Vercel bills one transformation per unique (source, width, quality, format). These two
    // lists are both the widths next/image may put in a srcset AND the allowlist /_next/image
    // enforces — any other ?w= now 400s instead of billing. Clamped to what the site renders:
    //   360 + 720 — creator cards (25vw smallest ratio → next/image keeps widths >= 180)
    //   720       — creator page avatar (100vw → keeps widths >= 720)
    //   96        — homepage avatar strip (src/app/page.tsx)
    //   72        — search-dropdown sponsor thumb (SearchHistoryDropdown.tsx)
    // Before this, each card offered the browser up to 20 widths (32-3840px), so the same
    // photo was billed once per distinct device size that viewed it.
    deviceSizes: [720],
    imageSizes: [72, 96, 360],
    // Next 16's default, pinned so it stays in lockstep with IMAGE_QUALITY in src/lib/image.ts.
    qualities: [75],
    // One year, up from 30 days. OnlyFans photo URLs are immutable (hash + upload timestamp in
    // the path; a new avatar gets a new URL), so a 30-day TTL re-billed identical output every
    // month. Vercel keeps this cache across deploys.
    minimumCacheTTL: 31536000,
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

// Local `next dev` only — production builds use nextConfig unchanged.
// Turbopack's default runs PostCSS in a separate node.exe per job, and on Windows it started
// 200+ of them at once compiling a single page; across several dev servers that reached 1,386
// processes / 18.5 GB and froze the machine (2026-09-19). Worker threads keep that work inside
// the one dev-server process.
export default function config(phase: string): NextConfig {
  if (phase !== PHASE_DEVELOPMENT_SERVER) return nextConfig;
  return {
    ...nextConfig,
    experimental: { ...nextConfig.experimental, turbopackPluginRuntimeStrategy: 'workerThreads' },
  };
}
