import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Promote Your OnlyFans — Get Real Subscribers from Google | FansPedia',
  description: 'Get your OnlyFans profile featured on FansPedia and reach millions of fans who search Google for creators every month.',
  alternates: { canonical: 'https://fanspedia.net/promote/' },
};

const steps = [
  { n: '01', title: 'Submit Your Profile', desc: 'Send us your OnlyFans username. No password required — ever.' },
  { n: '02', title: 'We Review & Index', desc: 'Our team reviews your profile and adds it to the relevant category and country pages within 24 hours.' },
  { n: '03', title: 'Get Google Traffic', desc: 'Your profile appears in search results for fans actively looking for creators like you.' },
];

const faqs = [
  { q: 'Is it free to be listed on FansPedia?', a: 'Yes, basic listing is completely free. We index publicly available OnlyFans profiles at no charge.' },
  { q: 'Do you need my password?', a: 'Never. We only need your public OnlyFans username.' },
  { q: 'How long does it take to appear?', a: 'Typically within 24 hours of submission.' },
  { q: 'Can I remove my profile later?', a: 'Yes, at any time — just email fanspediaofficial@gmail.com with your username and proof of account ownership.' },
  { q: 'What categories will I appear in?', a: 'We match your profile to relevant categories based on your public bio and location. You can suggest categories in your submission.' },
];

export default function PromotePage() {
  return (
    <>
      {/* Hero */}
      <section className="promote-hero">
        <h1>Promote Your OnlyFans and Get <span className="promote-highlight">Real Paying Fans</span> from Google</h1>
        <p className="promote-hero-sub">FansPedia reaches millions of fans who search Google for creators every month. Get your profile featured in front of high-intent audiences who are ready to subscribe.</p>
        <div className="promote-hero-actions">
          <a href="mailto:fanspediaofficial@gmail.com?subject=List%20My%20Profile%20on%20FansPedia" className="btn-primary promote-cta">
            Submit My Profile — Free
          </a>
          <p className="promote-hero-note">No password required · Free to apply · Real Google traffic</p>
        </div>
      </section>

      {/* How it works */}
      <section className="promote-section">
        <div className="promote-inner">
          <h2 className="promote-section-title">How Promoting on FansPedia Works</h2>
          <p className="promote-section-lead">Getting your profile in front of motivated fans takes less than 24 hours. No technical setup, no passwords — just results.</p>
          <div className="promote-steps">
            {steps.map((s) => (
              <div key={s.n} className="promote-step">
                <div className="promote-step-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why SEO traffic */}
      <section className="promote-section promote-section-alt">
        <div className="promote-inner">
          <h2 className="promote-section-title">Why SEO Traffic Converts Better Than Social Media</h2>
          <p className="promote-section-lead">Not all traffic is equal. Fans who find you through Google are actively searching for a creator to subscribe to — they already have their wallet out.</p>
          <div className="promote-compare">
            <div className="promote-compare-item promote-compare-good">
              <div className="promote-compare-label promote-compare-label-good">FansPedia (SEO)</div>
              <ul>
                <li>✓ High-intent fans ready to subscribe</li>
                <li>✓ Free organic traffic from Google</li>
                <li>✓ No algorithm changes to worry about</li>
                <li>✓ Traffic 24/7, even while you sleep</li>
                <li>✓ No account bans or shadowbans</li>
              </ul>
            </div>
            <div className="promote-compare-item">
              <div className="promote-compare-label">Social Media</div>
              <ul>
                <li>✗ Algorithm-dependent reach</li>
                <li>✗ Constant posting required</li>
                <li>✗ Risk of account suspension</li>
                <li>✗ Lower purchase intent</li>
                <li>✗ Adult content restrictions</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="promote-section">
        <div className="promote-inner">
          <h2 className="promote-section-title">Frequently Asked Questions</h2>
          <div className="promote-faqs">
            {faqs.map((f) => (
              <div key={f.q} className="promote-faq-item">
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="promote-cta-section">
        <h2>Ready to Grow Your OnlyFans?</h2>
        <p>Join thousands of creators already getting free traffic from FansPedia.</p>
        <a href="mailto:fanspediaofficial@gmail.com?subject=List%20My%20Profile%20on%20FansPedia" className="btn-primary promote-cta">
          Get Listed for Free
        </a>
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
          Questions? <Link href="/contact/">Contact us</Link>
        </p>
      </section>
    </>
  );
}
