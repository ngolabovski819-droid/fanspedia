'use client';

import { useState, useEffect } from 'react';

const KEY = 'fanspedia_age_confirmed';

export default function AgeGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function confirm() {
    try { localStorage.setItem(KEY, '1'); } catch {}
    setVisible(false);
  }

  function decline() {
    window.location.href = 'https://www.google.com';
  }

  if (!visible) return null;

  return (
    <div className="age-gate-overlay" role="dialog" aria-modal="true" aria-label="Age verification">
      <div className="age-gate-card">
        <div className="age-gate-logo">FansPedia</div>
        <h2 className="age-gate-title">Adults Only (18+)</h2>
        <p className="age-gate-desc">
          This website contains adult content intended for users aged 18 and older.
          By continuing you confirm you are at least 18 years of age.
        </p>
        <div className="age-gate-buttons">
          <button className="btn-primary" onClick={confirm}>
            I&apos;m 18+ — Enter
          </button>
          <button className="btn-secondary" onClick={decline}>
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
