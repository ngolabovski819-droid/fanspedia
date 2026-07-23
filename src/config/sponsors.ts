/**
 * Per-creator overrides for paid placements — a custom outbound link (tracking/
 * referral URL) and/or a custom card image, instead of the defaults derived from
 * the scraped OnlyFans profile (`https://onlyfans.com/{username}` and the scraped
 * avatar).
 *
 * This sits on top of `src/config/featured.ts` (which controls WHERE a creator is
 * pinned) — this file controls what the card LINKS TO and SHOWS once it's placed.
 * Overrides live here (not in the `onlyfans_profiles` table) so they survive
 * scraper refreshes and are easy to remove when a campaign ends.
 *
 * Username matching is case-insensitive.
 *
 * Example:
 *   emilylopz: {
 *     linkOverride: 'https://onlyfans.com/emilylopz/c545',
 *     imageOverride: '/uploads/sponsors/emilylopz.jpg', // optional — see below
 *   },
 */
export interface SponsorOverride {
  /** Custom outbound URL for the card's "View Profile" button (tracking/referral link). */
  linkOverride?: string;
  /**
   * Custom card image instead of the scraped avatar. Either a local path under
   * `public/` (e.g. `/uploads/sponsors/emilylopz.jpg`) or an absolute URL.
   * When set, the image is rendered as-is (no responsive srcset/proxy resizing) —
   * fine for a single sponsored asset.
   */
  imageOverride?: string;
}

const SPONSOR_OVERRIDES: Record<string, SponsorOverride> = {
  emilylopz: {
    linkOverride: 'https://onlyfans.com/emilylopz/c545',
    // imageOverride not set — current scraped OF avatar is being used as-is.
    // To swap in a custom creative later, drop the file in public/uploads/sponsors/
    // and set: imageOverride: '/uploads/sponsors/emilylopz.jpg',
  },
};

const NORMALIZED: Record<string, SponsorOverride> = Object.fromEntries(
  Object.entries(SPONSOR_OVERRIDES).map(([username, o]) => [username.toLowerCase(), o]),
);

/** Case-insensitive lookup of a creator's sponsor override, if any. */
export function getSponsorOverride(username: string): SponsorOverride | undefined {
  return NORMALIZED[username.trim().toLowerCase()];
}
