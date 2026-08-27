/**
 * Per-page lead-image rotation for sponsored cards.
 *
 * A sponsor's card is pinned on the homepage, every country page and every
 * category page (src/config/featured.ts), so a visitor browsing home → country →
 * category would otherwise see the exact same creative three times in a row.
 * Instead, each page rotates the sponsor's gallery so a different image leads:
 * the offset is a stable hash of the page path + username, which is identical
 * on the server and the client (no hydration mismatch, no image flash after
 * mount, and the eagerly-loaded LCP image is the one that stays on screen).
 *
 * The homepage is pinned to offset 0 so the configured `imageOverride` (the
 * client's chosen card face) always leads on the highest-traffic page; every
 * other path rotates deterministically. Same path → same image on every visit.
 */

/** FNV-1a 32-bit — tiny, dependency-free, good enough spread for a few dozen slots. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Offset into a gallery of `length` images for this page + sponsor. */
export function sponsorImageOffset(pathname: string | null, username: string, length: number): number {
  if (length <= 1) return 0;
  const path = pathname && pathname !== '' ? pathname : '/';
  if (path === '/') return 0;
  return hashString(`${path}|${username.toLowerCase()}`) % length;
}

/** Rotate `images` left by `offset` so `images[offset]` becomes the first (card-face) image. */
export function rotateGallery<T>(images: T[], offset: number): T[] {
  if (images.length <= 1 || offset === 0) return images;
  const k = ((offset % images.length) + images.length) % images.length;
  return [...images.slice(k), ...images.slice(0, k)];
}
