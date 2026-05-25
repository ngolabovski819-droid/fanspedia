import Image from 'next/image';
import Link from 'next/link';
import type { Creator } from '@/types/creator';
import { buildSrcset } from '@/lib/image';

interface Props {
  creator: Creator;
  index: number;
}

export default function CreatorCard({ creator, index }: Props) {
  const isEager = index < 4;
  const imgUrl = creator.avatar ?? creator.avatarC144;
  const { src, srcSet, sizes } = buildSrcset(imgUrl);

  const price =
    creator.subscribePrice === 0 || creator.subscribePrice === null
      ? 'Free'
      : `$${creator.subscribePrice.toFixed(2)}/mo`;

  const isFree = creator.subscribePrice === 0 || creator.subscribePrice === null;

  return (
    <article className="creator-card">
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
        {creator.isVerified && (
          <span className="card-verified" aria-label="Verified creator">✓ Verified</span>
        )}
      </div>
      <div className="card-body">
        <p className="card-name">{creator.name ?? creator.username}</p>
        <p className="card-username">@{creator.username}</p>
        <p className={`card-price${isFree ? ' card-price-free' : ''}`}>{price}</p>
      </div>
      <Link
        href={`https://onlyfans.com/${creator.username}`}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="card-btn"
        aria-label={`View ${creator.name ?? creator.username} on OnlyFans`}
      >
        View Profile
      </Link>
    </article>
  );
}
