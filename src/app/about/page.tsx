import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About FansPedia | The #1 OnlyFans Creator Search Directory',
  description: 'Learn about FansPedia — the most comprehensive OnlyFans creator directory. Discover our mission, how we index 100,000+ profiles, and why millions of fans trust us to find the right creator.',
  alternates: { canonical: 'https://fanspedia.net/about/' },
};

export default function AboutPage() {
  return (
    <>
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <span>About Us</span>
      </nav>

      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-inner">
          <h1>The Creator Discovery Platform Built for Fans</h1>
          <p>FansPedia is the most comprehensive, independently operated OnlyFans creator directory on the internet — built to help fans find verified creators quickly, safely, and with confidence.</p>
        </div>
      </section>

      {/* Stats Strip */}
      <div className="about-stats-strip">
        <div className="about-stats-grid">
          <div className="about-stat-item">
            <span className="number">100K+</span>
            <span className="label">Creator Profiles</span>
          </div>
          <div className="about-stat-item">
            <span className="number">Daily</span>
            <span className="label">Database Updates</span>
          </div>
          <div className="about-stat-item">
            <span className="number">50+</span>
            <span className="label">Categories Covered</span>
          </div>
          <div className="about-stat-item">
            <span className="number">100%</span>
            <span className="label">Independent &amp; Unbiased</span>
          </div>
        </div>
      </div>

      <div className="about-content">

        {/* Our Mission */}
        <section className="about-section">
          <div className="about-section-label">Our Mission</div>
          <h2>Making Creator Discovery Simple, Safe, and Transparent</h2>
          <p>Finding the right creator on OnlyFans can feel overwhelming. With millions of profiles and no centralised search, fans are left scrolling through social media hoping to stumble across someone they&apos;ll love. FansPedia was built to solve exactly that problem.</p>
          <p>We aggregate, organise, and index publicly available creator profile data — including subscription prices, verification status, post counts, and categories — so you can search, filter, and discover creators that genuinely match what you&apos;re looking for. No guesswork, no dead links, no misleading content.</p>
          <p>Our search engine is updated every single day. When a creator publishes new content, adjusts their price, or earns a verified badge, our index reflects that. We believe fans deserve accurate, up-to-date information — and creators deserve to be discovered.</p>
        </section>

        <div className="about-divider" />

        {/* Our Values */}
        <section className="about-section">
          <div className="about-section-label">What We Stand For</div>
          <h2>Our Core Values</h2>
          <p>Every decision we make — from how we collect creator data to how we display search results — is guided by four principles.</p>
          <div className="about-values-grid">
            <div className="about-value-card">
              <div className="about-value-icon">👁️</div>
              <h3>Transparency</h3>
              <p>We are not affiliated with OnlyFans. We are an independent directory. We clearly disclose our data sources, our limitations, and our editorial process.</p>
            </div>
            <div className="about-value-card">
              <div className="about-value-icon">✅</div>
              <h3>Accuracy</h3>
              <p>Our automated systems verify and refresh profile data daily. We flag deleted or inactive accounts promptly so search results stay clean and reliable.</p>
            </div>
            <div className="about-value-card">
              <div className="about-value-icon">🛡️</div>
              <h3>Safety</h3>
              <p>FansPedia is an 18+ platform. We include a built-in Safe Search toggle that blurs explicit preview imagery — designed for responsible browsing in any setting.</p>
            </div>
            <div className="about-value-card">
              <div className="about-value-icon">⚖️</div>
              <h3>Impartiality</h3>
              <p>No creator pays to be featured. Our search results are ranked by relevance and public engagement metrics only — never by commercial arrangements.</p>
            </div>
          </div>
        </section>

        <div className="about-divider" />

        {/* How It Works */}
        <section className="about-section">
          <div className="about-section-label">How It Works</div>
          <h2>How We Build and Maintain Our Directory</h2>
          <p>FansPedia operates a proprietary automated data pipeline that continuously scans and indexes publicly accessible OnlyFans profile pages. We collect only the information that creators have chosen to make public: their display name, username, biography, subscription price, post count, follower count, verification status, and profile images.</p>
          <p>Our technology identifies new creator registrations daily, adds them to the database, and flags accounts that have been deactivated or deleted so they are removed from search results promptly. Historical snapshots of profile metrics allow us to surface trending creators and highlight those who are growing rapidly.</p>
          <p>We do not scrape, store, or distribute any private creator content. FansPedia is a discovery tool — we direct fans to creator profiles on OnlyFans directly. Any subscription, payment, or interaction happens entirely on the OnlyFans platform, not through us.</p>
        </section>

        <div className="about-divider" />

        {/* Expertise */}
        <section className="about-section">
          <div className="about-section-label">Experience &amp; Expertise</div>
          <h2>Built by a Team With Deep Platform Knowledge</h2>
          <p>The FansPedia team brings together expertise in search engine technology, web data infrastructure, and digital content platforms. We have spent years studying how fans discover creators and where the existing tooling falls short — long wait times, stale data, inaccurate pricing, and broken profile links are problems we have personally experienced and are determined to fix.</p>
          <p>Our engineering team maintains the data pipeline, quality control systems, and search algorithms that power this directory. Our editorial team reviews category taxonomies, ensures content accuracy, and monitors for spam or misleading creator profiles. Together, we operate a platform used by hundreds of thousands of fans every month.</p>
          <p>We take this responsibility seriously. Our community depends on us to surface reliable information, and we hold ourselves to a high standard: if we would not recommend a profile to a friend, it should not appear prominently in our results.</p>
        </section>

        <div className="about-divider" />

        {/* Team */}
        <section className="about-section">
          <div className="about-section-label">The Team</div>
          <h2>Who Is Behind FansPedia</h2>
          <p>We are a small, dedicated team of engineers, data researchers, and digital media professionals who are passionate about making creator discovery better for everyone.</p>
          <div className="about-team-grid">
            <div className="about-team-card">
              <div className="about-team-avatar about-team-avatar-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/uploads/author-nick.jpg" alt="Nick Golabovski" width={72} height={72} loading="lazy" />
              </div>
              <h4>Nick Golabovski</h4>
              <span>Founder &amp; CEO</span>
              <p>Serial entrepreneur with 10+ years in digital media and search technology. Conceived FansPedia after noticing the gap in creator discoverability.</p>
              <a className="about-team-link" href="https://www.linkedin.com/in/nikola-golabovski-28b124209/" target="_blank" rel="noopener noreferrer">
                in Connect on LinkedIn
              </a>
            </div>
            <div className="about-team-card">
              <div className="about-team-avatar">A</div>
              <h4>Alex R.</h4>
              <span>Head of Engineering</span>
              <p>Backend systems architect specialising in large-scale data indexing and real-time search infrastructure.</p>
            </div>
            <div className="about-team-card">
              <div className="about-team-avatar">M</div>
              <h4>Maya T.</h4>
              <span>Head of Data &amp; QA</span>
              <p>Data scientist responsible for profile quality, category accuracy, and our daily database refresh pipeline.</p>
            </div>
            <div className="about-team-card">
              <div className="about-team-avatar">J</div>
              <h4>James V.</h4>
              <span>Head of Growth</span>
              <p>SEO and community specialist focused on helping fans find FansPedia and helping creators get discovered.</p>
            </div>
          </div>
        </section>

        <div className="about-divider" />

        {/* Trust & Compliance */}
        <section className="about-section">
          <div className="about-section-label">Trust &amp; Compliance</div>
          <h2>Why You Can Trust FansPedia</h2>
          <p>We are committed to operating with the highest standards of honesty and legal compliance. Here is what that means in practice:</p>
          <p><strong>We are 18+ only.</strong> Access to FansPedia requires users to confirm they are adults. We take age verification and responsible access seriously.</p>
          <p><strong>We respect creator privacy.</strong> We only index publicly available data. Creators can submit a removal request and their profile will be delisted promptly. We do not sell, share, or monetise creator personal data.</p>
          <p><strong>We are independent.</strong> FansPedia has no commercial relationship with OnlyFans or its parent company. The OnlyFans name and trademark belong to their respective owners. We are a third-party index only.</p>
          <p><strong>We are honest about what we are.</strong> FansPedia is a search directory, not a fansite, not an agency, and not an OnlyFans reseller. Every link to a creator profile opens OnlyFans.com directly — we earn no commission and receive no referral fees from creator subscriptions.</p>
        </section>

        {/* CTA */}
        <section className="about-cta">
          <div className="about-cta-inner">
            <h2>Ready to Find Your Next Favourite Creator?</h2>
            <p>Search 100,000+ profiles by category, location, price, and more — completely free.</p>
            <a href="/" className="about-cta-btn">🔍 Start Searching Now</a>
          </div>
        </section>

      </div>

      <style>{`
        .about-hero {
          background: linear-gradient(135deg, #00AFF0 0%, #0069a5 100%);
          color: #fff;
          padding: 72px 16px 80px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .about-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .about-hero-inner { position: relative; max-width: 820px; margin: 0 auto; }
        .about-hero h1 { font-size: clamp(2rem, 5vw, 3.2rem); font-weight: 900; margin-bottom: 20px; text-shadow: 0 2px 8px rgba(0,0,0,0.2); }
        .about-hero p { font-size: clamp(1rem, 2.2vw, 1.25rem); opacity: 0.93; line-height: 1.7; max-width: 680px; margin: 0 auto; }

        .about-stats-strip { background: var(--surface); border-bottom: 1px solid var(--border); padding: 28px 16px; }
        .about-stats-grid { max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; text-align: center; }
        .about-stat-item .number { font-size: 2rem; font-weight: 900; color: var(--accent); line-height: 1; display: block; }
        .about-stat-item .label { font-size: 13px; color: var(--text-muted); font-weight: 600; margin-top: 6px; display: block; }
        @media (max-width: 600px) { .about-stats-grid { grid-template-columns: repeat(2, 1fr); } }

        .about-content { max-width: 860px; margin: 0 auto; padding: 60px 16px 40px; }

        .about-section { margin-bottom: 64px; }
        .about-section-label { font-size: 12px; font-weight: 800; letter-spacing: 1.6px; text-transform: uppercase; color: var(--accent); margin-bottom: 10px; }
        .about-section h2 { font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 800; color: var(--text); margin-bottom: 20px; line-height: 1.25; }
        .about-section p { font-size: 16px; line-height: 1.8; color: var(--text-muted); margin-bottom: 16px; }
        .about-section p:last-child { margin-bottom: 0; }
        .about-section strong { color: var(--text); }

        .about-values-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; margin-top: 32px; }
        .about-value-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 28px 24px; transition: transform .25s ease, box-shadow .25s ease; }
        .about-value-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.2); }
        .about-value-icon { font-size: 26px; margin-bottom: 16px; display: block; }
        .about-value-card h3 { font-size: 16px; font-weight: 800; color: var(--text); margin-bottom: 8px; }
        .about-value-card p { font-size: 14px; color: var(--text-muted); line-height: 1.6; margin: 0; }

        .about-divider { height: 1px; background: var(--border); margin: 0 0 64px; position: relative; }
        .about-divider::before { content: ''; position: absolute; left: 0; top: 0; width: 60px; height: 2px; background: linear-gradient(90deg, #00AFF0, #0099D6); border-radius: 2px; }

        .about-team-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; margin-top: 32px; }
        .about-team-card { text-align: center; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 32px 20px 24px; }
        .about-team-avatar { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #00AFF0 0%, #0069a5 100%); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 28px; color: #fff; font-weight: 900; overflow: hidden; }
        .about-team-avatar-photo { background: var(--border); border: 2px solid rgba(0,175,240,0.35); }
        .about-team-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .about-team-card h4 { font-size: 16px; font-weight: 800; color: var(--text); margin-bottom: 4px; }
        .about-team-card > span { font-size: 13px; color: var(--accent); font-weight: 600; display: block; margin-bottom: 10px; }
        .about-team-card p { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin: 0; }
        .about-team-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; padding: 7px 12px; border-radius: 999px; border: 1px solid #0A66C2; background: rgba(10,102,194,0.08); color: #0A66C2; font-size: 12px; font-weight: 700; text-decoration: none; transition: background .2s, color .2s; }
        .about-team-link:hover { background: #0A66C2; color: #fff; }

        .about-cta { background: linear-gradient(135deg, #00AFF0 0%, #0069a5 100%); border-radius: 24px; padding: 48px 40px; text-align: center; color: #fff; margin-bottom: 0; position: relative; overflow: hidden; }
        .about-cta::before { content: ''; position: absolute; inset: 0; background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }
        .about-cta-inner { position: relative; }
        .about-cta h2 { font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 900; margin-bottom: 12px; }
        .about-cta p { font-size: 16px; opacity: 0.9; margin-bottom: 28px; }
        .about-cta-btn { display: inline-flex; align-items: center; gap: 10px; padding: 14px 32px; background: #fff; color: #0099D6; border-radius: 9999px; font-weight: 800; font-size: 16px; text-decoration: none; transition: transform .2s ease, box-shadow .2s ease; box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
        .about-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.25); color: #0069a5; }

        @media (max-width: 600px) {
          .about-hero { padding: 48px 16px 60px; }
          .about-cta { padding: 36px 24px; }
          .about-content { padding: 40px 16px 32px; }
        }
      `}</style>
    </>
  );
}
