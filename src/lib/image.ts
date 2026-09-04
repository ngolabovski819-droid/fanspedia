const IMAGE_QUALITY = 75;
const SRCSET_WIDTHS = [240, 360, 480, 720] as const;

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
    src: proxyImg(url, 480),
    srcSet,
    sizes: '(max-width: 575px) calc(50vw - 24px), (max-width: 767px) calc(33vw - 20px), (max-width: 991px) calc(25vw - 20px), 220px',
  };
}
