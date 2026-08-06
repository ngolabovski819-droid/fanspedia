'use client';

import { useEffect } from 'react';

// Patches a short-lived, signed proof-of-real-page-load onto every /go/ link on the page,
// fetched from an always-uncached endpoint (src/app/api/click-token/route.ts) — see
// src/lib/clickToken.ts for the full reasoning. Deliberately NOT done at render time: this
// site's creator listings are either ISR-cached (up to 24h, see categories/[slug]/page.tsx) or
// fetched client-side from a CDN-cached /api/search response, so anything baked into either of
// those would be shared identically by every visitor hitting that cache. Running from a plain
// HTTP client (curl/requests/aiohttp/Go/Java — exactly what shows up in this network's real bot
// traffic) simply never happens, since none of them execute page JavaScript at all.
//
// Deliberately generic — finds `/go/` links by DOM query rather than needing to know where or
// how they were rendered, so this works the same whether a card came from a server-rendered
// page or a client component's own fetch() (e.g. CreatorCard.tsx). Re-runs on DOM mutations so
// client-rendered/infinite-scroll cards get tokenized too, not just what was present on mount.
function extractGoUsername(href: string): string | null {
  const match = href.match(/^\/go\/([^/?]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function appendToken(href: string, token: string): string {
  return `${href}${href.includes('?') ? '&' : '?'}t=${token}`;
}

async function tokenizeGoLinks(root: ParentNode): Promise<void> {
  const found = root instanceof HTMLElement && root.matches('a[href^="/go/"]')
    ? [root as HTMLAnchorElement]
    : Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href^="/go/"]'));
  const pending = found.filter((a) => !a.dataset.tokenApplied);
  if (pending.length === 0) return;

  const usernames = [...new Set(
    pending.map((a) => extractGoUsername(a.getAttribute('href') ?? '')).filter((u): u is string => !!u),
  )];
  if (usernames.length === 0) return;

  let tokens: Record<string, string> = {};
  try {
    const resp = await fetch(`/api/click-token?u=${usernames.map(encodeURIComponent).join(',')}`);
    if (resp.ok) tokens = (await resp.json()).tokens ?? {};
  } catch {
    // No token this time — the link still works, the click just logs as unverified.
  }

  pending.forEach((a) => {
    a.dataset.tokenApplied = 'true'; // mark attempted either way, so a retry-storm can't happen
    const username = extractGoUsername(a.getAttribute('href') ?? '');
    const token = username ? tokens[username.toLowerCase()] : undefined;
    if (token) a.setAttribute('href', appendToken(a.getAttribute('href')!, token));
  });
}

export default function SponsoredLinkTokenizer() {
  useEffect(() => {
    void tokenizeGoLinks(document);
    const observer = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) void tokenizeGoLinks(node);
      }));
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
