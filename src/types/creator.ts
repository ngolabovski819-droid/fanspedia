export interface Creator {
  id: number;
  username: string;
  name: string | null;
  avatar: string | null;
  avatarC144: string | null;
  isVerified: boolean;
  subscribePrice: number | null;
  /** True when this creator is a paid/pinned placement (shown as "Sponsored"). */
  sponsored?: boolean;
}

/** A subscription bundle offer (multi-month discount) from the profile. */
export interface BundleOffer {
  /** Bundle length in months. */
  duration: number;
  /** Total bundle price. */
  price: number;
  /** Discount percentage off the regular monthly price. */
  discount: number;
}

/** Full creator profile used by the standalone creator page template. */
export interface CreatorProfile extends Creator {
  about: string | null;
  location: string | null;
  header: string | null;
  favoritedCount: number | null;
  photosCount: number | null;
  videosCount: number | null;
  postsCount: number | null;
  audiosCount: number | null;
  mediasCount: number | null;
  archivedPostsCount: number | null;
  finishedStreamsCount: number | null;
  subscribersCount: number | null;
  joinDate: string | null;
  lastSeen: string | null;
  /** Active multi-month bundle offers, sorted by duration. Empty when none. */
  bundles: BundleOffer[];
}

/**
 * A single historical metrics capture from `onlyfans_profile_snapshots`.
 * Each row is one scrape of the creator (1st time, 2nd time, ...), used to
 * draw the growth charts on the creator page.
 */
export interface Snapshot {
  capturedAt: string;
  favoritedCount: number | null;
  finishedStreamsCount: number | null;
  postsCount: number | null;
  videosCount: number | null;
  audiosCount: number | null;
  mediasCount: number | null;
  archivedPostsCount: number | null;
}
