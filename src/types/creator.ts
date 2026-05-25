export interface Creator {
  id: number;
  username: string;
  name: string | null;
  about: string | null;
  location: string | null;
  avatar: string | null;
  avatarC144: string | null;
  isVerified: boolean;
  subscribePrice: number | null;
  favoritedCount: number;
  subscribersCount: number | null;
  postsCount: number | null;
  photosCount: number | null;
  videosCount: number | null;
  bundle1Price: number | null;
  bundle1Duration: number | null;
  bundle1Discount: number | null;
  bundle2Price: number | null;
  bundle2Duration: number | null;
  bundle2Discount: number | null;
  bundle3Price: number | null;
  bundle3Duration: number | null;
  bundle3Discount: number | null;
  promotion1Price: number | null;
  promotion1Discount: number | null;
}
