// Cloudflare Worker to serve clean robots.txt without Cloudflare injection
// Deploy this at workers.cloudflare.com and route it to bestonlyfansgirls.net/robots.txt

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Only intercept /robots.txt
  if (url.pathname === '/robots.txt') {
    const robotsTxt = `# robots.txt for bestonlyfansgirls.net

# Block AI training bots
User-agent: Amazonbot
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: meta-externalagent
Disallow: /

# Allow all other bots
User-agent: *
Allow: /

# Sitemaps
Sitemap: https://bestonlyfansgirls.net/sitemap.xml

# Crawl-delay for good bots
Crawl-delay: 1`

    return new Response(robotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, must-revalidate',
        'X-Robots-Tag': 'noindex'
      }
    })
  }
  
  // For all other requests, pass through to origin
  return fetch(request)
}
