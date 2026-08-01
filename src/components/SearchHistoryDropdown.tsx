'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Creator } from '@/types/creator';
import { getSponsorPreviews } from '@/lib/sponsorPreview';
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
  // undefined = still loading, [] = no sponsors configured/found
  const [sponsors, setSponsors] = useState<Creator[] | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getSponsorPreviews().then((creators) => { if (!cancelled) setSponsors(creators); });
    return () => { cancelled = true; };
  }, []);

  // Nothing to show yet (sponsors still loading, no history) — avoid an empty-box flash.
  if ((!sponsors || sponsors.length === 0) && history.length === 0) return null;

  return (
    <div className="search-history-dropdown" role="listbox">
      {sponsors && sponsors.length > 0 && (
        <>
          {sponsors.map((sponsor) => {
            const override = getSponsorOverride(sponsor.username);
            const sponsorHref = override?.linkOverride
              ? `/go/${sponsor.username}?placement=search-dropdown`
              : `https://onlyfans.com/${sponsor.username}`;
            const sponsorImgUrl = override?.imageOverride ?? sponsor.avatarC144 ?? sponsor.avatar;
            const thumbnailUrl = sponsorImgUrl?.startsWith('/')
              ? sponsorImgUrl
              : sponsorImgUrl
                ? proxyImg(sponsorImgUrl, 72, 72)
                : undefined;

            return (
              <Link
                href={sponsorHref}
                target="_blank"
                rel="noopener nofollow sponsored"
                prefetch={false}
                className="search-sponsor-row"
                onMouseDown={keepFocus}
                key={sponsor.username}
              >
                {thumbnailUrl && (
                  // Fixed small thumbnail — not worth next/image's responsive srcset ceremony.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="search-sponsor-avatar" src={thumbnailUrl} alt="" width={36} height={36} />
                )}
                <span className="search-sponsor-name">{sponsor.name ?? sponsor.username}</span>
                <span className="search-sponsor-badge">Ad · Sponsored</span>
              </Link>
            );
          })}
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
