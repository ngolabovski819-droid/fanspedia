import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DMCA & Content Removal | FansPedia',
  description: 'Submit a DMCA takedown or profile removal request to FansPedia.',
  alternates: { canonical: 'https://fanspedia.net/dmca/' },
};

export default function DmcaPage() {
  return (
    <div className="prose-page">
      <h1>DMCA & Content Removal</h1>

      <h2>Creator Profile Removal</h2>
      <p>
        If you are an OnlyFans creator and wish to have your profile removed from FansPedia&apos;s index,
        please send an email to <a href="mailto:contact@fanspedia.net">contact@fanspedia.net</a> with:
      </p>
      <ul>
        <li>Your OnlyFans profile URL</li>
        <li>Your name or display name</li>
        <li>A brief statement confirming you are the account owner</li>
      </ul>
      <p>We will process removal requests within 5 business days.</p>

      <h2>DMCA Takedown</h2>
      <p>
        FansPedia only indexes publicly available profile information and does not host any content.
        If you believe your copyrighted content has been used improperly, please contact us at{' '}
        <a href="mailto:contact@fanspedia.net">contact@fanspedia.net</a> with a detailed description
        and we will respond promptly.
      </p>

      <h2>Disclaimer</h2>
      <p>
        FansPedia is not affiliated with OnlyFans or Fenix International Limited. We are an independent
        directory that displays publicly available profile information only.
      </p>
    </div>
  );
}
