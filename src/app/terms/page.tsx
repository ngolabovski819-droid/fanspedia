import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | FansPedia',
  description: 'Read FansPedia\'s terms of service. By using our website you agree to these terms and conditions.',
  alternates: { canonical: 'https://fanspedia.net/terms/' },
};

export default function TermsPage() {
  return (
    <>
      {/* Breadcrumb */}
      <nav className="terms-breadcrumb" aria-label="Breadcrumb">
        <a href="/">🏠 Home</a>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Terms of Service</span>
      </nav>

      {/* Hero */}
      <section className="terms-hero">
        <div className="terms-hero-inner">
          <div className="terms-hero-badge">📄 Legal &amp; Terms</div>
          <h1>Terms of Service</h1>
          <p>Welcome to FansPedia. By accessing or using our website, you agree to comply with and be bound by the following terms and conditions.</p>
          <p className="last-updated">Last updated: March 3, 2026</p>
        </div>
      </section>

      <div className="terms-content">

        <div className="terms-highlight">
          <p>Please review these terms carefully. If you do not agree with any part of these terms, you should not use FansPedia.</p>
        </div>

        <div className="terms-age-box" style={{marginTop:'32px'}}>
          <div className="terms-age-icon">⚠️</div>
          <p><strong>Age Requirement:</strong> You must be at least <strong>18 years of age</strong> to access or use FansPedia. By using this website, you represent and warrant that you are at least 18 years old. If you are under 18, you are strictly prohibited from using this website. We reserve the right to terminate access for any user found to be under the age of 18.</p>
        </div>

        {/* 1 */}
        <div className="terms-section">
          <div className="terms-section-header">
            <div className="terms-section-icon">🤝</div>
            <h2>1. Acknowledgement and Acceptance of Terms</h2>
          </div>
          <p>These terms and conditions outline the rules and regulations for the use of FansPedia. By accessing our website at <strong>fanspedia.net</strong>, you agree to accept all terms and conditions stated here. If you do not agree to any part of these terms, you should discontinue your use of the website immediately.</p>
        </div>

        {/* 2 */}
        <div className="terms-section">
          <div className="terms-section-header">
            <div className="terms-section-icon">ℹ️</div>
            <h2>2. About FansPedia</h2>
          </div>
          <p>FansPedia is a search engine and directory platform that helps users discover OnlyFans creators by linking to publicly available images and text from OnlyFans profiles.</p>
          <ul className="terms-list">
            <li>We do <strong>NOT</strong> host or distribute any media (photos, videos, etc.) from OnlyFans creators on our servers.</li>
            <li>We are not affiliated with or endorsed by OnlyFans.com or Fenix International Limited.</li>
            <li>The use of &quot;OnlyFans&quot; on this site is for identification purposes only and does not imply any endorsement or partnership.</li>
            <li>We do not provide dating, matchmaking, companionship, or escort services of any kind.</li>
            <li>We do not facilitate payments between users and creators. All transactions occur directly on the respective third-party platforms.</li>
          </ul>
        </div>

        {/* 3 */}
        <div className="terms-section">
          <div className="terms-section-header">
            <div className="terms-section-icon">🪪</div>
            <h2>3. Age Verification and Restrictions</h2>
          </div>
          <p>FansPedia contains links to content that is intended for adults only. By using this website:</p>
          <ul className="terms-list">
            <li>You confirm that you are at least 18 years of age.</li>
            <li>You confirm that accessing adult-oriented content is legal in your jurisdiction.</li>
            <li>You understand that FansPedia indexes and links to profiles on third-party platforms that may contain adult content.</li>
            <li>You accept full responsibility for ensuring compliance with your local laws regarding access to such content.</li>
          </ul>
          <div className="terms-warning" style={{marginTop:'20px'}}>
            <div className="terms-warning-icon">⚠️</div>
            <p><strong>Attempting to bypass any age verification or access restriction</strong> on this website is a violation of these Terms and may result in immediate termination of access and reporting to relevant authorities.</p>
          </div>
        </div>

        {/* 4 */}
        <div className="terms-section">
          <div className="terms-section-header">
            <div className="terms-section-icon">👥</div>
            <h2>4. Community Guidelines</h2>
          </div>
          <p>By using FansPedia, you agree to the following community guidelines designed to safeguard all users:</p>
          <ul className="terms-list">
            <li>You will not use the platform for any unlawful, harassing, abusive, or fraudulent purpose.</li>
            <li>You will not attempt to impersonate another person or misrepresent your identity or age.</li>
            <li>You will not use the platform to stalk, harass, bully, or intimidate any individual, including creators listed on the platform.</li>
            <li>You will not post, share, or distribute any content that promotes violence, hatred, discrimination, or exploitation.</li>
          </ul>
        </div>

        {/* 5 */}
        <div className="terms-section">
          <div className="terms-section-header">
            <div className="terms-section-icon">©️</div>
            <h2>5. Intellectual Property Rights</h2>
          </div>
          <p>All media materials (photos, videos, text) displayed on FansPedia belong to their respective owners — primarily the content creators themselves.</p>
          <ul className="terms-list">
            <li>We do not claim any copyright or ownership over third-party content.</li>
            <li>We only link to publicly available profiles on OnlyFans.com.</li>
            <li>You may not copy, reproduce, sell, license, or otherwise exploit any content from FansPedia without the prior written consent of the respective copyright owners.</li>
            <li>The FansPedia name, logo, and website design are the intellectual property of FansPedia and may not be used without written permission.</li>
          </ul>
        </div>

        {/* 6 */}
        <div className="terms-section">
          <div className="terms-section-header">
            <div className="terms-section-icon">🚪</div>
            <h2>6. Opting Out (For Creators)</h2>
          </div>
          <p>Creators who do not wish to be listed on FansPedia can opt out at any time by contacting us at <a href="mailto:fanspediaofficial@gmail.com?subject=Opt-Out%20Request">fanspediaofficial@gmail.com</a>.</p>
          <ul className="terms-list">
            <li>Please provide proof of ownership of the OnlyFans account when submitting a removal request.</li>
            <li>We will process removal requests within a reasonable timeframe, typically within <strong>5 business days</strong>.</li>
            <li>Note that removal will end any free organic exposure you currently receive through our platform.</li>
          </ul>
        </div>

        {/* 7 */}
        <div className="terms-section">
          <div className="terms-section-header">
            <div className="terms-section-icon" style={{background:'linear-gradient(135deg,#ff3b30 0%,#cc2a22 100%)'}}>🚫</div>
            <h2>7. Prohibited Actions</h2>
          </div>
          <p>You are strictly prohibited from:</p>
          <ul className="terms-list">
            <li>Republishing material from FansPedia without explicit written permission.</li>
            <li>Selling, renting, or sub-licensing any material from FansPedia.</li>
            <li>Reproducing, duplicating, or copying material from FansPedia for commercial purposes.</li>
            <li>Redistributing content obtained from FansPedia on any other platform or service.</li>
            <li>Using FansPedia for any purpose that is illegal or prohibited by these Terms.</li>
            <li>Attempting to gain unauthorized access to our systems, servers, or networks.</li>
          </ul>
        </div>

        {/* 8 */}
        <div className="terms-section">
          <div className="terms-section-header">
            <div className="terms-section-icon">🍪</div>
            <h2>8. Cookies</h2>
          </div>
          <p>We use cookies and similar tracking technologies to enhance your user experience, remember your preferences (theme, Safe Search, Wishlist), and analyze site usage. By accessing FansPedia, you agree to the use of cookies in accordance with our <a href="/privacy/">Privacy Policy</a>. You can manage your cookie preferences through your browser settings at any time.</p>
        </div>

        {/* 9 */}
        <div className="terms-section">
          <div className="terms-section-header">
            <div className="terms-section-icon">🔗</div>
            <h2>9. Third-Party Links</h2>
          </div>
          <p>Our website contains links to third-party websites, including OnlyFans.com.</p>
          <ul className="terms-list">
            <li>We have no control over the content, privacy practices, or security of these external websites and accept no responsibility for them.</li>
            <li>We are not responsible for any content, products, or services offered on third-party websites.</li>
            <li>You access third-party websites entirely at your own risk and should review their terms of service and privacy policies before providing any personal information.</li>
          </ul>
        </div>

        {/* 10 */}
        <div className="terms-section">
          <div className="terms-section-header">
            <div className="terms-section-icon">❗</div>
            <h2>10. Disclaimers</h2>
          </div>
          <p>To the fullest extent permitted by applicable law:</p>
          <ul className="terms-list">
            <li>FansPedia is provided on an <strong>&quot;as is&quot;</strong> and <strong>&quot;as available&quot;</strong> basis without any warranties of any kind, whether express or implied.</li>
            <li>We exclude all representations, warranties, and conditions relating to our website and the use of this website.</li>
            <li>We are not responsible for any loss or damage that may arise from the use of our website or any linked external websites.</li>
            <li>We only provide links to publicly available information and are not responsible for the content hosted on external servers.</li>
            <li>Search results and creator data may not always be accurate or up-to-date. Always verify information directly on the source platform.</li>
          </ul>
        </div>

        {/* 11 */}
        <div className="terms-section">
          <div className="terms-section-header">
            <div className="terms-section-icon">🛡️</div>
            <h2>11. Limitation of Liability</h2>
          </div>
          <div className="terms-warning">
            <div className="terms-warning-icon">ℹ️</div>
            <p>In no event shall FansPedia or its team be liable for any damages arising out of or in connection with your use of the website. This includes, without limitation, any liability for <strong>direct, indirect, incidental, consequential, or punitive damages</strong>, even if FansPedia has been advised of the possibility of such damages.</p>
          </div>
        </div>

        {/* 12 */}
        <div className="terms-section">
          <div className="terms-section-header">
            <div className="terms-section-icon">🚷</div>
            <h2>12. Termination of Access</h2>
          </div>
          <p>We reserve the right to suspend or terminate your access to FansPedia at any time, without prior notice, for any reason, including but not limited to:</p>
          <ul className="terms-list">
            <li>Violation of these Terms of Service or Community Guidelines.</li>
            <li>Providing false information about your age or identity.</li>
            <li>Engaging in any activity that is harmful, abusive, or illegal.</li>
            <li>Any conduct that we determine, in our sole discretion, to be inappropriate or harmful to other users or the platform.</li>
          </ul>
        </div>

        {/* 13 */}
        <div className="terms-section">
          <div className="terms-section-header">
            <div className="terms-section-icon">🔄</div>
            <h2>13. Changes to These Terms</h2>
          </div>
          <p>We reserve the right to update these terms and conditions at any time. Any changes will be posted on this page with an updated &quot;Last updated&quot; date. Your continued use of FansPedia after any such changes constitutes your acceptance of the updated terms. We encourage you to review this page periodically.</p>
        </div>

        {/* 14 */}
        <div className="terms-section">
          <div className="terms-section-header">
            <div className="terms-section-icon">⚖️</div>
            <h2>14. Governing Law</h2>
          </div>
          <p>These terms and conditions are governed by and construed in accordance with applicable law. Any disputes arising from or relating to these Terms or your use of FansPedia shall be subject to the exclusive jurisdiction of the applicable courts. If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.</p>
        </div>

        {/* 15 */}
        <div className="terms-section">
          <div className="terms-section-header">
            <div className="terms-section-icon">✉️</div>
            <h2>15. Contact Information</h2>
          </div>
          <p>If you have any questions or concerns regarding these Terms of Service, please contact us at:</p>
          <div className="terms-highlight">
            <p><strong>FansPedia</strong><br />Operating as an independent OnlyFans creator directory<br />Email: <a href="mailto:fanspediaofficial@gmail.com?subject=Terms%20of%20Service%20Inquiry">fanspediaofficial@gmail.com</a></p>
            <p style={{marginTop:'10px'}}>We aim to respond to all inquiries within <strong>5 business days</strong>.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="terms-contact-cta">
          <h2>Questions About Our Terms?</h2>
          <p>If something in these Terms is unclear, or you have a concern about how FansPedia operates, we&apos;d love to hear from you.</p>
          <a href="mailto:fanspediaofficial@gmail.com?subject=Terms%20of%20Service%20Inquiry" className="terms-cta-btn">
            ✉️ fanspediaofficial@gmail.com
          </a>
        </div>

      </div>

      <style>{`
        .terms-breadcrumb {
          max-width: 900px; margin: 0 auto; padding: 14px 16px;
          font-size: 13px; color: var(--text-muted);
        }
        .terms-breadcrumb a { color: var(--text-muted); text-decoration: none; }
        .terms-breadcrumb a:hover { color: var(--accent); }

        .terms-hero {
          background: linear-gradient(135deg, #0d1018 0%, #131927 100%);
          color: #fff; padding: 72px 16px 80px; text-align: center;
          position: relative; overflow: hidden;
          border-bottom: 1px solid var(--border);
        }
        .terms-hero::before {
          content: ''; position: absolute; inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .terms-hero-inner { position: relative; max-width: 720px; margin: 0 auto; }
        .terms-hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(0,175,240,0.2); border: 1px solid rgba(0,175,240,0.4);
          border-radius: 50px; padding: 6px 16px; font-size: 13px; font-weight: 700;
          color: var(--accent); margin-bottom: 20px; letter-spacing: 0.5px;
        }
        .terms-hero h1 { font-size: clamp(2rem, 5vw, 3rem); font-weight: 900; margin: 0 0 16px; }
        .terms-hero p { font-size: clamp(1rem, 2.2vw, 1.2rem); opacity: 0.8; line-height: 1.7; max-width: 600px; margin: 0 auto 10px; }
        .terms-hero .last-updated { font-size: 13px; opacity: 0.55; display: block; margin-top: 8px; }

        .terms-content { max-width: 900px; margin: 0 auto; padding: 60px 16px; }

        .terms-age-box {
          background: linear-gradient(135deg, rgba(255,159,10,0.08) 0%, rgba(255,159,10,0.04) 100%);
          border: 1px solid rgba(255,159,10,0.3); border-left: 4px solid #ff9f0a;
          border-radius: 0 12px 12px 0; padding: 20px 24px; margin-bottom: 40px;
          display: flex; gap: 14px; align-items: flex-start;
        }
        .terms-age-icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
        .terms-age-box p { color: var(--text-muted); line-height: 1.7; margin: 0; font-size: 15px; }
        .terms-age-box strong { color: var(--text); }

        .terms-section { margin-bottom: 48px; }
        .terms-section-header {
          display: flex; align-items: center; gap: 14px; margin-bottom: 20px;
          padding-bottom: 16px; border-bottom: 2px solid var(--border);
        }
        .terms-section-icon {
          width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg, #00AFF0 0%, #0099D6 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; box-shadow: 0 4px 12px rgba(0,175,240,0.3);
        }
        .terms-section h2 { font-size: 20px; font-weight: 800; color: var(--text); margin: 0; }
        .terms-section > p { color: var(--text-muted); line-height: 1.75; font-size: 15px; margin: 0 0 16px; }
        .terms-section > p strong { color: var(--text); }
        .terms-section > p a { color: var(--accent); font-weight: 700; text-decoration: none; }
        .terms-section > p a:hover { text-decoration: underline; }

        .terms-list { padding-left: 0; list-style: none; margin: 12px 0 0; display: flex; flex-direction: column; gap: 10px; }
        .terms-list li {
          display: flex; gap: 12px; align-items: flex-start;
          color: var(--text-muted); font-size: 15px; line-height: 1.7;
        }
        .terms-list li strong { color: var(--text); }
        .terms-list li::before {
          content: ''; display: block; width: 8px; height: 8px; border-radius: 50%;
          background: var(--accent); flex-shrink: 0; margin-top: 9px;
        }

        .terms-highlight {
          background: linear-gradient(135deg, rgba(0,175,240,0.06) 0%, rgba(0,153,214,0.06) 100%);
          border: 1px solid rgba(0,175,240,0.2); border-left: 4px solid var(--accent);
          border-radius: 0 12px 12px 0; padding: 20px 24px; margin: 16px 0;
        }
        .terms-highlight p { color: var(--text-muted); line-height: 1.75; margin: 0; font-size: 15px; }
        .terms-highlight strong { color: var(--text); }
        .terms-highlight a { color: var(--accent); font-weight: 700; text-decoration: none; }
        .terms-highlight a:hover { text-decoration: underline; }

        .terms-warning {
          background: linear-gradient(135deg, rgba(255,59,48,0.08) 0%, rgba(255,59,48,0.04) 100%);
          border: 1px solid rgba(255,59,48,0.25); border-radius: 14px;
          padding: 20px 24px; display: flex; gap: 14px; align-items: flex-start; margin: 16px 0;
        }
        .terms-warning-icon { font-size: 18px; flex-shrink: 0; margin-top: 2px; }
        .terms-warning p { color: var(--text-muted); font-size: 14px; line-height: 1.65; margin: 0; }
        .terms-warning strong { color: var(--text); }

        .terms-contact-cta {
          background: linear-gradient(135deg, #0d1018 0%, #131927 100%);
          border: 1px solid var(--border); border-radius: 20px;
          padding: 48px 40px; text-align: center; margin-top: 60px;
        }
        .terms-contact-cta h2 { font-size: 26px; font-weight: 800; color: #fff; margin: 0 0 12px; }
        .terms-contact-cta p { color: rgba(255,255,255,0.65); font-size: 15px; line-height: 1.65; margin: 0 auto 28px; max-width: 520px; }
        .terms-cta-btn {
          display: inline-flex; align-items: center; gap: 10px;
          background: linear-gradient(135deg, #00AFF0 0%, #0099D6 100%);
          color: #fff; padding: 14px 32px; border-radius: 50px; font-weight: 700; font-size: 15px;
          text-decoration: none; transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(0,175,240,0.4);
        }
        .terms-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,175,240,0.5); color: #fff; }
      `}</style>
    </>
  );
}
