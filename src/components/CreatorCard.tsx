'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import type { Creator } from '@/types/creator';
import { buildSrcset } from '@/lib/image';
import { getSponsorOverride } from '@/config/sponsors';
import { isWishlisted, toggleWishlist } from '@/lib/wishlist';

interface Props {
  creator: Creator;
  index: number;
}

export default function CreatorCard({ creator, index }: Props) {
  const isEager = index < 4;
  const override = getSponsorOverride(creator.username);
  const imgUrl = creator.avatar ?? creator.avatarC144;
  const { src, srcSet, sizes } = override?.imageOverride
    ? { src: override.imageOverride, srcSet: '', sizes: '' }
    : buildSrcset(imgUrl);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    setWishlisted(isWishlisted(creator.username));
  }, [creator.username]);

  const price =
    creator.subscribePrice === 0 || creator.subscribePrice === null
      ? 'Free'
      : `$${creator.subscribePrice.toFixed(2)}/mo`;

  const isFree = creator.subscribePrice === 0 || creator.subscribePrice === null;

  return (
    <article className={`creator-card${creator.sponsored ? ' creator-card-sponsored' : ''}`}>
      <div className="card-img-wrap">
        <Image
          src={src}
          alt={creator.name ?? creator.username}
          fill
          sizes={sizes}
          loading={isEager ? 'eager' : 'lazy'}
          fetchPriority={isEager ? 'high' : 'auto'}
          style={{ objectFit: 'cover' }}
          unoptimized
          {...(srcSet ? { srcSet } : {})}
        />
        {creator.sponsored && (
          <span className="card-sponsored" title="Paid placement — this creator paid to be featured here">
            Ad · Sponsored
          </span>
        )}
        {creator.isVerified && (
          <span className="card-verified" aria-label="Verified creator">✓ Verified</span>
        )}
        <button
          className={`card-wishlist${wishlisted ? ' active' : ''}`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={(e) => {
            e.preventDefault();
            setWishlisted(toggleWishlist(creator.username));
          }}
        >
          {wishlisted ? '♥' : '♡'}
        </button>
      </div>
      <div className="card-body">
        <p className="card-name">{creator.name ?? creator.username}</p>
        <p className="card-username">@{creator.username}</p>
        <p className={`card-price${isFree ? ' card-price-free' : ''}`}>{price}</p>
      </div>
      <Link
        href={override?.linkOverride ?? `https://onlyfans.com/${creator.username}`}
        target="_blank"
        rel={`noopener noreferrer nofollow${creator.sponsored ? ' sponsored' : ''}`}
        className="card-btn"
        aria-label={`View ${creator.name ?? creator.username} on OnlyFans`}
      >
        View Profile
      </Link>
    </article>
  );
}
