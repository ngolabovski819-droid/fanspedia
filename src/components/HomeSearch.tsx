'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeSearch() {
  const [q, setQ] = useState('');
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 520, margin: '20px auto 0', display: 'flex', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '6px 6px 6px 16px' }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, category, location…"
        aria-label="Search creators"
        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 16 }}
      />
      <button
        type="submit"
        style={{ padding: '10px 20px', background: 'var(--accent-gradient)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        Search
      </button>
    </form>
  );
}
