/**
 * Vercel Edge Middleware — Homepage SSR intercept
 *
 * Runs BEFORE Vercel's filesystem check, so it fires for GET /
 * even though index.html exists as a static file.
 *
 * Proxies the request to /api/ssr/home and returns the pre-rendered
 * HTML response (with creator cards + JSON-LD visible to Googlebot).
 *
 * On any error it falls through (returns undefined) so Vercel serves
 * the static index.html transparently.
 */

export const config = {
  matcher: ['/'],
};

export default async function middleware(request) {
  // Only intercept GET requests for the bare homepage
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const ssrUrl = new URL('/api/ssr/home', url.origin);

  try {
    const ssrResponse = await fetch(ssrUrl.toString(), {
      headers: {
        accept: request.headers.get('accept') || 'text/html',
        'accept-language': request.headers.get('accept-language') || '',
        'user-agent': request.headers.get('user-agent') || '',
      },
    });

    // If the SSR function errored, fall through to static file
    if (!ssrResponse.ok) return;

    const html = await ssrResponse.text();
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch {
    // Fall through to static index.html on any error
    return;
  }
}
