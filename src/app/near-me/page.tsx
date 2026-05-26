'use client';

import { useState, useEffect } from 'react';
import FilteredCreatorGrid from '@/components/FilteredCreatorGrid';
import type { Creator } from '@/types/creator';

type State = 'idle' | 'locating' | 'fetching' | 'done' | 'denied' | 'error';

interface LocationInfo {
  city?: string;
  country?: string;
  countryCode?: string;
  terms: string[];
  label: string;
}

export default function NearMePage() {
  const [state, setState] = useState<State>('idle');
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  async function reverseGeocode(lat: number, lon: number): Promise<LocationInfo> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) throw new Error('Geocode failed');
    const data = await res.json();
    const country: string = data.address?.country ?? '';
    const city: string = data.address?.city ?? data.address?.town ?? data.address?.state ?? '';
    const countryCode: string = (data.address?.country_code ?? '').toUpperCase();
    const terms: string[] = [];
    if (country) terms.push(country.toLowerCase());
    if (city) terms.push(city.toLowerCase());
    const label = city ? `${city}, ${country}` : country;
    return { city, country, countryCode, terms, label };
  }

  async function fetchNearbyCreators(terms: string[]) {
    const params = new URLSearchParams();
    params.set('category_terms', terms.join(','));
    params.set('skip_location_filter', '1');
    params.set('sort', 'popular');
    params.set('page', '0');
    params.set('page_size', '24');
    const res = await fetch(`/api/search?${params.toString()}`);
    if (!res.ok) throw new Error();
    return res.json() as Promise<{ creators: Creator[]; hasMore: boolean; total: number }>;
  }

  function requestLocation() {
    setState('locating');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          setState('fetching');
          const locInfo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setLocation(locInfo);
          const data = await fetchNearbyCreators(locInfo.terms);
          setCreators(data.creators);
          setHasMore(data.hasMore);
          setTotal(data.total);
          setState('done');
        } catch {
          setState('error');
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState('denied');
        } else {
          setState('error');
        }
      },
      { timeout: 10000 }
    );
  }

  return (
    <>
      <section className="page-hero">
        <h1>OnlyFans Creators Near Me</h1>
        <p>Find creators from your country and city using your device location.</p>
      </section>

      {state === 'idle' && (
        <div className="near-me-prompt">
          <div className="near-me-icon">📍</div>
          <h2>Allow location access</h2>
          <p>FansPedia will use your approximate location to find creators from your country and city. Your location is never stored.</p>
          <button className="btn-primary near-me-btn" onClick={requestLocation}>
            Find Creators Near Me
          </button>
        </div>
      )}

      {state === 'locating' && (
        <div className="near-me-prompt">
          <div className="near-me-icon near-me-spin">📍</div>
          <p style={{ color: 'var(--text-muted)' }}>Getting your location…</p>
        </div>
      )}

      {state === 'fetching' && (
        <div className="near-me-prompt">
          <div className="near-me-icon near-me-spin">🔍</div>
          <p style={{ color: 'var(--text-muted)' }}>Finding creators near you…</p>
        </div>
      )}

      {state === 'denied' && (
        <div className="near-me-prompt">
          <div className="near-me-icon">🚫</div>
          <h2>Location access denied</h2>
          <p>Please allow location access in your browser settings and try again.</p>
          <button className="btn-primary near-me-btn" onClick={requestLocation}>
            Try Again
          </button>
        </div>
      )}

      {state === 'error' && (
        <div className="near-me-prompt">
          <div className="near-me-icon">⚠️</div>
          <h2>Something went wrong</h2>
          <p>We couldn&apos;t determine your location. Please try again.</p>
          <button className="btn-primary near-me-btn" onClick={requestLocation}>
            Try Again
          </button>
        </div>
      )}

      {state === 'done' && location && (
        <>
          <div style={{ textAlign: 'center', margin: '8px 0 24px', color: 'var(--text-muted)', fontSize: 14 }}>
            📍 Showing results for <strong style={{ color: 'var(--text)' }}>{location.label}</strong>
          </div>
          {creators.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
              No creators found near your location yet. Try{' '}
              <a href="/" style={{ color: 'var(--accent)' }}>browsing by category</a> instead.
            </div>
          ) : (
            <FilteredCreatorGrid
              initialCreators={creators}
              initialHasMore={hasMore}
              initialTotal={total}
              categoryTerms={location.terms}
              skipLocationFilter
            />
          )}
        </>
      )}
    </>
  );
}
