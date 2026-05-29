'use client';

import { useState, FormEvent } from 'react';

export default function ContactClient() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const subject = (form.elements.namedItem('subject') as HTMLSelectElement).value;
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:fanspediaofficial@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
    setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 800);
  }

  return (
    <>
      {/* Breadcrumb */}
      <nav className="contact-breadcrumb" aria-label="Breadcrumb">
        <a href="/">🏠 Home</a>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Contact Us</span>
      </nav>

      {/* Hero */}
      <section className="contact-hero">
        <div className="contact-hero-inner">
          <h1>Get in Touch With FansPedia</h1>
          <p>Have a question, a removal request, or feedback? We&apos;d love to hear from you. Our team responds to every message within 24 hours.</p>
        </div>
      </section>

      <div className="contact-content">
        <div className="contact-grid">

          {/* Left: Info cards */}
          <div className="contact-info">
            <div className="contact-card">
              <div className="contact-card-icon">✉️</div>
              <div className="contact-card-body">
                <h3>Email Us</h3>
                <p>We respond to all enquiries within 24 hours on business days.</p>
                <a href="mailto:fanspediaofficial@gmail.com">fanspediaofficial@gmail.com</a>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-card-icon">🚫</div>
              <div className="contact-card-body">
                <h3>Profile Removal Request</h3>
                <p>Creator or manager? Request delisting of a profile from our directory.</p>
                <a href="mailto:fanspediaofficial@gmail.com?subject=Profile%20Removal%20Request">Send removal request</a>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-card-icon" style={{background:'linear-gradient(135deg,#e1306c 0%,#833ab4 100%)'}}>📸</div>
              <div className="contact-card-body">
                <h3>Instagram</h3>
                <p>Follow us for updates, featured creators, and announcements.</p>
                <a href="https://www.instagram.com/fanspediaofficial/" target="_blank" rel="noopener noreferrer">@fanspediaofficial</a>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-card-icon" style={{background:'linear-gradient(135deg,#1da1f2 0%,#0d8ecf 100%)'}}>𝕏</div>
              <div className="contact-card-body">
                <h3>X (Twitter)</h3>
                <p>DM us or tag us with feedback and feature requests.</p>
                <a href="https://x.com/fanspedia" target="_blank" rel="noopener noreferrer">@fanspedia</a>
              </div>
            </div>

            <div className="contact-response-note">
              <span className="contact-clock">🕐</span>
              <span>Our team is available Monday–Friday, 9 am–6 pm GMT. We aim to respond to all emails within one business day.</span>
            </div>
          </div>

          {/* Right: Contact form */}
          <div className="contact-form-card">
            <h2>Send Us a Message</h2>
            <p className="form-subtitle">Fill in the form below and we&apos;ll get back to you as soon as possible.</p>
            {!submitted ? (
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="contactName">Name <span>*</span></label>
                    <input type="text" className="form-control" id="contactName" name="name" placeholder="Your name" required autoComplete="name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="contactEmail">Email <span>*</span></label>
                    <input type="email" className="form-control" id="contactEmail" name="email" placeholder="your@email.com" required autoComplete="email" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contactSubject">Subject <span>*</span></label>
                  <select className="form-control" id="contactSubject" name="subject" required defaultValue="">
                    <option value="" disabled>Select a topic</option>
                    <option value="General Enquiry">General Enquiry</option>
                    <option value="Profile Removal Request">Profile Removal Request</option>
                    <option value="Report Incorrect Information">Report Incorrect Information</option>
                    <option value="Partnership or Advertising">Partnership or Advertising</option>
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="DMCA / Copyright">DMCA / Copyright</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contactMessage">Message <span>*</span></label>
                  <textarea className="form-control" id="contactMessage" name="message" placeholder="Describe your enquiry in detail..." required />
                </div>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Sending…' : '✈ Send Message'}
                </button>
              </form>
            ) : (
              <div className="form-success">
                <div className="form-success-icon">✅</div>
                <p>Message sent! We&apos;ll get back to you within 24 hours at the email you provided.</p>
              </div>
            )}
          </div>

        </div>

        {/* FAQ */}
        <div className="contact-faq">
          <h2>Frequently Asked Questions</h2>
          <p className="faq-subtitle">Quick answers to the most common questions we receive.</p>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>🚫 How do I remove my profile from FansPedia?</h3>
              <p>Email us at <a href="mailto:fanspediaofficial@gmail.com?subject=Profile%20Removal%20Request">fanspediaofficial@gmail.com</a> with your OnlyFans username and a brief note confirming you are the creator or their authorised representative. We process removal requests within 48 hours.</p>
            </div>
            <div className="faq-item">
              <h3>✏️ Can I update my profile information?</h3>
              <p>Our directory syncs automatically with public OnlyFans profile data. If your profile shows outdated information, it should update within our next daily refresh. If it persists longer than 72 hours, contact us and we&apos;ll force a refresh manually.</p>
            </div>
            <div className="faq-item">
              <h3>🤝 Do you offer paid placements or sponsorships?</h3>
              <p>We do not accept paid placements in our search results. All rankings are based on public engagement metrics and relevance only. For partnership and advertising enquiries, please contact us and select &quot;Partnership or Advertising&quot; as your subject.</p>
            </div>
            <div className="faq-item">
              <h3>🚩 How do I report incorrect or harmful content?</h3>
              <p>Use the contact form above or email us directly. Select &quot;Report Incorrect Information&quot; or &quot;DMCA / Copyright&quot; as applicable. We take reports seriously and will review and act within 24 hours on business days.</p>
            </div>
            <div className="faq-item">
              <h3>🏢 Is FansPedia affiliated with OnlyFans?</h3>
              <p>No. FansPedia is a completely independent third-party directory. We have no commercial relationship with OnlyFans or its parent company. All links to creator profiles direct you to OnlyFans.com — subscriptions and payments happen there, not through us.</p>
            </div>
            <div className="faq-item">
              <h3>🗄️ Where does your creator data come from?</h3>
              <p>We index only publicly available information from OnlyFans creator profile pages — display name, username, biography, subscription price, verification status, post counts, and profile images. We do not access or store private content of any kind.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .contact-breadcrumb {
          max-width: 1000px;
          margin: 0 auto;
          padding: 14px 16px;
          font-size: 13px;
          color: var(--text-muted);
        }
        .contact-breadcrumb a { color: var(--text-muted); text-decoration: none; }
        .contact-breadcrumb a:hover { color: var(--accent); }

        .contact-hero {
          background: linear-gradient(135deg, #00AFF0 0%, #0069a5 100%);
          color: #fff;
          padding: 72px 16px 80px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .contact-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .contact-hero-inner { position: relative; max-width: 720px; margin: 0 auto; }
        .contact-hero h1 { font-size: clamp(2rem, 5vw, 3rem); font-weight: 900; margin: 0 0 16px; text-shadow: 0 2px 8px rgba(0,0,0,0.2); }
        .contact-hero p { font-size: clamp(1rem, 2.2vw, 1.2rem); opacity: 0.93; line-height: 1.7; max-width: 600px; margin: 0 auto; }

        .contact-content { max-width: 1000px; margin: 0 auto; padding: 60px 16px; }

        .contact-grid { display: grid; grid-template-columns: 1fr 1.6fr; gap: 40px; align-items: start; }
        @media (max-width: 768px) { .contact-grid { grid-template-columns: 1fr; } }

        .contact-info { display: flex; flex-direction: column; gap: 20px; }
        .contact-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .contact-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.3); transform: translateY(-2px); }
        .contact-card-icon {
          width: 48px; height: 48px; border-radius: 12px;
          background: linear-gradient(135deg, #00AFF0 0%, #0099D6 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0,175,240,0.3);
        }
        .contact-card-body h3 { font-size: 15px; font-weight: 700; color: var(--text); margin: 0 0 4px; }
        .contact-card-body p { font-size: 13px; color: var(--text-muted); margin: 0 0 6px; line-height: 1.5; }
        .contact-card-body a { font-size: 14px; font-weight: 700; color: var(--accent); text-decoration: none; word-break: break-all; }
        .contact-card-body a:hover { text-decoration: underline; }

        .contact-response-note {
          background: rgba(0,175,240,0.08);
          border: 1px solid rgba(0,175,240,0.25);
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .contact-clock { font-size: 18px; flex-shrink: 0; }
        .contact-response-note span { font-size: 13px; color: var(--text-muted); font-weight: 500; line-height: 1.5; }

        .contact-form-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 36px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        .contact-form-card h2 { font-size: 22px; font-weight: 800; color: var(--text); margin: 0 0 8px; }
        .form-subtitle { font-size: 14px; color: var(--text-muted); margin: 0 0 28px; }

        .form-group { margin-bottom: 20px; }
        .form-label { display: block; font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
        .form-label span { color: #ff3b30; margin-left: 2px; }
        .form-control {
          width: 100%; padding: 12px 16px; border: 2px solid var(--border);
          border-radius: 10px; background: var(--surface-raised); color: var(--text);
          font-size: 15px; font-family: inherit;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          outline: none; box-sizing: border-box;
        }
        .form-control:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(0,175,240,0.15); }
        .form-control::placeholder { color: var(--text-muted); }
        select.form-control {
          cursor: pointer; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237a8399' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px;
        }
        select.form-control option { background: var(--surface-raised); color: var(--text); }
        textarea.form-control { resize: vertical; min-height: 130px; line-height: 1.6; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 500px) { .form-row { grid-template-columns: 1fr; } }

        .submit-btn {
          width: 100%; padding: 14px 24px;
          background: linear-gradient(135deg, #00AFF0 0%, #0099D6 100%);
          color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: 700;
          cursor: pointer; transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(0,175,240,0.35);
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,175,240,0.45); }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .form-success { text-align: center; padding: 32px 0 8px; }
        .form-success-icon { font-size: 48px; margin-bottom: 16px; }
        .form-success p { color: var(--text); font-weight: 600; font-size: 16px; margin: 0; }

        .contact-faq { margin-top: 60px; }
        .contact-faq h2 { font-size: 26px; font-weight: 800; color: var(--text); margin-bottom: 8px; }
        .faq-subtitle { color: var(--text-muted); margin-bottom: 32px; font-size: 15px; }
        .faq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 768px) { .faq-grid { grid-template-columns: 1fr; } }
        .faq-item {
          background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
          padding: 24px; transition: box-shadow 0.2s ease;
        }
        .faq-item:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.25); }
        .faq-item h3 { font-size: 15px; font-weight: 700; color: var(--text); margin: 0 0 10px; line-height: 1.4; }
        .faq-item p { font-size: 14px; color: var(--text-muted); line-height: 1.65; margin: 0; }
        .faq-item a { color: var(--accent); }
        .faq-item a:hover { text-decoration: underline; }
      `}</style>
    </>
  );
}
