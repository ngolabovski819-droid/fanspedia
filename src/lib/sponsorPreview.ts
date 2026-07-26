import type { Creator } from '@/types/creator';

// Module-level cache so multiple components mounting on the same page
// (e.g. Nav + HomeSearch on the homepage) share one request.
let cached: Promise<Creator | null> | null = null;

export function getSponsorPreview(): Promise<Creator | null> {
  if (!cached) {
    cached = fetch('/api/sponsor-preview')
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
  }
  return cached;
}
