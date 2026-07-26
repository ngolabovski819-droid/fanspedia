// Recent search terms, persisted per-browser via localStorage.
const STORAGE_KEY = 'searchHistory';
const MAX_ENTRIES = 8;

export function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

/** Adds a term to the front of the history (case-insensitive dedupe) and returns the updated list. */
export function addSearchTerm(term: string): string[] {
  const clean = term.trim();
  if (!clean) return getSearchHistory();
  const existing = getSearchHistory().filter((t) => t.toLowerCase() !== clean.toLowerCase());
  const next = [clean, ...existing].slice(0, MAX_ENTRIES);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  return next;
}

export function removeSearchTerm(term: string): string[] {
  const next = getSearchHistory().filter((t) => t.toLowerCase() !== term.toLowerCase());
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  return next;
}

export function clearSearchHistory(): string[] {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  return [];
}
