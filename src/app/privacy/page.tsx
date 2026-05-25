import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | FansPedia',
  description: 'FansPedia privacy policy — how we collect, use, and protect your information.',
  alternates: { canonical: 'https://fanspedia.net/privacy/' },
};

export default function PrivacyPage() {
  return (
    <div className="prose-page">
      <h1>Privacy Policy</h1>
      <p>Last updated: May 2026</p>

      <h2>Information We Collect</h2>
      <p>
        FansPedia does not require registration. We collect anonymous analytics data (page views, search terms)
        via Google Analytics 4 to improve the site. No personally identifiable information is collected unless
        you contact us directly.
      </p>

      <h2>Cookies</h2>
      <p>
        We use cookies for age verification (stored in localStorage) and Google Analytics. You can clear
        these at any time through your browser settings.
      </p>

      <h2>Third-Party Services</h2>
      <ul>
        <li><strong>Google Analytics 4</strong> — anonymized traffic analytics</li>
        <li><strong>Supabase</strong> — database hosting (no user data stored)</li>
        <li><strong>Vercel</strong> — hosting and CDN</li>
        <li><strong>images.weserv.nl</strong> — image optimization proxy</li>
      </ul>

      <h2>Data Retention</h2>
      <p>
        We do not store personal data. Analytics data is retained by Google Analytics per their standard policies.
      </p>

      <h2>Contact</h2>
      <p>
        For privacy questions, contact us at <a href="mailto:contact@fanspedia.net">contact@fanspedia.net</a>.
      </p>
    </div>
  );
}
