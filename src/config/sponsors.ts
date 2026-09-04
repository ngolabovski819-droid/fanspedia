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
 * Every card/CTA for a creator with a `linkOverride` routes through
 * `/go/{username}` (src/app/go/[username]/route.ts) instead of linking straight
 * out — that route logs a click to `clickTable` (if set), then redirects to
 * `linkOverride`. One click-log table per client (see `clickTable`) so each
 * campaign's delivered-click count is trivially isolated.
 *
 * Example:
 *   emilylopz: {
 *     linkOverride: 'https://onlyfans.com/emilylopz/c545',
 *     clickTable: 'sponsor_clicks_emilylopz', // see scripts/migrations/002_*.sql
 *     imageOverride: '/uploads/sponsors/emilylopz.jpg', // optional — see below
 *   },
 */
export interface SponsorOverride {
  /** Custom outbound URL for the card's "View Profile" button (tracking/referral link). */
  linkOverride?: string;
  /**
   * Supabase table that logs clicks on `linkOverride` (via /go/{username}).
   * One table per client, named `sponsor_clicks_<username>` by convention —
   * create it with a migration under scripts/migrations/ before clicks start
   * logging (redirect still works without it; clicks are just silently skipped).
   */
  clickTable?: string;
  /**
   * Custom card image instead of the scraped avatar. Either a local path under
   * `public/` (e.g. `/uploads/sponsors/emilylopz.jpg`) or an absolute URL.
   * When set, the image is rendered as-is (no responsive srcset/proxy resizing) —
   * fine for a single sponsored asset.
   */
  imageOverride?: string;
  /** Short content labels displayed over the sponsored card image. */
  tags?: string[];
  /** Number displayed after the visible labels (for example, "+9"). */
  additionalTagCount?: number;
  /** Additional card-carousel images, served from public/ or an absolute URL. */
  galleryImages?: string[];
}

const SPONSOR_OVERRIDES: Record<string, SponsorOverride> = {
  emilylopz: {
    linkOverride: 'https://onlyfans.com/emilylopz/c545',
    clickTable: 'sponsor_clicks_emilylopz',
    tags: ['GFE', 'Feet fetish', 'Squirting'],
    additionalTagCount: 9,
    galleryImages: [
      '/uploads/sponsors/emilylopz/emily-01.jpg',
      '/uploads/sponsors/emilylopz/emily-02.jpg',
      '/uploads/sponsors/emilylopz/emily-03.jpg',
      '/uploads/sponsors/emilylopz/emily-04.jpg',
      '/uploads/sponsors/emilylopz/emily-05.jpg',
      '/uploads/sponsors/emilylopz/emily-06.jpg',
      '/uploads/sponsors/emilylopz/emily-07.jpg',
      '/uploads/sponsors/emilylopz/emily-08.jpg',
      '/uploads/sponsors/emilylopz/emily-09.jpg',
      '/uploads/sponsors/emilylopz/emily-10.jpg',
      '/uploads/sponsors/emilylopz/emily-11.jpg',
      '/uploads/sponsors/emilylopz/emily-12.jpg',
      '/uploads/sponsors/emilylopz/emily-13.jpg',
      '/uploads/sponsors/emilylopz/emily-14.jpg',
      '/uploads/sponsors/emilylopz/emily-15.jpg',
      '/uploads/sponsors/emilylopz/emily-16.jpg',
      '/uploads/sponsors/emilylopz/emily-17.jpg',
      '/uploads/sponsors/emilylopz/emily-18.jpg',
      '/uploads/sponsors/emilylopz/emily-19.jpg',
      '/uploads/sponsors/emilylopz/emily-20.jpg',
      '/uploads/sponsors/emilylopz/emily-21.jpg',
      '/uploads/sponsors/emilylopz/emily-22.jpg',
      '/uploads/sponsors/emilylopz/emily-23.jpg',
      '/uploads/sponsors/emilylopz/emily-24.jpg',
    ],
    // imageOverride not set — current scraped OF avatar is being used as-is.
    // To swap in a custom creative later, drop the file in public/uploads/sponsors/
    // and set: imageOverride: '/uploads/sponsors/emilylopz.jpg',
  },
  rocketreynaxo: {
    linkOverride: 'https://onlyfans.com/rocketreynaxo/trial/12v36e0ushqqqe1bdaqa4gramuus1m2d',
    clickTable: 'sponsor_clicks_rocketreynaxo',
    imageOverride: '/uploads/sponsors/rocketreynaxo/rocket-01.jpg',
    tags: ['Asian MILF', 'Busty', 'Curvy'],
    galleryImages: [
      '/uploads/sponsors/rocketreynaxo/rocket-02.jpg',
      '/uploads/sponsors/rocketreynaxo/rocket-03.jpg',
      '/uploads/sponsors/rocketreynaxo/rocket-04.jpg',
      '/uploads/sponsors/rocketreynaxo/rocket-05.jpg',
      '/uploads/sponsors/rocketreynaxo/rocket-06.jpg',
      '/uploads/sponsors/rocketreynaxo/rocket-07.jpg',
      '/uploads/sponsors/rocketreynaxo/rocket-08.jpg',
      '/uploads/sponsors/rocketreynaxo/rocket-09.jpg',
      '/uploads/sponsors/rocketreynaxo/rocket-10.jpg',
    ],
  },
  cosplaytsumiko: {
    linkOverride: 'https://onlyfans.com/cosplaytsumiko/c58',
    clickTable: 'sponsor_clicks_cosplaytsumiko',
    imageOverride: '/uploads/sponsors/cosplaytsumiko/tsumiko-01.jpg',
    tags: ['Cosplay', 'Big tits', 'Blonde'],
    additionalTagCount: 8,
    galleryImages: [
      '/uploads/sponsors/cosplaytsumiko/tsumiko-02.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-03.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-04.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-05.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-06.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-07.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-08.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-09.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-10.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-11.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-12.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-13.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-14.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-15.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-16.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-17.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-18.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-19.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-20.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-21.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-22.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-23.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-24.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-25.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-26.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-27.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-28.jpg',
      '/uploads/sponsors/cosplaytsumiko/tsumiko-29.jpg',
    ],
  },
  rinayanami: {
    linkOverride: 'https://onlyfans.com/rinayanami/c31',
    clickTable: 'sponsor_clicks_rinayanami', // see scripts/migrations/010_*.sql
    imageOverride: '/uploads/sponsors/rinayanami/rina-01.jpg',
    tags: ['Petite', 'Asian', 'Nerdy', 'GFE'],
    additionalTagCount: 5,
    galleryImages: [
      '/uploads/sponsors/rinayanami/rina-02.jpg',
      '/uploads/sponsors/rinayanami/rina-03.jpg',
      '/uploads/sponsors/rinayanami/rina-04.jpg',
      '/uploads/sponsors/rinayanami/rina-05.jpg',
      '/uploads/sponsors/rinayanami/rina-06.jpg',
      '/uploads/sponsors/rinayanami/rina-07.jpg',
      '/uploads/sponsors/rinayanami/rina-08.jpg',
      '/uploads/sponsors/rinayanami/rina-09.jpg',
      '/uploads/sponsors/rinayanami/rina-10.jpg',
      '/uploads/sponsors/rinayanami/rina-11.jpg',
    ],
  },
  hannazuki: {
    linkOverride: 'https://onlyfans.com/hannazuki/trial/kqv4mhnqp9ifhpwin0vtfxnsscmlv9jy',
    clickTable: 'sponsor_clicks_hannazuki',
    imageOverride: '/uploads/sponsors/hannazuki/hanna-01.jpg',
    tags: ['asian', 'cosplay', 'egirl', 'GFE'],
    galleryImages: [
      '/uploads/sponsors/hannazuki/hanna-02.jpg',
      '/uploads/sponsors/hannazuki/hanna-03.jpg',
      '/uploads/sponsors/hannazuki/hanna-04.jpg',
      '/uploads/sponsors/hannazuki/hanna-05.jpg',
      '/uploads/sponsors/hannazuki/hanna-06.jpg',
      '/uploads/sponsors/hannazuki/hanna-07.jpg',
    ],
  },
};

const NORMALIZED: Record<string, SponsorOverride> = Object.fromEntries(
  Object.entries(SPONSOR_OVERRIDES).map(([username, o]) => [username.toLowerCase(), o]),
);

/**
 * Vanity slugs for the `/go/<slug>` redirect ONLY. Lets a sponsor share
 * `fanspedia.net/go/<anything>` — their IG/TikTok persona name, a typo variant, a
 * per-campaign name — instead of `/go/<of-username>`. The route resolves the alias to
 * the target's `linkOverride` + `clickTable` and logs the click with
 * `placement: 'vanity:<alias>'`, so each shared link reports separately in the panel.
 *
 * Alias → real OF username, both matched case-insensitively. Adding one is a single
 * line + deploy: no DNS, no Vercel config, no migration (it reuses the target's table).
 * Cards, profile pages and click-token minting never see aliases — they key on the
 * real username via getSponsorOverride().
 */
// 2026-08-28 batch: slugs below are the OF usernames of profiles listed in the owner's promo
// sheet — each one's /go/ link routes to the sponsor that row promotes. Keep in sync with the
// sheet when rows are added/retired.
export const GO_ALIASES: Record<string, string> = {
  // rinayanami (persona names + promo-sheet rows)
  sierraskyprivate: 'rinayanami',
  sierraskyeprivate: 'rinayanami',
  hannahgoldy: 'rinayanami',
  sierraskye: 'rinayanami',
  hoguesdirtylaundry: 'rinayanami',
  mikaslowana: 'rinayanami',
  // emilylopz
  pauladeanda: 'emilylopz',
  candicealice: 'emilylopz',
  valkyrieuntamed: 'emilylopz',
  anastasiaplays: 'emilylopz',
  littlelanacat: 'emilylopz',
  nudistza: 'emilylopz',
  officialmiax: 'emilylopz',
  juliatica: 'emilylopz',
  polishloca: 'emilylopz',
  mommysfuntime: 'emilylopz',
  'cecilia.suarez': 'emilylopz',
  priceless_love: 'emilylopz',
  miikkita: 'emilylopz',
  // cosplaytsumiko
  reallilyhallxx: 'cosplaytsumiko',
  babygirl213: 'cosplaytsumiko',
  amberdeluca: 'cosplaytsumiko',
  langiie: 'cosplaytsumiko',
  yummykimmy: 'cosplaytsumiko',
  ness27: 'cosplaytsumiko',
  // rocketreynaxo
  alexapilling: 'rocketreynaxo',
  curvy4urpleasure: 'rocketreynaxo',
  sweetlexi86: 'rocketreynaxo',
  daysiidukes: 'rocketreynaxo',
  'bunny.zudeah': 'rocketreynaxo',
  ashlikesramen: 'rocketreynaxo',
  shelboooo: 'rocketreynaxo',
  fansofmandimay: 'rocketreynaxo',
  jennafoxxbbw: 'rocketreynaxo',
  megandeluca: 'rocketreynaxo',
  little_rr: 'rocketreynaxo',
  // hannazuki
  lyssy3333: 'hannazuki',
  xo_alvssa: 'hannazuki',
  hallieheart: 'hannazuki',
};

const NORMALIZED_ALIASES: Record<string, string> = Object.fromEntries(
  Object.entries(GO_ALIASES).map(([alias, username]) => [alias.trim().toLowerCase(), username.trim().toLowerCase()]),
);

// Build-time guard (runs on module load, so `next build` fails loudly on a bad config):
// an alias that shadows a real sponsor username would silently hijack that sponsor's
// /go/ link, and an alias pointing at a non-sponsor would redirect but never log.
for (const [alias, username] of Object.entries(NORMALIZED_ALIASES)) {
  if (alias in NORMALIZED) {
    throw new Error(`GO_ALIASES: "${alias}" collides with a SPONSOR_OVERRIDES username`);
  }
  if (!(username in NORMALIZED)) {
    throw new Error(`GO_ALIASES: "${alias}" points at "${username}", which has no SPONSOR_OVERRIDES entry`);
  }
}

/**
 * Resolve a `/go/<slug>` path segment to the real sponsor username. Non-aliases resolve
 * to themselves unchanged, so existing `/go/<username>` links behave exactly as before.
 */
export function resolveGoAlias(slug: string): { username: string; isAlias: boolean } {
  const target = NORMALIZED_ALIASES[slug.trim().toLowerCase()];
  return target ? { username: target, isAlias: true } : { username: slug, isAlias: false };
}

/** Case-insensitive lookup of a creator's sponsor override, if any. */
export function getSponsorOverride(username: string): SponsorOverride | undefined {
  return NORMALIZED[username.trim().toLowerCase()];
}
