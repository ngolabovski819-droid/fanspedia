const KEY = 'favorites';

export function getWishlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY) ?? '[]';
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function isWishlisted(username: string): boolean {
  return getWishlist().includes(username);
}

export function toggleWishlist(username: string): boolean {
  const list = getWishlist();
  const set = new Set(list);
  if (set.has(username)) {
    set.delete(username);
  } else {
    set.add(username);
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(Array.from(set)));
  } catch {}
  return set.has(username);
}
