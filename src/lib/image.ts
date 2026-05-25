const WSRV = 'https://images.weserv.nl';

export function proxyImg(url: string, w?: number, h?: number): string {
  if (!url) return '/no-image.png';
  const params = new URLSearchParams({ url, n: '-1' });
  if (w) params.set('w', String(w));
  if (h) params.set('h', String(h));
  params.set('output', 'webp');
  params.set('q', '82');
  return `${WSRV}/?${params.toString()}`;
}

export function buildSrcset(url: string | null | undefined): {
  src: string;
  srcSet: string;
  sizes: string;
} {
  if (!url) return { src: '/no-image.png', srcSet: '', sizes: '' };

  const widths = [240, 360, 480, 720];
  const srcSet = widths
    .map((w) => `${proxyImg(url, w)} ${w}w`)
    .join(', ');

  return {
    src: proxyImg(url, 480),
    srcSet,
    sizes: '(max-width: 575px) calc(50vw - 24px), (max-width: 767px) calc(33vw - 20px), (max-width: 991px) calc(25vw - 20px), 220px',
  };
}
