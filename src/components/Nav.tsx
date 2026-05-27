'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { COUNTRIES_LIST } from '@/config/countries';
import { categories } from '@/config/categories';
import { getWishlist } from '@/lib/wishlist';

const SAFE_SEARCH_KEY = 'safeSearch';

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [countriesOpen, setCountriesOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [q, setQ] = useState('');
  const [safeSearch, setSafeSearch] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const countriesRef = useRef<HTMLDivElement>(null);
  const catsRef = useRef<HTMLDivElement>(null);

  // Load safe search preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAFE_SEARCH_KEY) === 'true';
      setSafeSearch(stored);
      if (stored) document.body.classList.add('safe-search-active');
    } catch {}
  }, []);

  // Sync wishlist badge on mount and whenever wishlistUpdated fires
  useEffect(() => {
    function syncCount() {
      setWishlistCount(getWishlist().length);
    }
    syncCount();
    window.addEventListener('wishlistUpdated', syncCount);
    window.addEventListener('storage', syncCount);
    return () => {
      window.removeEventListener('wishlistUpdated', syncCount);
      window.removeEventListener('storage', syncCount);
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (countriesRef.current && !countriesRef.current.contains(e.target as Node)) {
        setCountriesOpen(false);
      }
      if (catsRef.current && !catsRef.current.contains(e.target as Node)) {
        setCatsOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  function handleSafeSearch() {
    const next = !safeSearch;
    setSafeSearch(next);
    try { localStorage.setItem(SAFE_SEARCH_KEY, next ? 'true' : 'false'); } catch {}
    document.body.classList.toggle('safe-search-active', next);
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="nav-wrapper">
      <div className="nav-top-bar" />
      <div className="nav-inner">
        <Link href="/" className="nav-logo">FansPedia</Link>

        {/* Desktop search */}
        <form onSubmit={handleSearch} className="nav-search-bar" style={{ display: 'flex' }}>
          <button type="submit" aria-label="Search" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </button>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search creators..."
            aria-label="Search creators"
          />
        </form>

        {/* Desktop links */}
        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/" className={`nav-link${isActive('/') ? ' active' : ''}`}>Home</Link>

          {/* Countries dropdown */}
          <div className="nav-dropdown" ref={countriesRef}>
            <button
              className={`nav-link${isActive('/country') ? ' active' : ''}`}
              onClick={() => { setCountriesOpen((v) => !v); setCatsOpen(false); }}
              aria-expanded={countriesOpen}
              aria-haspopup="listbox"
            >
              Countries ▾
            </button>
            {countriesOpen && (
              <div className="nav-dropdown-menu" role="listbox">
                {COUNTRIES_LIST.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/country/${c.slug}/`}
                    className="nav-dropdown-item"
                    onClick={() => setCountriesOpen(false)}
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Categories dropdown */}
          <div className="nav-dropdown" ref={catsRef}>
            <button
              className={`nav-link${isActive('/categories') ? ' active' : ''}`}
              onClick={() => { setCatsOpen((v) => !v); setCountriesOpen(false); }}
              aria-expanded={catsOpen}
              aria-haspopup="listbox"
            >
              Categories ▾
            </button>
            {catsOpen && (
              <div className="nav-dropdown-menu" role="listbox">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/categories/${c.slug}/`}
                    className="nav-dropdown-item"
                    onClick={() => setCatsOpen(false)}
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/locations/" className={`nav-link${isActive('/locations') ? ' active' : ''}`}>Locations</Link>
          <Link href="/blog/" className={`nav-link${isActive('/blog') ? ' active' : ''}`}>Blog</Link>
          <Link href="/wishlist/" className={`nav-link nav-wishlist-link${isActive('/wishlist') ? ' active' : ''}`} aria-label="My wishlist">
            ♥
            {wishlistCount > 0 && (
              <span className="nav-wishlist-badge">{wishlistCount > 99 ? '99+' : wishlistCount}</span>
            )}
          </Link>

          {/* Safe Search toggle */}
          <button
            className={`nav-link nav-safe-search${safeSearch ? ' active' : ''}`}
            onClick={handleSafeSearch}
            aria-label={safeSearch ? 'Disable Safe Search' : 'Enable Safe Search (blur images)'}
            title={safeSearch ? 'Safe Search ON — click to disable' : 'Safe Search OFF — click to enable'}
          >
            {safeSearch ? '🔒' : '👁'}
          </button>
        </nav>

        {/* Mobile burger */}
        <button
          className="nav-burger"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`nav-mobile-menu${mobileOpen ? ' open' : ''}`}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search creators..."
            style={{ flex: 1, background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 14 }}
          />
          <button type="submit" style={{ padding: '8px 16px', background: 'var(--accent-gradient)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            Go
          </button>
        </form>
        {[
          { href: '/', label: 'Home' },
          { href: '/locations/', label: 'Locations' },
          { href: '/categories/', label: 'Categories' },
          { href: '/near-me/', label: 'Near Me' },
          { href: '/wishlist/', label: '♥ Wishlist' },
          { href: '/blog/', label: 'Blog' },
        ].map(({ href, label }) => (
          <Link key={href} href={href} className="nav-mobile-link" onClick={() => setMobileOpen(false)}>
            {label}
          </Link>
        ))}
        <button
          className={`nav-mobile-link nav-mobile-safe-search${safeSearch ? ' active' : ''}`}
          onClick={() => { handleSafeSearch(); setMobileOpen(false); }}
          style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: safeSearch ? 'var(--accent)' : 'var(--text-muted)', padding: '10px 0', fontSize: 16, borderBottom: '1px solid var(--border-subtle)' }}
        >
          {safeSearch ? '🔒 Safe Search ON' : '👁 Safe Search OFF'}
        </button>
      </div>
    </header>
  );
}
