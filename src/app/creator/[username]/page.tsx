import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fetchCreatorProfile, fetchCreatorSnapshots, fetchCreators } from '@/lib/supabase';
import { proxyImg } from '@/lib/image';
import { PUBLISHED_CREATORS, isPublishedCreator } from '@/config/creators';
import { getSponsorOverride } from '@/config/sponsors';
import CreatorCharts from '@/components/CreatorCharts';
import CreatorBio from '@/components/CreatorBio';
import SimilarCreators from '@/components/SimilarCreators';
import type { CreatorProfile } from '@/types/creator';

// ISR: refresh every 5 min so newly-scraped snapshots show up without a rebuild.
export const revalidate = 300;
// Only usernames returned by generateStaticParams (the published allow-list) are
// served — every other username 404s instead of generating on demand.
export const dynamicParams = false;

// Pre-render exactly the creators we've explicitly chosen to publish.
export async function generateStaticParams() {
  return PUBLISHED_CREATORS.map((username) => ({ username }));
}

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  if (!isPublishedCreator(username)) return { title: 'Creator not found' };
  const creator = await fetchCreatorProfile(decodeURIComponent(username));
  if (!creator) return { title: 'Creator not found' };

  const display = creator.name ?? creator.username;
  const title = `${display} (@${creator.username}) OnlyFans Profile`;
  const description = `${display} (@${creator.username}) OnlyFans stats: photos, videos, posts, likes and growth charts tracked over time on FansPedia.`;
  const url = `https://fanspedia.net/creator/${creator.username}/`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: creator.avatar ? [{ url: proxyImg(creator.avatar, 480) }] : undefined,
    },
  };
}

const numberFmt = new Intl.NumberFormat('en-US');

function fmtNum(n: number | null): string {
  return n == null ? '—' : numberFmt.format(n);
}

function fmtDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// The `about` column can contain raw HTML (links, <br>, etc.). Strip tags and
// decode the common entities so we render clean plain text.
function plainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="cp-stat">
      <span className="cp-stat-label">{label}</span>
      <span className="cp-stat-value">{value}</span>
    </div>
  );
}

function priceLabel(creator: CreatorProfile): string {
  if (creator.subscribePrice == null || creator.subscribePrice === 0) return 'Free';
  return `$${creator.subscribePrice.toFixed(2)}`;
}

export default async function CreatorPage({ params }: Props) {
  const { username } = await params;
  if (!isPublishedCreator(username)) notFound();
  const creator = await fetchCreatorProfile(decodeURIComponent(username));
  if (!creator) notFound();

  const snapshots = await fetchCreatorSnapshots(creator.id);

  // "Similar creators" — prefer same location (search_text is indexed), fall back
  // to globally popular when the location is missing or too long to query safely.
  const loc = creator.location?.trim();
  const similarTerms = loc && loc.split(/\s+/).length <= 3 ? [loc] : undefined;
  const similar = await fetchCreators({
    categoryTerms: similarTerms,
    skipLocationFilter: true,
    sort: 'popular',
    pageSize: 13, // fetch one extra so we still show 12 after dropping self
    excludeUsernames: [creator.username],
    revalidate: 300,
  });
  const similarCreators = similar.creators.slice(0, 12);

  const display = creator.name ?? creator.username;
  const avatarUrl = creator.avatar ?? creator.avatarC144;
  const ofUrl = `https://onlyfans.com/${creator.username}`;
  const override = getSponsorOverride(creator.username);
  const ctaUrl = override?.linkOverride ?? ofUrl;
  const ctaRel = `noopener noreferrer nofollow${override ? ' sponsored' : ''}`;
  const price = priceLabel(creator);
  const about = creator.about ? plainText(creator.about) : '';
  // Best (largest) bundle discount, used for the bundle CTA button.
  const bestBundle =
    creator.bundles.length > 0
      ? creator.bundles.reduce((a, b) => (b.discount > a.discount ? b : a))
      : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: display,
      alternateName: `@${creator.username}`,
      url: ofUrl,
      image: avatarUrl ? proxyImg(avatarUrl, 480) : undefined,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>{display}</span>
      </nav>

      <div className="cp-wrap">
        <div className="cp-top">
          {/* Left column — avatar + CTAs */}
          <aside className="cp-aside">
            <div className="cp-avatar">
              {avatarUrl ? (
                <Image
                  src={proxyImg(avatarUrl, 480)}
                  alt={display}
                  fill
                  sizes="(max-width: 768px) 100vw, 280px"
                  style={{ objectFit: 'cover' }}
                  priority
                  unoptimized
                />
              ) : (
                <div className="cp-avatar-fallback">{display.charAt(0).toUpperCase()}</div>
              )}
            </div>

            <div className="cp-name-block">
              <h2 className="cp-name">
                {display}
                {creator.isVerified && (
                  <span className="cp-verified" title="Verified &amp; Active" aria-label="Verified">✓</span>
                )}
              </h2>
              <p className="cp-username">@{creator.username}</p>
            </div>

            <div className="cp-cta">
              <Link
                href={ctaUrl}
                target="_blank"
                rel={ctaRel}
                className="cp-btn cp-btn-primary"
              >
                Get OnlyFans ({price})
              </Link>
              {bestBundle && (
                <Link
                  href={ctaUrl}
                  target="_blank"
                  rel={ctaRel}
                  className="cp-btn cp-btn-bundle"
                >
                  💎 Bundle Deals — save up to {bestBundle.discount}%
                </Link>
              )}
            </div>
          </aside>

          {/* Right column — title + stats */}
          <div className="cp-main">
            <h1 className="cp-title">
              {display} (@{creator.username}) OnlyFans Profile
            </h1>

            {about && <CreatorBio text={about} />}

            <h2 className="cp-stats-heading">{display} OnlyFans Statistics</h2>

            <div className="cp-stats-card">
              <div className="cp-stats-grid">
                <StatRow label="Joined" value={fmtDate(creator.joinDate)} />
                <StatRow label="Last updated" value={fmtDate(creator.lastSeen)} />
                <StatRow label="Location" value={creator.location || '—'} />
                <StatRow label="Subscription" value={price} />
                <StatRow label="Photos" value={fmtNum(creator.photosCount)} />
                <StatRow label="Videos" value={fmtNum(creator.videosCount)} />
                <StatRow label="Posts" value={fmtNum(creator.postsCount)} />
                <StatRow label="Likes" value={fmtNum(creator.favoritedCount)} />
                <StatRow label="Media" value={fmtNum(creator.mediasCount)} />
                <StatRow label="Audios" value={fmtNum(creator.audiosCount)} />
                <StatRow label="Archived posts" value={fmtNum(creator.archivedPostsCount)} />
                <StatRow label="Finished streams" value={fmtNum(creator.finishedStreamsCount)} />
                <StatRow
                  label="Status"
                  value={creator.isVerified ? 'Verified & Active' : 'Active'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Growth charts from snapshots */}
        <CreatorCharts snapshots={snapshots} />

        {/* Similar creators */}
        {similarCreators.length > 0 && (
          <section className="cp-similar">
            <h2 className="cp-similar-heading">More OnlyFans Creators Like {display}</h2>
            <SimilarCreators
              initialCreators={similarCreators}
              initialHasMore={similar.hasMore}
              categoryTerms={similarTerms}
              excludeUsername={creator.username}
            />
          </section>
        )}
      </div>
    </>
  );
}
