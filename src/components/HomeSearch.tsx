'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSearchHistory, addSearchTerm, removeSearchTerm, clearSearchHistory } from '@/lib/searchHistory';
import SearchHistoryDropdown from './SearchHistoryDropdown';

export default function HomeSearch() {
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => { setHistory(getSearchHistory()); }, []);

  function runSearch(term: string) {
    const clean = term.trim();
    if (!clean) return;
    setHistory(addSearchTerm(clean));
    router.push(`/search?q=${encodeURIComponent(clean)}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(q);
  }

  const showDropdown = focused && q.trim().length === 0;

  return (
    <div style={{ position: 'relative', maxWidth: 520, margin: '20px auto 0' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '6px 6px 6px 16px' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
      {showDropdown && (
        <SearchHistoryDropdown
          history={history}
          onSelect={runSearch}
          onRemove={(term) => setHistory(removeSearchTerm(term))}
          onClear={() => setHistory(clearSearchHistory())}
        />
      )}
    </div>
  );
}
