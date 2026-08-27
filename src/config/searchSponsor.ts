/**
 * Sponsored slots pinned at the top of the search-history dropdown
 * (src/components/SearchHistoryDropdown.tsx). Use an empty array to disable —
 * the dropdown then falls back to showing only real recent searches.
 *
 * Creator card images/names are pulled live from `onlyfans_profiles` via
 * /api/sponsor-preview; the outbound link/click-tracking come from the same
 * `SPONSOR_OVERRIDES` entry in src/config/sponsors.ts used everywhere else.
 */
export const SEARCH_SPONSOR_USERNAMES = ['cosplaytsumiko', 'rocketreynaxo', 'rinayanami'];
