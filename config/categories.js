/**
 * categories.js
 * Single source of truth for all OnlyFans categories
 * Used by: categories.html, category.html, sitemap generator
 */

export const categories = [
  'nude', 'reddit', 'models', 'sex', 'gay', 'anal', 'feet', 'twitter', 'asian', 'trans', 'indian',
  'lesbian', 'squirt', 'korean', 'couple', 'milf', 'tiktok', 'girl', 'cosplay', 'big tits', 'blowjobs', 'boobs',
  'sextape', 'creampie', 'joi', 'threesome', 'teen (18+)', 'shemale', 'bbc', 'tits', 'ebony', 'pornhub',
  'footjob', 'foot fetish', 'bbw', 'mature', 'teacher', 'pussy', 'scottish', 'cuckold', 'big ass', 'squirting', 'hottest',
  'amateur', 'blonde', 'japanese', 'instagram', 'pawg', 'gangbang', 'redhead', 'male', 'vip', 'famous',
  'twins', 'ass', 'deepthroat', 'pregnant', 'handjob', 'facial', 'asmr', 'pegging', 'no ppv', 'nurse'
];

// Popular categories for header dropdown and mobile drawer (order matters for UX)
export const popularCategories = [
  'milf',
  'big ass',
  'ebony',
  'asian',
  'cosplay',
  'big tits',
  'redhead',
  'lesbian',
  'bbw',
  'pawg',
  'foot fetish'
];

// Convert category name to URL slug
export function categoryToSlug(category) {
  return category.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
}

// Convert slug back to display label
export function slugToLabel(slug) {
  return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
