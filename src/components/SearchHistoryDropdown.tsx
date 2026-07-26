'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Creator } from '@/types/creator';
import { getSponsorPreview } from '@/lib/sponsorPreview';
import { getSponsorOverride } from '@/config/sponsors';
import { proxyImg } from '@/lib/image';

interface SearchHistoryDropdownProps {
  history: string[];
  onSelect: (term: string) => void;
  onRemove: (term: string) => void;
  onClear: () => void;
}

// preventDefault on mousedown stops the input from blurring before the click
// registers, so selecting/removing an item doesn't close the dropdown first.
const keepFocus = (e: React.MouseEvent) => e.preventDefault();

export default function SearchHistoryDropdown({ history, onSelect, onRemove, onClear }: SearchHistoryDropdownProps) {
  // undefined = still loading, null = no sponsor configured/found
  const [sponsor, setSponsor] = useState<Creator | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getSponsorPreview().then((c) => { if (!cancelled) setSponsor(c); });
    return () => { cancelled = true; };
  }, []);

  // Nothing to show yet (sponsor still loading, no history) — avoid an empty-box flash.
  if (!sponsor && history.length === 0) return null;

  const override = sponsor ? getSponsorOverride(sponsor.username) : undefined;
  const sponsorHref = sponsor
    ? override?.linkOverride
      ? `/go/${sponsor.username}?placement=search-dropdown`
      : `https://onlyfans.com/${sponsor.username}`
    : undefined;
  const sponsorImgUrl = override?.imageOverride ?? sponsor?.avatarC144 ?? sponsor?.avatar;

  return (
    <div className="search-history-dropdown" role="listbox">
      {sponsor && sponsorHref && (
        <>
          <Link
            href={sponsorHref}
            target="_blank"
            rel="noopener nofollow sponsored"
            prefetch={false}
            className="search-sponsor-row"
            onMouseDown={keepFocus}
          >
            {sponsorImgUrl && (
              // Fixed small thumbnail — not worth next/image's responsive srcset ceremony.
              // eslint-disable-next-line @next/next/no-img-element
              <img className="search-sponsor-avatar" src={proxyImg(sponsorImgUrl, 72, 72)} alt="" width={36} height={36} />
            )}
            <span className="search-sponsor-name">{sponsor.name ?? sponsor.username}</span>
            <span className="search-sponsor-badge">Ad · Sponsored</span>
          </Link>
          {history.length > 0 && <div className="search-history-divider" />}
        </>
      )}
      {history.length > 0 && (
        <>
          <div className="search-history-header">
            <span>Recent searches</span>
            <button type="button" onMouseDown={keepFocus} onClick={onClear}>Clear</button>
          </div>
          {history.map((term) => (
            <div key={term} className="search-history-item">
              <button
                type="button"
                className="search-history-term"
                onMouseDown={keepFocus}
                onClick={() => onSelect(term)}
              >
                {term}
              </button>
              <button
                type="button"
                className="search-history-remove"
                aria-label={`Remove "${term}" from search history`}
                onMouseDown={keepFocus}
                onClick={() => onRemove(term)}
              >
                ×
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
