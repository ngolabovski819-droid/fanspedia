import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact FansPedia',
  description: 'Get in touch with FansPedia for questions, removal requests, or business inquiries.',
  alternates: { canonical: 'https://fanspedia.net/contact/' },
};

export default function ContactPage() {
  return (
    <div className="prose-page">
      <h1>Contact Us</h1>
      <p>
        For questions, feedback, or removal requests, please reach out to us. We aim to respond within 48 hours.
      </p>
      <h2>Removal Requests</h2>
      <p>
        If you are a creator and would like your profile removed from our index, please use our{' '}
        <a href="/dmca/">DMCA / removal request page</a> with your profile URL and verification information.
      </p>
      <h2>Business Inquiries</h2>
      <p>
        For advertising, partnerships, or other business matters, please include &quot;Business&quot; in your subject line.
      </p>
      <h2>Email</h2>
      <p>
        <a href="mailto:contact@fanspedia.net">contact@fanspedia.net</a>
      </p>
    </div>
  );
}
