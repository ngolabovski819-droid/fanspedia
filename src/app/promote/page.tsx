import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Promote Your OnlyFans — Get Real Subscribers from Google | FansPedia",
  description: "Feature your OnlyFans profile on FansPedia and reach fans who are actively searching on Google. High-intent SEO traffic that converts. Get started today.",
  alternates: { canonical: "https://fanspedia.net/promote/" },
};

export default function PromotePage() {
  return <PromoteContent />;
}

function PromoteContent() {
  const steps = [
    { n: "1", title: "Submit Your Profile", body: "Send us your OnlyFans username and the categories or niches you want to be featured in. We review every submission to ensure quality." },
    { n: "2", title: "We Optimize Your Listing", body: "Our team crafts your profile placement for maximum visibility — right categories, right keywords, right pages that already rank on Google page one." },
    { n: "3", title: "Go Live in 24 Hours", body: "Your profile goes live on FansPedia within 24 hours. You immediately start appearing in front of fans searching for creators like you." },
    { n: "4", title: "Watch Subscribers Grow", body: "Fans discover your profile through Google search, click through, and subscribe. Track your growth via OnlyFans analytics — no extra tools needed." },
  ];
  const whyCards = [
    { icon: "🎯", title: "High-Intent Audience", body: "Someone typing best fitness OnlyFans or free OnlyFans near me into Google is not casually scrolling. They are actively looking to subscribe and spend money right now." },
    { icon: "📈", title: "Consistent, Predictable Traffic", body: "Unlike viral social posts that spike and die, SEO traffic is consistent month after month. Your featured listing keeps delivering new fans without ongoing effort from you." },
    { icon: "🛡️", title: "100% Safe & Compliant", body: "We never touch your OnlyFans account. We simply feature your public profile on our directory pages — the same way any editorial recommendation site would. No ToS risks." },
    { icon: "👥", title: "Fans Who Stick Around", body: "SEO-sourced fans spend more per month, renew subscriptions at higher rates, and engage more in DMs. Quality over quantity — fans who actually pay." },
    { icon: "📍", title: "Niche & Location Targeting", body: "FansPedia organizes by category, niche, and location. Your profile reaches exactly the right audience — fitness fans, cosplay lovers, fans in your city — not just random clicks." },
    { icon: "⏰", title: "No Ongoing Work Required", body: "Post your content on OnlyFans as normal. We handle the promotion. Your listing runs 24/7 without requiring constant social media activity from your side." },
  ];
  const campaigns = [
    { fans: 300, maxFans: 300, subs: 47, chats: 156, revenue: 10591, gain: 21, spend: 450, added: 300, arpu: "$35.30", romi: "1,946%", ago: "5m 27s" },
    { fans: 300, maxFans: 300, subs: 47, chats: 134, revenue: 10477, gain: 0,  spend: 405, added: 300, arpu: "$34.92", romi: "2,111%", ago: "17m 54s" },
    { fans: 200, maxFans: 200, subs: 14, chats: 51,  revenue: 3042,  gain: 0,  spend: 300, added: 200, arpu: "$15.21", romi: "805%",   ago: "23m 53s" },
    { fans: 100, maxFans: 100, subs: 5,  chats: 22,  revenue: 1515,  gain: 0,  spend: 150, added: 100, arpu: "$15.15", romi: "763%",   ago: "39m 53s" },
    { fans: 300, maxFans: 300, subs: 24, chats: 190, revenue: 2706,  gain: 240,spend: 450, added: 300, arpu: "$9.02",  romi: "423%",   ago: "1h 6m" },
    { fans: 201, maxFans: 200, subs: 19, chats: 88,  revenue: 1484,  gain: 0,  spend: 300, added: 200, arpu: "$7.38",  romi: "312%",   ago: "17m 57s" },
  ];
  const faqs = [
    { q: "Is it safe? Will this violate OnlyFans Terms of Service?", a: "Completely safe. FansPedia is an independent directory site. We feature your public OnlyFans profile on our pages — the same way any editorial recommendation site or magazine would. We never access your account, never touch your login credentials, and never use bots. Fans discover you through our site, then choose to subscribe on their own." },
    { q: "Do I need to give you my OnlyFans password?", a: "Never. We only need your public OnlyFans username. Your account credentials stay entirely private and under your control at all times." },
    { q: "How quickly will I go live?", a: "Most profiles are live within 24 hours of payment and a quick onboarding chat. We verify your profile, select the best categories for targeting, and publish your listing." },
    { q: "How is this different from buying fake followers?", a: "Completely different. Fake follower services deliver bot accounts that never spend money. FansPedia drives real people from Google search to your OnlyFans page. These are genuine fans with intent to subscribe — not inflated numbers." },
    { q: "Can agencies promote multiple creators?", a: "Yes. Many of our partners are agencies managing multiple creator accounts. We offer bulk pricing, a dedicated account manager, and unified analytics. Contact us for a custom quote." },
    { q: "What niches and categories does FansPedia cover?", a: "FansPedia covers hundreds of categories — fitness, cosplay, MILF, free OnlyFans, location-based searches, and many more. Whatever your niche, we have category and search pages already ranking on Google." },
    { q: "What results can I expect?", a: "Results vary based on your niche, content quality, pricing, and engagement. Creators with well-optimized profiles and strong content libraries typically see the fastest growth. We recommend at least 20 posts live before going live." },
  ];
  return (
    <>
      <nav className="promo-breadcrumb" aria-label="Breadcrumb">
        <a href="/">🏠 Home</a><span aria-hidden="true"> / </span><span aria-current="page">Promote Your OnlyFans</span>
      </nav>
      <section className="promo-hero">
        <div className="promo-hero-inner">
          <div className="promo-eyebrow">For Creators &amp; Agencies</div>
          <h1>Promote Your OnlyFans and Get <span className="promo-yellow">Real Paying Fans</span> from Google</h1>
          <p className="promo-hero-sub">FansPedia reaches millions of fans who search Google for creators every month. Get your profile featured in front of high-intent audiences who are ready to subscribe.</p>
          <div className="promo-cta-wrap">
            <div className="promo-urgency"><span className="promo-dot" /> 3 spots left this week — filling fast</div>
            <a href="https://form.typeform.com/to/rkipgsyL" target="_blank" rel="noopener noreferrer" className="promo-hero-cta">🚀 Claim Your Spot — Go Live in 24h</a>
            <p className="promo-hero-note">No password required &nbsp;·&nbsp; Free to apply &nbsp;·&nbsp; Real Google traffic</p>
          </div>
        </div>
      </section>
      <div className="promo-stats-bar">
        <div className="promo-stats-grid">
          <div className="promo-stat"><div className="promo-stat-num">2M+</div><div className="promo-stat-label">Monthly Visitors</div></div>
          <div className="promo-stat"><div className="promo-stat-num">100K+</div><div className="promo-stat-label">Creator Profiles</div></div>
          <div className="promo-stat"><div className="promo-stat-num">Top 3</div><div className="promo-stat-label">Google Rankings</div></div>
        </div>
      </div>
      <section className="promo-section">
        <div className="promo-inner">
          <div className="promo-eyebrow-sm">Simple Process</div>
          <h2 className="promo-section-title">How Promoting on FansPedia Works</h2>
          <p className="promo-section-lead">Getting your profile in front of motivated fans takes less than 24 hours. No technical setup, no passwords — just results.</p>
          <div className="promo-steps-grid">
            {steps.map((s) => (
              <div key={s.n} className="promo-step-card">
                <div className="promo-step-num">{s.n}</div>
                <div className="promo-step-title">{s.title}</div>
                <div className="promo-step-body">{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="promo-section promo-section-alt">
        <div className="promo-inner">
          <div className="promo-eyebrow-sm">Why It Works</div>
          <h2 className="promo-section-title">Why SEO Traffic Converts Better Than Social Media</h2>
          <p className="promo-section-lead">Not all traffic is equal. Fans who find you through Google are actively searching for a creator to subscribe to — they already have their wallet out.</p>
          <div className="promo-why-grid">
            {whyCards.map((w) => (
              <div key={w.title} className="promo-why-card">
                <div className="promo-why-icon">{w.icon}</div>
                <div><div className="promo-why-title">{w.title}</div><div className="promo-why-body">{w.body}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="promo-section">
        <div className="promo-inner">
          <div className="promo-eyebrow-sm">Traffic Comparison</div>
          <h2 className="promo-section-title">FansPedia vs Other Promotion Channels</h2>
          <p className="promo-section-lead">See how SEO directory traffic stacks up against the most common alternatives creators use.</p>
          <div style={{overflowX:"auto"}}>
            <table className="promo-table">
              <thead><tr><th>Channel</th><th>Subscriber Conversion</th><th>Fan Spend Quality</th><th>Consistency</th></tr></thead>
              <tbody>
                <tr className="promo-table-hl"><td><strong>FansPedia SEO</strong></td><td><span className="bg-good">25–35%</span></td><td><span className="bg-good">High — long retention</span></td><td><span className="bg-good">Consistent monthly</span></td></tr>
                <tr><td>Reddit Promotion</td><td><span className="bg-mid">5–15%</span></td><td><span className="bg-mid">Mixed, often free-seekers</span></td><td><span className="bg-mid">Spiky, short-lived</span></td></tr>
                <tr><td>Twitter / X Drops</td><td><span className="bg-bad">3–10%</span></td><td><span className="bg-bad">Low spend, high churn</span></td><td><span className="bg-bad">Days to weeks</span></td></tr>
                <tr><td>Instagram Shoutouts</td><td><span className="bg-mid">5–12%</span></td><td><span className="bg-mid">Moderate spend</span></td><td><span className="bg-mid">Weeks only</span></td></tr>
                <tr><td>Bought Followers</td><td><span className="bg-bad">0%</span></td><td><span className="bg-bad">Bots — zero spend</span></td><td><span className="bg-bad">Negative ROI</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <section className="promo-section promo-section-alt">
        <div className="promo-inner">
          <div className="promo-eyebrow-sm">Proof It Works</div>
          <h2 className="promo-section-title">Live Campaign Feed</h2>
          <p className="promo-section-lead" style={{marginBottom:"32px"}}>Updated in real time — exactly what our partners saw: fans gained, revenue, and ROMI.</p>
          <div className="promo-feed">
            {campaigns.map((c, i) => {
              const pct = Math.round((c.fans / c.maxFans) * 100);
              return (
                <div key={i} className="promo-feed-card">
                  <div className="promo-feed-bar-wrap">
                    <div className="promo-feed-bar-fill" style={{width:`${pct}%`}} />
                    <div className="promo-feed-bar-lbl">{c.fans} / {c.maxFans} fans</div>
                  </div>
                  <div className="promo-feed-stats">
                    <span className="promo-pill">👥 {c.fans}</span>
                    <span className="promo-pill promo-pill-blue">✅ {c.subs} 💬 {c.chats}</span>
                    <span className="promo-pill">✉️ ${c.revenue.toLocaleString()}{c.gain > 0 && <span style={{color:"#22a24a"}}> +${c.gain}</span>}</span>
                    <span className="promo-pill promo-pill-green">💵 ${c.spend.toFixed(2)}</span>
                    <span className="promo-pill">⬆️ +{c.added}</span>
                  </div>
                  <div className="promo-feed-metrics">
                    <div><div className="promo-mlabel">ARPU</div><div className="promo-mval">{c.arpu}</div></div>
                    <div><div className="promo-mlabel">ROMI</div><div className="promo-mromi">{c.romi}</div></div>
                    <div className="promo-mago">🔄 {c.ago} ago</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{textAlign:"center",marginTop:"32px"}}>
            <a href="https://form.typeform.com/to/rkipgsyL" target="_blank" rel="noopener noreferrer" className="promo-hero-cta" style={{display:"inline-flex"}}>🚀 Start Your Campaign</a>
          </div>
        </div>
      </section>
      <section className="promo-section">
        <div className="promo-inner">
          <div className="promo-eyebrow-sm">FAQ</div>
          <h2 className="promo-section-title">Frequently Asked Questions</h2>
          <div className="promo-faq-list">
            {faqs.map((f) => (
              <details key={f.q} className="promo-faq-item">
                <summary className="promo-faq-q">{f.q} <span className="promo-faq-icon">＋</span></summary>
                <div className="promo-faq-a">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>
      <div className="promo-bottom-cta">
        <h2>Ready to Grow Your OnlyFans?</h2>
        <p>Join thousands of creators already getting discovered by high-intent fans through FansPedia every day.</p>
        <a href="https://form.typeform.com/to/rkipgsyL" target="_blank" rel="noopener noreferrer" className="promo-bottom-btn">🚀 Get Featured Today</a>
      </div>
      <style>{`
        .promo-breadcrumb{max-width:1100px;margin:0 auto;padding:14px 20px;font-size:13px;color:var(--text-muted)}
        .promo-breadcrumb a{color:var(--text-muted);text-decoration:none}
        .promo-breadcrumb a:hover{color:var(--accent)}
        .promo-hero{background:linear-gradient(135deg,#00AFF0 0%,#0099D6 60%,#007ab8 100%);color:#fff;padding:80px 16px 72px;text-align:center;position:relative;overflow:hidden}
        .promo-hero::before{content:'';position:absolute;inset:0;background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")}
        .promo-hero-inner{position:relative;max-width:800px;margin:0 auto}
        .promo-eyebrow{display:inline-block;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.35);border-radius:50px;padding:6px 18px;font-size:13px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:24px}
        .promo-hero h1{font-size:clamp(28px,5vw,52px);font-weight:900;line-height:1.15;margin-bottom:20px;text-shadow:0 2px 8px rgba(0,0,0,0.2)}
        .promo-yellow{color:#ffe44d}
        .promo-hero-sub{font-size:clamp(16px,2.5vw,20px);opacity:.92;max-width:680px;margin:0 auto 36px;line-height:1.6}
        .promo-cta-wrap{display:flex;flex-direction:column;align-items:center;gap:10px}
        @keyframes promoPulse{0%,100%{box-shadow:0 8px 32px rgba(0,0,0,0.2),0 0 0 0 rgba(255,255,255,0.55)}60%{box-shadow:0 8px 32px rgba(0,0,0,0.2),0 0 0 18px rgba(255,255,255,0)}}
        @keyframes promoBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        .promo-hero-cta{display:inline-flex;align-items:center;gap:12px;background:#fff;color:#0099D6;border-radius:50px;padding:18px 44px;font-size:20px;font-weight:900;text-decoration:none;box-shadow:0 8px 32px rgba(0,0,0,0.2);animation:promoPulse 2s infinite,promoBounce 3.5s ease-in-out infinite;letter-spacing:0.3px;border:3px solid rgba(255,255,255,0.6);transition:all 0.2s ease}
        .promo-hero-cta:hover{transform:translateY(-4px) scale(1.04);box-shadow:0 16px 48px rgba(0,0,0,0.28);color:#007ab8;animation:none}
        .promo-urgency{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.4);border-radius:50px;padding:5px 14px;font-size:12px;font-weight:700;color:#fff;letter-spacing:0.5px}
        .promo-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#ffe44d;box-shadow:0 0 6px #ffe44d;flex-shrink:0}
        .promo-hero-note{margin-top:8px;font-size:13px;opacity:.8}
        .promo-stats-bar{background:var(--surface);border-bottom:1px solid var(--border);padding:28px 16px}
        .promo-stats-grid{max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr)}
        .promo-stat{text-align:center;padding:0 20px;border-right:1px solid var(--border)}
        .promo-stat:last-child{border-right:none}
        .promo-stat-num{font-size:clamp(28px,4vw,40px);font-weight:900;color:var(--accent);line-height:1;margin-bottom:6px}
        .promo-stat-label{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted)}
        .promo-section{padding:72px 16px}
        .promo-section-alt{background:var(--surface)}
        .promo-inner{max-width:1100px;margin:0 auto}
        .promo-eyebrow-sm{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--accent);margin-bottom:12px}
        .promo-section-title{font-size:clamp(24px,3.5vw,38px);font-weight:900;color:var(--text);margin-bottom:16px;line-height:1.2}
        .promo-section-lead{font-size:17px;color:var(--text-muted);line-height:1.7;max-width:700px;margin-bottom:48px}
        .promo-steps-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:28px}
        .promo-step-card{background:var(--bg);border:1px solid var(--border);border-radius:16px;padding:28px 24px;transition:box-shadow .2s ease,transform .2s ease}
        .promo-step-card:hover{box-shadow:0 8px 32px rgba(0,175,240,0.12);transform:translateY(-4px)}
        .promo-step-num{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#00AFF0,#0099D6);color:#fff;font-size:18px;font-weight:900;display:flex;align-items:center;justify-content:center;margin-bottom:18px}
        .promo-step-title{font-size:17px;font-weight:800;color:var(--text);margin-bottom:10px}
        .promo-step-body{font-size:14px;color:var(--text-muted);line-height:1.65}
        .promo-why-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}
        .promo-why-card{background:var(--bg);border:1px solid var(--border);border-radius:16px;padding:28px 24px;display:flex;gap:18px;align-items:flex-start;transition:box-shadow .2s ease}
        .promo-why-card:hover{box-shadow:0 6px 24px rgba(0,175,240,0.1)}
        .promo-why-icon{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#00AFF0,#0099D6);font-size:22px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(0,175,240,0.3)}
        .promo-why-title{font-size:16px;font-weight:800;color:var(--text);margin-bottom:6px}
        .promo-why-body{font-size:14px;color:var(--text-muted);line-height:1.6}
        .promo-table{width:100%;border-collapse:collapse;margin-top:32px;border-radius:16px;overflow:hidden}
        .promo-table th{background:linear-gradient(135deg,#00AFF0,#0099D6);color:#fff;padding:16px 20px;font-size:14px;font-weight:700;text-align:left}
        .promo-table th:first-child{width:40%}
        .promo-table td{padding:14px 20px;font-size:14px;color:var(--text);border-bottom:1px solid var(--border)}
        .promo-table tr:last-child td{border-bottom:none}
        .promo-table tr:nth-child(even) td{background:var(--bg)}
        .promo-table-hl td{font-weight:700;color:var(--accent)}
        .bg-good{display:inline-block;background:rgba(52,199,89,0.15);color:#34c759;border-radius:6px;padding:2px 10px;font-size:12px;font-weight:700}
        .bg-mid{display:inline-block;background:rgba(255,159,10,0.15);color:#ff9f0a;border-radius:6px;padding:2px 10px;font-size:12px;font-weight:700}
        .bg-bad{display:inline-block;background:rgba(255,59,48,0.12);color:#ff3b30;border-radius:6px;padding:2px 10px;font-size:12px;font-weight:700}
        .promo-feed{display:flex;flex-direction:column;gap:14px}
        .promo-feed-card{background:var(--bg);border:1px solid var(--border);border-radius:14px;overflow:hidden}
        .promo-feed-bar-wrap{background:#444;height:28px;position:relative;overflow:hidden}
        .promo-feed-bar-fill{height:100%;background:linear-gradient(90deg,#00AFF0,#0099D6)}
        .promo-feed-bar-lbl{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;letter-spacing:.4px}
        .promo-feed-stats{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:12px 16px 4px;font-size:13px}
        .promo-pill{display:inline-flex;align-items:center;gap:4px;background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:3px 10px;font-weight:600;font-size:13px}
        .promo-pill-blue{background:rgba(0,175,240,0.1);border-color:rgba(0,175,240,0.3);color:#0099D6}
        .promo-pill-green{background:rgba(52,199,89,0.1);border-color:rgba(52,199,89,0.3);color:#22a24a}
        .promo-feed-metrics{display:flex;align-items:center;gap:20px;padding:6px 16px 12px;font-size:14px}
        .promo-mlabel{color:var(--text-muted);font-size:12px}
        .promo-mval{font-weight:800;color:var(--text);font-size:15px}
        .promo-mromi{font-weight:800;font-size:15px;color:#22a24a}
        .promo-mago{margin-left:auto;font-size:11px;color:var(--text-muted)}
        .promo-faq-list{display:flex;flex-direction:column;gap:12px;margin-top:36px}
        .promo-faq-item{background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden}
        .promo-faq-q{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;cursor:pointer;font-weight:700;font-size:16px;color:var(--text);gap:12px;user-select:none;list-style:none}
        .promo-faq-q::-webkit-details-marker{display:none}
        .promo-faq-icon{color:var(--accent);font-size:20px;flex-shrink:0;transition:transform 0.25s ease;line-height:1}
        .promo-faq-item[open] .promo-faq-icon{transform:rotate(45deg)}
        .promo-faq-a{padding:0 24px 20px;font-size:15px;color:var(--text-muted);line-height:1.7}
        .promo-bottom-cta{background:linear-gradient(135deg,#00AFF0 0%,#0099D6 100%);color:#fff;padding:80px 20px;text-align:center}
        .promo-bottom-cta h2{font-size:clamp(24px,4vw,42px);font-weight:900;margin-bottom:16px}
        .promo-bottom-cta p{font-size:18px;opacity:.9;max-width:560px;margin:0 auto 36px;line-height:1.6}
        .promo-bottom-btn{display:inline-flex;align-items:center;gap:10px;background:#fff;color:#0099D6;border-radius:50px;padding:16px 40px;font-size:18px;font-weight:800;text-decoration:none;box-shadow:0 8px 32px rgba(0,0,0,0.2);transition:all 0.3s ease}
        .promo-bottom-btn:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,0.25);color:#007ab8}
        @media(max-width:768px){.promo-section{padding:48px 16px}.promo-table{font-size:12px}.promo-table th,.promo-table td{padding:10px 12px}}
      `}</style>
    </>
  );
}