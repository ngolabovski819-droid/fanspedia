/**
 * Allow-list of creators whose pages are published at /creator/{username}/.
 *
 * The creator page is a TEMPLATE — it works for any username technically, but
 * we only make a page LIVE when explicitly added here. Anything not in this list
 * returns 404. To publish a creator, add their exact OnlyFans username (the
 * `username` column, case-insensitive) below, then commit + push.
 *
 * Example:
 *   export const PUBLISHED_CREATORS = ['thatfatgemini', 'britishbeautxo'];
 */
export const PUBLISHED_CREATORS: string[] = ['thatfatgemini', 'littlelanacat', 'anastasiaplays'];

const PUBLISHED_SET = new Set(PUBLISHED_CREATORS.map((u) => u.toLowerCase()));

/** True when a creator page should be served for this username. */
export function isPublishedCreator(username: string): boolean {
  return PUBLISHED_SET.has(username.trim().toLowerCase());
}
