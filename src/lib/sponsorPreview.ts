import type { Creator } from '@/types/creator';

// Module-level cache so multiple components mounting on the same page
// (e.g. Nav + HomeSearch on the homepage) share one request.
let cached: Promise<Creator[]> | null = null;

export function getSponsorPreviews(): Promise<Creator[]> {
  if (!cached) {
    // Version the request when the configured sponsor list changes. The
    // endpoint previously returned one object, so keep normalizing old payloads
    // as a defensive fallback as well.
    cached = fetch('/api/sponsor-preview?v=5')
      .then((res) => (res.ok ? res.json() : []))
      .then((payload: Creator[] | Creator | null) => (
        Array.isArray(payload) ? payload : payload ? [payload] : []
      ))
      .catch(() => []);
  }
  return cached;
}
