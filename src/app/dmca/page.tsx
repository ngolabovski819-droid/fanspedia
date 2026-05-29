import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DMCA Takedown Policy | FansPedia',
  description: 'FansPedia DMCA policy — how to submit a takedown request, counter-notification procedure, and our compliance with the Digital Millennium Copyright Act.',
  alternates: { canonical: 'https://fanspedia.net/dmca/' },
};

export default function DmcaPage() {
  return (
    <>
      {/* Breadcrumb */}
      <nav className="dmca-breadcrumb" aria-label="Breadcrumb">
        <a href="/">🏠 Home</a>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">DMCA Policy</span>
      </nav>

      {/* Hero */}
      <section className="dmca-hero">
        <div className="dmca-hero-inner">
          <div className="dmca-hero-badge">🛡️ Legal &amp; Copyright</div>
          <h1>DMCA Takedown Policy</h1>
          <p>FansPedia is a discovery platform and search engine for OnlyFans creators. We only showcase publicly available profile information. Here&apos;s everything you need to know about our copyright policy.</p>
          <a href="mailto:fanspediaofficial@gmail.com?subject=DMCA%20Takedown%20Request" className="dmca-hero-cta">
            ✉️ Submit a Takedown Request
          </a>
        </div>
      </section>

      <div className="dmca-content">

        {/* Info box */}
        <div className="dmca-info-box">
          <p>FansPedia showcases <strong>publicly available images and text</strong> from OnlyFans creator profiles only. We do <strong>not</strong> display any leaked, pirated, or illegal material of any kind.</p>
          <p>FansPedia operates as a <strong>discovery platform and search engine</strong> — similar to how Google indexes public web pages — helping fans find and connect with creators based on their preferences. When a user finds a creator on FansPedia, they are linked directly to that creator&apos;s OnlyFans page.</p>
          <p>By being listed on FansPedia, creators benefit from <strong>free exposure</strong> to fans who are actively searching for creators like them. All traffic from FansPedia goes directly to your OnlyFans profile at no cost to you.</p>
          <p>That said, if you still want us to remove your profile from FansPedia, please send a DMCA notice to <a href="mailto:fanspediaofficial@gmail.com?subject=DMCA%20Takedown%20Request">fanspediaofficial@gmail.com</a>. Note that removal will end any free exposure you receive through our platform.</p>
        </div>

        {/* DMCA Compliance */}
        <div className="dmca-section">
          <div className="dmca-section-header">
            <div className="dmca-section-icon">⚖️</div>
            <h2>DMCA Compliance</h2>
          </div>
          <p>In accordance with the <strong>Digital Millennium Copyright Act (DMCA)</strong> (Title 17 U.S.C. §512) and the <strong>World Intellectual Property Organization (WIPO)</strong>, FansPedia promptly responds to all valid claims of intellectual property infringement.</p>
          <p>We will investigate all submitted notices and take appropriate action, including removing any infringing material as required by law. Our designated agent for receiving DMCA notices is reachable at <a href="mailto:fanspediaofficial@gmail.com?subject=DMCA%20Takedown%20Request">fanspediaofficial@gmail.com</a>.</p>
        </div>

        {/* How to Submit */}
        <div className="dmca-section">
          <div className="dmca-section-header">
            <div className="dmca-section-icon">📄</div>
            <h2>How to Submit a DMCA Takedown Notice</h2>
          </div>
          <p>To submit a valid DMCA takedown notice, email <a href="mailto:fanspediaofficial@gmail.com?subject=DMCA%20Takedown%20Request">fanspediaofficial@gmail.com</a> with the following information:</p>

          <div className="dmca-steps">
            <div className="dmca-step">
              <div className="dmca-step-num">1</div>
              <div>
                <h3>Identification of the copyrighted work</h3>
                <p>Specify the copyrighted work you claim has been infringed. If multiple works are involved, provide a complete list of all copyrighted works in your notice.</p>
              </div>
            </div>

            <div className="dmca-step">
              <div className="dmca-step-num">2</div>
              <div>
                <h3>Identification of the infringing material or link</h3>
                <p>Identify the specific material or link you claim is infringing and provide its exact location on FansPedia. At minimum, include:</p>
                <ul>
                  <li>The direct URL displayed on FansPedia</li>
                  <li>The exact location where the allegedly infringing material can be found</li>
                </ul>
              </div>
            </div>

            <div className="dmca-step">
              <div className="dmca-step-num">3</div>
              <div>
                <h3>Your affiliation and full contact information</h3>
                <p>Include your affiliation with the copyrighted work (if applicable) along with your full contact details:</p>
                <ul>
                  <li>Full mailing address</li>
                  <li>Telephone number</li>
                  <li>Email address</li>
                </ul>
              </div>
            </div>

            <div className="dmca-step">
              <div className="dmca-step-num">4</div>
              <div>
                <h3>Required statements</h3>
                <p>Include both of the following statements verbatim in your notice:</p>
                <div className="dmca-quote">
                  <p>&ldquo;I hereby state that I have a good faith belief that the disputed use of the copyrighted material is not authorized by the copyright owner, its agent, or the law (e.g., as a fair use).&rdquo;</p>
                </div>
                <div className="dmca-quote">
                  <p>&ldquo;I hereby state that the information in this notice is accurate and, under penalty of perjury, that I am the owner, or authorized to act on behalf of the owner, of the copyright or of an exclusive right under the copyright that is allegedly infringed.&rdquo;</p>
                </div>
              </div>
            </div>

            <div className="dmca-step">
              <div className="dmca-step-num">5</div>
              <div>
                <h3>Signature</h3>
                <p>Include your full legal name and your electronic or physical signature.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Counter-Notification */}
        <div className="dmca-section">
          <div className="dmca-section-header">
            <div className="dmca-section-icon">↩️</div>
            <h2>Counter-Notification Procedure</h2>
          </div>
          <p>If you believe that material you posted on FansPedia was removed or disabled as a result of mistake or misidentification, you may submit a counter-notification to <a href="mailto:fanspediaofficial@gmail.com">fanspediaofficial@gmail.com</a> containing:</p>

          <div className="dmca-steps">
            <div className="dmca-step">
              <div className="dmca-step-num">📋</div>
              <div>
                <h3>Counter-notice requirements</h3>
                <ul>
                  <li>Your physical or electronic signature</li>
                  <li>Identification of the removed or disabled material and its previous location on FansPedia</li>
                  <li>A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled due to mistake or misidentification</li>
                  <li>Your full name, mailing address, telephone number, and email address</li>
                  <li>A statement that you consent to the jurisdiction of the appropriate federal district court</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* False Claims Warning */}
        <div className="dmca-section">
          <div className="dmca-section-header">
            <div className="dmca-section-icon" style={{background:'linear-gradient(135deg,#ff3b30 0%,#cc2a22 100%)'}}>⚠️</div>
            <h2>Important Notice Regarding False Claims</h2>
          </div>
          <div className="dmca-warning">
            <div className="dmca-warning-icon">⚠️</div>
            <div>
              <h3>Filing a false DMCA claim carries legal consequences.</h3>
              <p>Please be aware that submitting a false or bad-faith DMCA notice may result in significant legal liability under 17 U.S.C. §512(f), including damages, attorney&apos;s fees, and other costs. If you are unsure whether the material in question actually infringes your copyright, we strongly recommend seeking qualified legal advice before submitting a notice. FansPedia is not liable for any consequences arising from false claims, and the submitting party may be held personally responsible for any resulting legal actions.</p>
              <p style={{marginTop:'12px'}}>By submitting a DMCA notice to FansPedia, you agree to these terms. If you have further questions, contact us at <a href="mailto:fanspediaofficial@gmail.com">fanspediaofficial@gmail.com</a>.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="dmca-contact-cta">
          <h2>Ready to Submit a Takedown Request?</h2>
          <p>Email our DMCA team directly. Include all the required information listed above and we will process your request promptly — typically within 2 business days.</p>
          <a href="mailto:fanspediaofficial@gmail.com?subject=DMCA%20Takedown%20Request" className="dmca-cta-btn">
            ✉️ fanspediaofficial@gmail.com
          </a>
        </div>

      </div>

      <style>{`
        .dmca-breadcrumb {
          max-width: 900px; margin: 0 auto; padding: 14px 16px;
          font-size: 13px; color: var(--text-muted);
        }
        .dmca-breadcrumb a { color: var(--text-muted); text-decoration: none; }
        .dmca-breadcrumb a:hover { color: var(--accent); }

        .dmca-hero {
          background: linear-gradient(135deg, #0d1018 0%, #131927 100%);
          color: #fff; padding: 72px 16px 80px; text-align: center;
          position: relative; overflow: hidden;
          border-bottom: 1px solid var(--border);
        }
        .dmca-hero::before {
          content: ''; position: absolute; inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .dmca-hero-inner { position: relative; max-width: 720px; margin: 0 auto; }
        .dmca-hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(0,175,240,0.2); border: 1px solid rgba(0,175,240,0.4);
          border-radius: 50px; padding: 6px 16px; font-size: 13px; font-weight: 700;
          color: var(--accent); margin-bottom: 20px; letter-spacing: 0.5px;
        }
        .dmca-hero h1 { font-size: clamp(2rem, 5vw, 3rem); font-weight: 900; margin: 0 0 16px; }
        .dmca-hero p { font-size: clamp(1rem, 2.2vw, 1.2rem); opacity: 0.8; line-height: 1.7; max-width: 600px; margin: 0 auto 28px; }
        .dmca-hero-cta {
          display: inline-flex; align-items: center; gap: 10px;
          background: linear-gradient(135deg, #00AFF0 0%, #0099D6 100%);
          color: #fff; padding: 14px 28px; border-radius: 50px; font-weight: 700; font-size: 15px;
          text-decoration: none; transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(0,175,240,0.4);
        }
        .dmca-hero-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,175,240,0.5); color: #fff; }

        .dmca-content { max-width: 900px; margin: 0 auto; padding: 60px 16px; }

        .dmca-info-box {
          background: linear-gradient(135deg, rgba(0,175,240,0.06) 0%, rgba(0,153,214,0.06) 100%);
          border: 1px solid rgba(0,175,240,0.2);
          border-left: 4px solid var(--accent);
          border-radius: 0 12px 12px 0;
          padding: 24px 28px; margin-bottom: 40px;
        }
        .dmca-info-box p { color: var(--text-muted); line-height: 1.75; margin: 0 0 12px; font-size: 15px; }
        .dmca-info-box p:last-child { margin: 0; }
        .dmca-info-box strong { color: var(--text); }
        .dmca-info-box a { color: var(--accent); font-weight: 700; text-decoration: none; }
        .dmca-info-box a:hover { text-decoration: underline; }

        .dmca-section { margin-bottom: 48px; }
        .dmca-section-header {
          display: flex; align-items: center; gap: 14px; margin-bottom: 20px;
          padding-bottom: 16px; border-bottom: 2px solid var(--border);
        }
        .dmca-section-icon {
          width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg, #00AFF0 0%, #0099D6 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; box-shadow: 0 4px 12px rgba(0,175,240,0.3);
        }
        .dmca-section h2 { font-size: 20px; font-weight: 800; color: var(--text); margin: 0; }
        .dmca-section > p { color: var(--text-muted); line-height: 1.75; font-size: 15px; margin: 0 0 16px; }
        .dmca-section > p a { color: var(--accent); font-weight: 700; text-decoration: none; }
        .dmca-section > p a:hover { text-decoration: underline; }
        .dmca-section > p strong { color: var(--text); }

        .dmca-steps { display: flex; flex-direction: column; gap: 16px; }
        .dmca-step {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; padding: 24px; display: flex; gap: 18px;
          align-items: flex-start; transition: box-shadow 0.2s ease;
        }
        .dmca-step:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
        .dmca-step-num {
          min-width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, #00AFF0 0%, #0099D6 100%);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 15px; font-weight: 800;
        }
        .dmca-step h3 { font-size: 15px; font-weight: 700; color: var(--text); margin: 0 0 8px; }
        .dmca-step p { font-size: 14px; color: var(--text-muted); line-height: 1.65; margin: 0; }
        .dmca-step ul { margin: 8px 0 0; padding-left: 20px; font-size: 14px; color: var(--text-muted); line-height: 1.65; }
        .dmca-step ul li { margin-bottom: 4px; }

        .dmca-quote {
          background: var(--surface-raised); border: 1px solid var(--border);
          border-left: 3px solid var(--accent); border-radius: 0 10px 10px 0;
          padding: 16px 20px; margin: 12px 0;
        }
        .dmca-quote p { font-size: 14px; color: var(--text-muted); font-style: italic; margin: 0; line-height: 1.6; }

        .dmca-warning {
          background: linear-gradient(135deg, rgba(255,59,48,0.08) 0%, rgba(255,59,48,0.04) 100%);
          border: 1px solid rgba(255,59,48,0.3); border-radius: 14px;
          padding: 24px 28px; display: flex; gap: 16px; align-items: flex-start;
        }
        .dmca-warning-icon { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
        .dmca-warning h3 { font-size: 15px; font-weight: 700; color: var(--text); margin: 0 0 8px; }
        .dmca-warning p { font-size: 14px; color: var(--text-muted); line-height: 1.65; margin: 0; }
        .dmca-warning a { color: var(--accent); font-weight: 700; text-decoration: none; }
        .dmca-warning a:hover { text-decoration: underline; }

        .dmca-contact-cta {
          background: linear-gradient(135deg, #0d1018 0%, #131927 100%);
          border: 1px solid var(--border); border-radius: 20px;
          padding: 48px 40px; text-align: center; margin-top: 60px;
        }
        .dmca-contact-cta h2 { font-size: 26px; font-weight: 800; color: #fff; margin: 0 0 12px; }
        .dmca-contact-cta p { color: rgba(255,255,255,0.65); font-size: 15px; line-height: 1.65; margin: 0 auto 28px; max-width: 520px; }
        .dmca-cta-btn {
          display: inline-flex; align-items: center; gap: 10px;
          background: linear-gradient(135deg, #00AFF0 0%, #0099D6 100%);
          color: #fff; padding: 14px 32px; border-radius: 50px; font-weight: 700; font-size: 15px;
          text-decoration: none; transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(0,175,240,0.4);
        }
        .dmca-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,175,240,0.5); color: #fff; }
      `}</style>
    </>
  );
}
