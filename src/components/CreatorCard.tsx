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
  const galleryImages = Array.from(new Set([
    override?.imageOverride ?? creator.avatar ?? creator.avatarC144,
    ...(override?.galleryImages ?? []),
    ...(!override?.imageOverride && creator.header ? [creator.header] : []),
  ].filter((url): url is string => Boolean(url))));
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage = galleryImages[activeImageIndex] ?? '/no-image.png';
  const dotWindowSize = 7;
  const dotWindowStart = Math.min(
    Math.max(activeImageIndex - Math.floor(dotWindowSize / 2), 0),
    Math.max(galleryImages.length - dotWindowSize, 0),
  );
  const visibleDotIndices = Array.from(
    { length: Math.min(dotWindowSize, galleryImages.length) },
    (_, offset) => dotWindowStart + offset,
  );
  const { src, srcSet, sizes } = activeImage.startsWith('/')
    ? { src: activeImage, srcSet: '', sizes: '' }
    : buildSrcset(activeImage);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    setWishlisted(isWishlisted(creator.username));
    setActiveImageIndex(0);
  }, [creator.username]);

  const changeImage = (event: React.MouseEvent, direction: -1 | 1) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveImageIndex((current) => (current + direction + galleryImages.length) % galleryImages.length);
  };

  const price =
    creator.subscribePrice === 0 || creator.subscribePrice === null
      ? 'Free'
      : `$${creator.subscribePrice.toFixed(2)}/mo`;

  const isFree = creator.subscribePrice === 0 || creator.subscribePrice === null;

  return (
    <article className={`creator-card${creator.sponsored ? ' creator-card-sponsored' : ''}`}>
      <Link
        href={override?.linkOverride ? `/go/${creator.username}` : `https://onlyfans.com/${creator.username}`}
        target="_blank"
        rel={`noopener nofollow${creator.sponsored ? ' sponsored' : ''}`}
        prefetch={false}
        className="card-clickable"
        aria-label={`View ${creator.name ?? creator.username} on OnlyFans`}
      >
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
          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                className="card-carousel-arrow card-carousel-arrow-prev"
                aria-label="Previous creator image"
                onClick={(event) => changeImage(event, -1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="card-carousel-arrow card-carousel-arrow-next"
                aria-label="Next creator image"
                onClick={(event) => changeImage(event, 1)}
              >
                ›
              </button>
              <div className="card-carousel-dots" aria-label={`Image ${activeImageIndex + 1} of ${galleryImages.length}`}>
                {visibleDotIndices.map((dotIndex) => (
                  <button
                    type="button"
                    className={`card-carousel-dot${dotIndex === activeImageIndex ? ' active' : ''}`}
                    aria-label={`Show creator image ${dotIndex + 1}`}
                    key={dotIndex}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setActiveImageIndex(dotIndex);
                    }}
                  />
                ))}
              </div>
            </>
          )}
          {creator.sponsored && (
            <span
              className="card-sponsored"
              title="Paid placement — this creator paid to be featured here"
              aria-label="Advertisement"
            >
              Ad
            </span>
          )}
          <button
            className={`card-wishlist${wishlisted ? ' active' : ''}`}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setWishlisted(toggleWishlist(creator.username));
            }}
          >
            {wishlisted ? '♥' : '♡'}
          </button>
          {creator.sponsored && override?.tags && override.tags.length > 0 && (
            <div className="card-content-tags" aria-label="Creator content tags">
              {override.tags.map((tag) => (
                <span className="card-content-tag" key={tag}>{tag}</span>
              ))}
              {Boolean(override.additionalTagCount) && (
                <span className="card-content-tag card-content-tag-more">
                  +{override.additionalTagCount}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="card-body">
          <div className="card-name-row">
            <p className="card-name">{creator.name ?? creator.username}</p>
            {creator.isVerified && (
              <span className="card-name-verified" aria-label="Verified creator" title="Verified">✓</span>
            )}
          </div>
          <p className="card-username">@{creator.username}</p>
          <p className={`card-price${isFree ? ' card-price-free' : ''}`}>{price}</p>
        </div>
        <span className="card-btn">View Profile</span>
      </Link>
    </article>
  );
}
