import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About FansPedia | OnlyFans Creator Directory',
  description: 'FansPedia is an independent OnlyFans creator directory. Learn about our mission and how we help fans discover creators.',
  alternates: { canonical: 'https://fanspedia.net/about/' },
};

export default function AboutPage() {
  return (
    <div className="prose-page">
      <h1>About FansPedia</h1>
      <p>
        FansPedia is an independent directory that helps fans discover OnlyFans creators from around the world.
        We index publicly available creator profiles so you can search by category, location, price, and more.
      </p>
      <h2>Our Mission</h2>
      <p>
        We believe fans should be able to find the creators they&apos;re looking for easily. FansPedia provides
        a searchable, filterable index of OnlyFans profiles — all information displayed is publicly available.
      </p>
      <h2>Independence</h2>
      <p>
        FansPedia is not affiliated with, endorsed by, or connected to OnlyFans or Fenix International Limited.
        We are an independent website.
      </p>
      <h2>Content Policy</h2>
      <p>
        FansPedia indexes publicly available profile information only. We do not host, store, or distribute
        any content created by OnlyFans creators. All content remains on the OnlyFans platform.
      </p>
      <p>
        If you are a creator and would like your profile removed from our index, please contact us via
        our <a href="/dmca/">DMCA / removal request page</a>.
      </p>
    </div>
  );
}
