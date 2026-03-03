<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="sm xhtml">

  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>FansPedia Sitemap</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f1a; color: #e0e0f0; min-height: 100vh; padding: 32px 16px; }
          .wrap { max-width: 960px; margin: 0 auto; }
          header { display: flex; align-items: center; gap: 14px; margin-bottom: 32px; }
          .logo { width: 40px; height: 40px; background: linear-gradient(135deg,#00AFF0,#0099D6); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
          .logo svg { width: 22px; height: 22px; fill: white; }
          h1 { font-size: 1.6rem; font-weight: 700; color: #fff; }
          h1 span { color: #00AFF0; }
          .meta { color: #888; font-size: 0.85rem; margin-top: 2px; }
          .card { background: #1a1a2e; border: 1px solid #2a2a45; border-radius: 14px; overflow: hidden; }
          table { width: 100%; border-collapse: collapse; }
          thead tr { background: #16213e; }
          th { padding: 14px 18px; text-align: left; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #888; border-bottom: 1px solid #2a2a45; }
          td { padding: 12px 18px; font-size: 0.88rem; border-bottom: 1px solid #1e1e32; vertical-align: middle; }
          tbody tr:last-child td { border-bottom: none; }
          tbody tr:hover { background: #1e1e38; }
          td a { color: #00AFF0; text-decoration: none; word-break: break-all; }
          td a:hover { text-decoration: underline; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
          .freq-daily   { background: #0d3b2e; color: #34d399; }
          .freq-weekly  { background: #0d2d4a; color: #60a5fa; }
          .freq-monthly { background: #2d1b4a; color: #c084fc; }
          .freq-yearly  { background: #2a1a0e; color: #fb923c; }
          .pri { font-weight: 700; color: #f0f0f0; }
          .pri-low { color: #666; font-weight: 400; }
          .date { color: #666; font-size: 0.82rem; white-space: nowrap; }
          .count { font-size: 0.82rem; color: #888; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <header>
            <div class="logo">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" opacity="0.8"/>
                <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z"/>
              </svg>
            </div>
            <div>
              <h1>Fans<span>Pedia</span> Sitemap</h1>
              <div class="meta">
                <xsl:value-of select="count(//sm:url | //sm:sitemap)"/> URLs listed
              </div>
            </div>
          </header>

          <div class="card">
            <table>
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Last Modified</th>
                  <th>Change Freq</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="//sm:url">
                  <tr>
                    <td>
                      <a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a>
                    </td>
                    <td class="date"><xsl:value-of select="sm:lastmod"/></td>
                    <td>
                      <xsl:variable name="freq" select="sm:changefreq"/>
                      <span class="badge freq-{$freq}"><xsl:value-of select="$freq"/></span>
                    </td>
                    <td>
                      <xsl:variable name="pri" select="sm:priority"/>
                      <xsl:choose>
                        <xsl:when test="number($pri) >= 0.8"><span class="pri"><xsl:value-of select="$pri"/></span></xsl:when>
                        <xsl:otherwise><span class="pri-low"><xsl:value-of select="$pri"/></span></xsl:otherwise>
                      </xsl:choose>
                    </td>
                  </tr>
                </xsl:for-each>
                <xsl:for-each select="//sm:sitemap">
                  <tr>
                    <td><a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a></td>
                    <td class="date"><xsl:value-of select="sm:lastmod"/></td>
                    <td><span class="badge freq-weekly">index</span></td>
                    <td>—</td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
