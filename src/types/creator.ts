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
