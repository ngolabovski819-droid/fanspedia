// Must match `images.qualities` in next.config.ts. Changing it re-bills every cached photo.
const IMAGE_QUALITY = 75;

// Vercel bills one transformation per unique (source image, width, quality, format), so every
// width here is one more billed copy of every creator photo. 360 (1x) and 720 (2x / phones)
// cover a card slot that never renders wider than 360 CSS px.
const SRCSET_WIDTHS = [360, 720] as const;

// Must be one of SRCSET_WIDTHS, or it becomes an extra billed width for browsers that use `src`.
const DEFAULT_WIDTH = 360;

/**
 * next/image must receive the original URL so it can validate and optimize it.
 * Passing no width preserves that URL; width-aware callers use the same-origin
 * optimizer path used by plain img elements.
 */
export function buildImageUrl(url: string, width?: number): string {
  if (!url) return '/no-image.png';
  if (url.startsWith('/') || width === undefined) return url;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=${IMAGE_QUALITY}`;
}

export function proxyImg(url: string, w?: number, h?: number): string {
  void h; // Kept for call-site compatibility; Next preserves the source aspect ratio.
  return buildImageUrl(url, w);
}

export function buildSrcset(url: string | null | undefined): {
  src: string;
  srcSet: string;
  sizes: string;
} {
  if (!url) return { src: '/no-image.png', srcSet: '', sizes: '' };
  if (url.startsWith('/')) return { src: url, srcSet: '', sizes: '' };

  const srcSet = SRCSET_WIDTHS
    .map((w) => `${proxyImg(url, w)} ${w}w`)
    .join(', ');

  return {
    src: proxyImg(url, DEFAULT_WIDTH),
    srcSet,
    sizes: '(max-width: 575px) 50vw, (max-width: 767px) 33vw, (max-width: 991px) 25vw, 220px',
  };
}
