import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | FansPedia',
  description: 'FansPedia Privacy Policy. Learn how we collect, use, and protect your personal information when you use our OnlyFans creator search platform.',
  alternates: { canonical: 'https://fanspedia.net/privacy/' },
};

export default function PrivacyPage() {
  return (
    <>
      {/* Breadcrumb */}
      <nav className="priv-breadcrumb" aria-label="Breadcrumb">
        <a href="/">🏠 Home</a>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Privacy Policy</span>
      </nav>

      {/* Hero */}
      <section className="priv-hero">
        <div className="priv-hero-inner">
          <div className="priv-hero-badge">🔒 Privacy &amp; Data</div>
          <h1>Privacy Policy</h1>
          <p>At FansPedia, we value your privacy and are committed to protecting your personal information.</p>
          <p className="last-updated">Last updated: March 3, 2026</p>
          <a href="mailto:fanspediaofficial@gmail.com?subject=Privacy%20Inquiry" className="priv-hero-cta">
            ✉️ Contact Us
          </a>
        </div>
      </section>

      <div className="priv-content">

        {/* Age box */}
        <div className="priv-age-box">
          <div className="priv-age-icon">⚠️</div>
          <p><strong>Age Restriction:</strong> FansPedia is intended exclusively for users who are at least <strong>18 years of age</strong>. By accessing or using our website, you confirm that you are at least 18 years old. We do not knowingly collect or process personal information from individuals under the age of 18.</p>
        </div>

        {/* 1. Information We Collect */}
        <div className="priv-section">
          <div className="priv-section-header">
            <div className="priv-section-icon">🗄️</div>
            <h2>1. Information We Collect</h2>
          </div>
          <p>We collect two types of information from you:</p>
          <div className="priv-sub">
            <h3>a. Information You Provide</h3>
            <p>We collect personal information that you provide directly to us when you:</p>
            <ul>
              <li>Subscribe to our newsletter</li>
              <li>Contact us via email or social media</li>
              <li>Participate in contests, surveys, or promotions</li>
              <li>Use certain features of our website, such as the Wishlist</li>
            </ul>
            <p>This may include your name, email address, and social media profiles.</p>
          </div>
          <div className="priv-sub">
            <h3>b. Automatically Collected Information</h3>
            <p>When you visit FansPedia, we may automatically collect certain information through cookies or similar tracking technologies, including:</p>
            <ul>
              <li>Your IP address</li>
              <li>Browser type and version</li>
              <li>Device type (desktop, mobile, tablet)</li>
              <li>Pages viewed and time spent on our site</li>
              <li>Search queries entered on FansPedia</li>
              <li>Referring URL (the website you came from)</li>
            </ul>
            <p>This information helps us improve your experience and better understand how our services are used.</p>
          </div>
        </div>

        {/* 2. Cookies */}
        <div className="priv-section">
          <div className="priv-section-header">
            <div className="priv-section-icon">🍪</div>
            <h2>2. Use of Cookies</h2>
          </div>
          <p>We use cookies and similar tracking technologies to enhance your browsing experience. Specifically, cookies help us to:</p>
          <div className="priv-sub">
            <ul>
              <li>Remember your preferences (e.g., dark/light mode, Safe Search setting, Wishlist)</li>
              <li>Personalize content and search results</li>
              <li>Improve website functionality and performance</li>
              <li>Analyze usage patterns through Google Analytics</li>
              <li>Serve relevant advertisements</li>
            </ul>
            <p>You can control the use of cookies through your browser settings. However, disabling cookies may affect your ability to use some features of our site, including the Wishlist and preference settings.</p>
          </div>
        </div>

        {/* 3. How We Use */}
        <div className="priv-section">
          <div className="priv-section-header">
            <div className="priv-section-icon">⚙️</div>
            <h2>3. How We Use Your Information</h2>
          </div>
          <p>We use the information we collect for the following purposes:</p>
          <div className="priv-cards">
            <div className="priv-card">
              <div className="priv-card-icon">🔧</div>
              <h4>Provide &amp; Improve Services</h4>
              <p>Operate the platform, improve search accuracy, and add new features based on usage patterns.</p>
            </div>
            <div className="priv-card">
              <div className="priv-card-icon">👤</div>
              <h4>Personalize Experience</h4>
              <p>Remember your settings, preferences, and saved creators across sessions.</p>
            </div>
            <div className="priv-card">
              <div className="priv-card-icon">✉️</div>
              <h4>Communications</h4>
              <p>Send updates, newsletters, and promotional offers where you have opted in.</p>
            </div>
            <div className="priv-card">
              <div className="priv-card-icon">📊</div>
              <h4>Analytics</h4>
              <p>Analyze traffic patterns and improve site performance using aggregated, anonymized data.</p>
            </div>
            <div className="priv-card">
              <div className="priv-card-icon">⚖️</div>
              <h4>Legal Compliance</h4>
              <p>Comply with applicable laws, enforce our terms, and protect the rights of FansPedia and its users.</p>
            </div>
            <div className="priv-card">
              <div className="priv-card-icon">🛡️</div>
              <h4>Security &amp; Fraud Prevention</h4>
              <p>Detect and prevent abuse, fraud, and unauthorized access to our platform.</p>
            </div>
          </div>
        </div>

        {/* 4. Sharing */}
        <div className="priv-section">
          <div className="priv-section-header">
            <div className="priv-section-icon">🔀</div>
            <h2>4. Sharing Your Information</h2>
          </div>
          <p>We do <strong>not sell or rent</strong> your personal information to third parties. However, we may share your information with:</p>
          <div className="priv-sub">
            <h3>Service Providers</h3>
            <p>Trusted third-party companies that help us operate our website or provide services on our behalf, including hosting providers, analytics providers (e.g., Google Analytics), and email service providers. These providers are bound by confidentiality obligations and may only use your data to perform services on our behalf.</p>
          </div>
          <div className="priv-sub">
            <h3>Legal Authorities</h3>
            <p>If required by law, we may disclose your information to comply with legal obligations, enforce our terms of service, or protect the rights, property, or safety of FansPedia, our users, or the public.</p>
          </div>
        </div>

        {/* 5. Security */}
        <div className="priv-section">
          <div className="priv-section-header">
            <div className="priv-section-icon">🔐</div>
            <h2>5. Data Security</h2>
          </div>
          <p>We take the security of your personal information seriously and use commercially reasonable measures to protect it. Our infrastructure is hosted on secure, industry-standard cloud platforms (Supabase, Vercel) with encryption in transit (TLS/HTTPS) and at rest.</p>
          <p>However, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security, and you provide information at your own risk. If you believe your data has been compromised, please contact us immediately at <a href="mailto:fanspediaofficial@gmail.com">fanspediaofficial@gmail.com</a>.</p>
        </div>

        {/* 6. Retention */}
        <div className="priv-section">
          <div className="priv-section-header">
            <div className="priv-section-icon">🕐</div>
            <h2>6. Retention of Your Information</h2>
          </div>
          <p>We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Data stored in your browser (localStorage) — such as your Wishlist, theme preference, and Safe Search setting — is stored locally on your device and is under your control at all times.</p>
          <p>Once your information is no longer needed, we will delete it or anonymize it in a manner designed to prevent re-identification.</p>
        </div>

        {/* 7. Rights */}
        <div className="priv-section">
          <div className="priv-section-header">
            <div className="priv-section-icon">🧑‍⚖️</div>
            <h2>7. Your Rights</h2>
          </div>
          <p>You have the following rights regarding your personal information. To exercise any of these rights, contact us at <a href="mailto:fanspediaofficial@gmail.com?subject=Privacy%20Rights%20Request">fanspediaofficial@gmail.com</a>.</p>
          <div className="priv-rights">
            <div className="priv-right">
              <div className="priv-right-icon">👁️</div>
              <div>
                <h4>Access</h4>
                <p>You can request access to the personal data we hold about you.</p>
              </div>
            </div>
            <div className="priv-right">
              <div className="priv-right-icon">✏️</div>
              <div>
                <h4>Correction</h4>
                <p>You can request corrections if the data we hold about you is inaccurate or incomplete.</p>
              </div>
            </div>
            <div className="priv-right">
              <div className="priv-right-icon">🗑️</div>
              <div>
                <h4>Deletion</h4>
                <p>You can request that we delete your personal data when it is no longer needed or if you withdraw consent.</p>
              </div>
            </div>
            <div className="priv-right">
              <div className="priv-right-icon">🚫</div>
              <div>
                <h4>Opt-Out</h4>
                <p>You can opt out of receiving marketing communications at any time by following the unsubscribe instructions in our emails or contacting us directly.</p>
              </div>
            </div>
            <div className="priv-right">
              <div className="priv-right-icon">💾</div>
              <div>
                <h4>Data Portability</h4>
                <p>You can request a copy of your personal data in a commonly used, machine-readable format.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 8. Children */}
        <div className="priv-section">
          <div className="priv-section-header">
            <div className="priv-section-icon" style={{background:'linear-gradient(135deg,#ff3b30 0%,#cc2a22 100%)'}}>🔞</div>
            <h2>8. Age Restriction &amp; Children&apos;s Privacy</h2>
          </div>
          <p>FansPedia is strictly intended for adults aged <strong>18 and over</strong>. We do not knowingly collect, solicit, or process personal information from anyone under the age of 18.</p>
          <p>If we become aware that we have inadvertently collected personal information from an individual under 18, we will take immediate steps to delete that information from our systems. If you believe that a minor has provided us with personal information, please contact us immediately at <a href="mailto:fanspediaofficial@gmail.com?subject=Minor%20Privacy%20Concern">fanspediaofficial@gmail.com</a> and we will act promptly.</p>
        </div>

        {/* 9. Third-Party Links */}
        <div className="priv-section">
          <div className="priv-section-header">
            <div className="priv-section-icon">🔗</div>
            <h2>9. Third-Party Links</h2>
          </div>
          <p>Our website contains links to third-party websites and services that are not operated by us, including but not limited to <strong>OnlyFans.com</strong>. When you click on a creator card, you are taken directly to that creator&apos;s page on OnlyFans — a separate website governed by its own privacy policies and terms of service.</p>
          <p>We are not responsible for the privacy practices, content, or security of any external websites. We encourage you to review the privacy policies of any third-party websites you visit before providing personal information.</p>
        </div>

        {/* 10. Changes */}
        <div className="priv-section">
          <div className="priv-section-header">
            <div className="priv-section-icon">🔄</div>
            <h2>10. Changes to This Policy</h2>
          </div>
          <p>We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. If we make any material changes, we will notify you by updating the &quot;Last updated&quot; date at the top of this page.</p>
          <p>Your continued use of FansPedia after any changes to this Privacy Policy constitutes your acceptance of the updated terms. We encourage you to review this page periodically to stay informed.</p>
        </div>

        {/* 11. Contact */}
        <div className="priv-section">
          <div className="priv-section-header">
            <div className="priv-section-icon">✉️</div>
            <h2>11. Contact Us</h2>
          </div>
          <p>If you have any questions, concerns, or requests regarding your privacy or this Privacy Policy, please contact us at:</p>
          <div className="priv-info-box">
            <p><strong>FansPedia</strong><br />Operating as an independent OnlyFans creator directory<br />Email: <a href="mailto:fanspediaofficial@gmail.com?subject=Privacy%20Inquiry">fanspediaofficial@gmail.com</a></p>
            <p>We aim to respond to all privacy-related inquiries within <strong>5 business days</strong>.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="priv-contact-cta">
          <h2>Questions About Your Privacy?</h2>
          <p>We&apos;re committed to transparency about how we use your data. If anything in this policy is unclear, or you&apos;d like to exercise your privacy rights, get in touch.</p>
          <a href="mailto:fanspediaofficial@gmail.com?subject=Privacy%20Inquiry" className="priv-cta-btn">
            ✉️ fanspediaofficial@gmail.com
          </a>
        </div>

      </div>

      <style>{`
        .priv-breadcrumb {
          max-width: 900px; margin: 0 auto; padding: 14px 16px;
          font-size: 13px; color: var(--text-muted);
        }
        .priv-breadcrumb a { color: var(--text-muted); text-decoration: none; }
        .priv-breadcrumb a:hover { color: var(--accent); }

        .priv-hero {
          background: linear-gradient(135deg, #0d1018 0%, #131927 100%);
          color: #fff; padding: 72px 16px 80px; text-align: center;
          position: relative; overflow: hidden;
          border-bottom: 1px solid var(--border);
        }
        .priv-hero::before {
          content: ''; position: absolute; inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .priv-hero-inner { position: relative; max-width: 720px; margin: 0 auto; }
        .priv-hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(0,175,240,0.2); border: 1px solid rgba(0,175,240,0.4);
          border-radius: 50px; padding: 6px 16px; font-size: 13px; font-weight: 700;
          color: var(--accent); margin-bottom: 20px; letter-spacing: 0.5px;
        }
        .priv-hero h1 { font-size: clamp(2rem, 5vw, 3rem); font-weight: 900; margin: 0 0 16px; }
        .priv-hero p { font-size: clamp(1rem, 2.2vw, 1.2rem); opacity: 0.8; line-height: 1.7; max-width: 600px; margin: 0 auto 10px; }
        .priv-hero .last-updated { font-size: 13px; opacity: 0.55; display: block; margin-top: 4px; }
        .priv-hero-cta {
          display: inline-flex; align-items: center; gap: 10px; margin-top: 20px;
          background: linear-gradient(135deg, #00AFF0 0%, #0099D6 100%);
          color: #fff; padding: 14px 28px; border-radius: 50px; font-weight: 700; font-size: 15px;
          text-decoration: none; transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(0,175,240,0.4);
        }
        .priv-hero-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,175,240,0.5); color: #fff; }

        .priv-content { max-width: 900px; margin: 0 auto; padding: 60px 16px; }

        .priv-age-box {
          background: linear-gradient(135deg, rgba(255,159,10,0.08) 0%, rgba(255,159,10,0.04) 100%);
          border: 1px solid rgba(255,159,10,0.3); border-left: 4px solid #ff9f0a;
          border-radius: 0 12px 12px 0; padding: 20px 24px; margin-bottom: 40px;
          display: flex; gap: 14px; align-items: flex-start;
        }
        .priv-age-icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
        .priv-age-box p { color: var(--text-muted); line-height: 1.7; margin: 0; font-size: 15px; }
        .priv-age-box strong { color: var(--text); }

        .priv-section { margin-bottom: 48px; }
        .priv-section-header {
          display: flex; align-items: center; gap: 14px; margin-bottom: 20px;
          padding-bottom: 16px; border-bottom: 2px solid var(--border);
        }
        .priv-section-icon {
          width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg, #00AFF0 0%, #0099D6 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; box-shadow: 0 4px 12px rgba(0,175,240,0.3);
        }
        .priv-section h2 { font-size: 20px; font-weight: 800; color: var(--text); margin: 0; }
        .priv-section > p { color: var(--text-muted); line-height: 1.75; font-size: 15px; margin: 0 0 14px; }
        .priv-section > p strong { color: var(--text); }
        .priv-section > p a { color: var(--accent); font-weight: 700; text-decoration: none; }
        .priv-section > p a:hover { text-decoration: underline; }

        .priv-sub { margin: 20px 0; }
        .priv-sub h3 { font-size: 16px; font-weight: 700; color: var(--text); margin: 0 0 10px; }
        .priv-sub p { color: var(--text-muted); font-size: 15px; line-height: 1.75; margin: 0 0 10px; }
        .priv-sub ul { padding-left: 22px; color: var(--text-muted); font-size: 15px; line-height: 1.75; margin: 0 0 10px; }
        .priv-sub ul li { margin-bottom: 6px; }

        .priv-cards {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px; margin-top: 16px;
        }
        .priv-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; padding: 20px 22px;
          transition: box-shadow 0.2s ease;
        }
        .priv-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.25); }
        .priv-card-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #00AFF0 0%, #0099D6 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; margin-bottom: 12px;
        }
        .priv-card h4 { font-size: 14px; font-weight: 700; color: var(--text); margin: 0 0 6px; }
        .priv-card p { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin: 0; }

        .priv-rights { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
        .priv-right {
          background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
          padding: 18px 20px; display: flex; gap: 14px; align-items: flex-start;
          transition: box-shadow 0.2s ease;
        }
        .priv-right:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
        .priv-right-icon {
          width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
          background: linear-gradient(135deg, #00AFF0 0%, #0099D6 100%);
          display: flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .priv-right h4 { font-size: 14px; font-weight: 700; color: var(--text); margin: 0 0 5px; }
        .priv-right p { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin: 0; }

        .priv-info-box {
          background: linear-gradient(135deg, rgba(0,175,240,0.06) 0%, rgba(0,153,214,0.06) 100%);
          border: 1px solid rgba(0,175,240,0.2); border-left: 4px solid var(--accent);
          border-radius: 0 12px 12px 0; padding: 24px 28px; margin-top: 16px;
        }
        .priv-info-box p { color: var(--text-muted); line-height: 1.75; margin: 0 0 12px; font-size: 15px; }
        .priv-info-box p:last-child { margin: 0; }
        .priv-info-box strong { color: var(--text); }
        .priv-info-box a { color: var(--accent); font-weight: 700; text-decoration: none; }
        .priv-info-box a:hover { text-decoration: underline; }

        .priv-contact-cta {
          background: linear-gradient(135deg, #0d1018 0%, #131927 100%);
          border: 1px solid var(--border); border-radius: 20px;
          padding: 48px 40px; text-align: center; margin-top: 60px;
        }
        .priv-contact-cta h2 { font-size: 26px; font-weight: 800; color: #fff; margin: 0 0 12px; }
        .priv-contact-cta p { color: rgba(255,255,255,0.65); font-size: 15px; line-height: 1.65; margin: 0 auto 28px; max-width: 520px; }
        .priv-cta-btn {
          display: inline-flex; align-items: center; gap: 10px;
          background: linear-gradient(135deg, #00AFF0 0%, #0099D6 100%);
          color: #fff; padding: 14px 32px; border-radius: 50px; font-weight: 700; font-size: 15px;
          text-decoration: none; transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(0,175,240,0.4);
        }
        .priv-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,175,240,0.5); color: #fff; }
      `}</style>
    </>
  );
}
