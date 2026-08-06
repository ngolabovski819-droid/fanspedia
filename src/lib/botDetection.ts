/**
 * User-Agent based bot/crawler filter for the click-tracking redirect (src/app/go/[username]/route.ts).
 * Deliberately conservative — a missing/empty UA is treated as a bot too, since real browsers
 * always send one and paid-click accuracy matters more than logging every edge case.
 *
 * "bot"/"crawl"/"spider" are matched as bare substrings, not whole words, on purpose: a
 * stricter \bbot\b requires a word boundary right before "Bot", which real-world crawler names
 * like `SleepBot` and `OAI-SearchBot` (both seen on this network's click logs) don't have —
 * "Sleep"+"Bot" run together with no boundary between them, so \bbot\b silently let both through.
 * No legitimate browser UA has ever been observed containing "bot"/"crawl"/"spider" as a
 * substring, so the looser match costs nothing in practice. This also means most named
 * "___bot" crawlers (googlebot, ahrefsbot, semrushbot, etc.) don't need their own entry below —
 * bare "bot" already catches them. Only names that DON'T contain bot/crawl/spider get one.
 *
 * This file is intentionally kept in sync (same patterns) across all 4 network sites —
 * findbyface, fanspedia.net, onlyamericanfans.com, onlyaussiefans.com — each as its own
 * `botDetection`/`bot-detection` lib module per that repo's own naming convention. There's no
 * shared package between these repos, so "in sync" means copied by hand; update all 4 together.
 */
const BOT_PATTERNS: RegExp[] = [
  // Generic tells
  /bot/i, /crawl/i, /spider/i, /slurp/i, /headless/i, /scrapy/i,
  // CLI / HTTP / scripting libraries — never a real click
  /curl\//i, /wget/i, /python-requests/i, /python-urllib/i, /aiohttp/i, /go-http-client/i,
  /okhttp/i, /node-fetch/i, /^axios/i, /postmanruntime/i, /^java\//i, /libwww-perl/i,
  // Headless / automation browsers
  /phantomjs/i, /puppeteer/i, /playwright/i, /selenium/i,
  // Named crawlers whose UA doesn't contain bot/crawl/spider
  /facebookexternalhit/i, /whatsapp/i, /bingpreview/i, /embedly/i,
];

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  const ua = (userAgent ?? '').trim();
  if (!ua) return true;
  return BOT_PATTERNS.some((re) => re.test(ua));
}
