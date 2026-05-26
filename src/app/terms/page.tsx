import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | FansPedia',
  description: 'Read FansPedia\'s terms of service. By using our website you agree to these terms and conditions.',
  alternates: { canonical: 'https://fanspedia.net/terms/' },
};

export default function TermsPage() {
  return (
    <div className="prose-page">
      <h1>Terms of Service</h1>
      <p>Welcome to FansPedia. By accessing or using our website, you agree to comply with and be bound by the following terms and conditions.</p>
      <p>Please review these terms carefully. If you do not agree with any part of these terms, you should not use FansPedia.</p>
      <p><strong>Age Requirement:</strong> You must be at least <strong>18 years of age</strong> to access or use FansPedia. By using this website, you represent and warrant that you are at least 18 years old. If you are under 18, you are strictly prohibited from using this website.</p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Last updated: March 3, 2026</p>

      <h2>1. Acknowledgement and Acceptance of Terms</h2>
      <p>These terms and conditions outline the rules and regulations for the use of FansPedia. By accessing our website at <strong>fanspedia.net</strong>, you agree to accept all terms and conditions stated here. If you do not agree to any part of these terms, you should discontinue your use of the website immediately.</p>

      <h2>2. About FansPedia</h2>
      <p>FansPedia is a search engine and directory platform that helps users discover OnlyFans creators by linking to publicly available images and text from OnlyFans profiles.</p>
      <ul>
        <li>We do <strong>NOT</strong> host or distribute any media (photos, videos, etc.) from OnlyFans creators on our servers.</li>
        <li>We are not affiliated with or endorsed by OnlyFans.com or Fenix International Limited.</li>
        <li>The use of &quot;OnlyFans&quot; on this site is for identification purposes only and does not imply any endorsement or partnership.</li>
        <li>We do not provide dating, matchmaking, companionship, or escort services of any kind.</li>
        <li>We do not facilitate payments between users and creators. All transactions occur directly on the respective third-party platforms.</li>
      </ul>

      <h2>3. Age Verification and Restrictions</h2>
      <p>FansPedia contains links to content that is intended for adults only. By using this website:</p>
      <ul>
        <li>You confirm that you are at least 18 years of age.</li>
        <li>You confirm that accessing adult-oriented content is legal in your jurisdiction.</li>
        <li>You understand that FansPedia indexes and links to profiles on third-party platforms that may contain adult content.</li>
        <li>You accept full responsibility for ensuring compliance with your local laws regarding access to such content.</li>
      </ul>
      <p><strong>Attempting to bypass any age verification or access restriction</strong> on this website is a violation of these Terms and may result in immediate termination of access.</p>

      <h2>4. Community Guidelines</h2>
      <p>By using FansPedia, you agree to the following community guidelines:</p>
      <ul>
        <li>You will not use the platform for any unlawful, harassing, abusive, or fraudulent purpose.</li>
        <li>You will not attempt to impersonate another person or misrepresent your identity or age.</li>
        <li>You will not use the platform to stalk, harass, bully, or intimidate any individual.</li>
        <li>You will not post, share, or distribute any content that promotes violence, hatred, discrimination, or exploitation.</li>
        <li>You will not use automated tools, bots, or scrapers to access or extract data from FansPedia without prior written consent.</li>
        <li>You will not attempt to circumvent any security features, age verification measures, or access restrictions on the platform.</li>
      </ul>

      <h2>5. Intellectual Property Rights</h2>
      <p>All media materials displayed on FansPedia belong to their respective owners — primarily the content creators themselves.</p>
      <ul>
        <li>We do not claim any copyright or ownership over third-party content.</li>
        <li>We only link to publicly available profiles on OnlyFans.com.</li>
        <li>You may not copy, reproduce, sell, license, or otherwise exploit any content from FansPedia without the prior written consent of the respective copyright owners.</li>
        <li>The FansPedia name, logo, and website design are our intellectual property and may not be used without written permission.</li>
      </ul>

      <h2>6. Opting Out (For Creators)</h2>
      <p>Creators who do not wish to be listed on FansPedia can opt out at any time by contacting us at <a href="mailto:fanspediaofficial@gmail.com?subject=Opt-Out%20Request">fanspediaofficial@gmail.com</a>.</p>
      <ul>
        <li>Please provide proof of ownership of the OnlyFans account when submitting a removal request.</li>
        <li>We will process removal requests within a reasonable timeframe, typically within <strong>5 business days</strong>.</li>
      </ul>

      <h2>7. Prohibited Actions</h2>
      <p>You are strictly prohibited from:</p>
      <ul>
        <li>Republishing material from FansPedia without explicit written permission.</li>
        <li>Selling, renting, or sub-licensing any material from FansPedia.</li>
        <li>Reproducing, duplicating, or copying material from FansPedia for commercial purposes.</li>
        <li>Redistributing content obtained from FansPedia on any other platform or service.</li>
        <li>Using FansPedia for any purpose that is illegal or prohibited by these Terms.</li>
        <li>Attempting to gain unauthorized access to our systems, servers, or networks.</li>
      </ul>

      <h2>8. Cookies</h2>
      <p>FansPedia uses cookies and local storage to enhance your browsing experience, including saving your age verification, safe search preference, and wishlist. By using our website you consent to our use of these technologies.</p>

      <h2>9. Privacy</h2>
      <p>Your use of FansPedia is also governed by our <a href="/privacy/">Privacy Policy</a>, which is incorporated into these Terms by reference.</p>

      <h2>10. Disclaimer of Warranties</h2>
      <p>FansPedia is provided &quot;as is&quot; without any warranties of any kind, express or implied. We do not warrant that the website will be uninterrupted, error-free, or free of viruses or other harmful components.</p>

      <h2>11. Limitation of Liability</h2>
      <p>To the fullest extent permitted by law, FansPedia shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of this website.</p>

      <h2>12. Changes to These Terms</h2>
      <p>We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated date. Continued use of the website after any changes constitutes your acceptance of the new terms.</p>

      <h2>13. Contact</h2>
      <p>If you have any questions about these Terms, please contact us at <a href="mailto:fanspediaofficial@gmail.com">fanspediaofficial@gmail.com</a> or visit our <a href="/contact/">Contact page</a>.</p>
    </div>
  );
}
