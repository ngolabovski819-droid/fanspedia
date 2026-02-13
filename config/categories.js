/**
 * categories.js
 * Single source of truth for all OnlyFans categories
 * Used by: categories.html, category.html, sitemap generator
 */

export const categories = [
  // NOTE: Location/nationality terms (indian, japanese, korean, scottish, asian) removed.
  // Future geo taxonomy will live separately (e.g. /locations/<country>) to avoid mixing topical vs geographic facets.
  'nude', 'reddit', 'models', 'sex', 'gay', 'anal', 'feet', 'twitter', 'trans',
  'lesbian', 'squirt', 'couple', 'milf', 'tiktok', 'girl', 'big tits', 'blowjobs', 'boobs',
  'sextape', 'creampie', 'joi', 'threesome', 'teen (18+)', 'shemale', 'bbc', 'tits', 'ebony', 'pornhub',
  'footjob', 'foot fetish', 'dick ratings', 'bbw', 'mature', 'teacher', 'pussy', 'cuckold', 'big ass', 'squirting', 'hottest',
  'amateur', 'blonde', 'instagram', 'pawg', 'gangbang', 'redhead', 'male', 'vip', 'famous',
  'twins', 'ass', 'deepthroat', 'pregnant', 'handjob', 'facial', 'asmr', 'pegging', 'no ppv', 'nurse', 'smoking fetish', 'goth-free',
  'big natural boobs', 'olympian', 'pussy-play'
];

// Compound categories: special categories that combine search terms with automatic filters
// Format: { slug: { searchTerm, filters: { verified?, bundles?, maxPrice? } } }
export const compoundCategories = {
  'goth-free': {
    searchTerm: 'goth',
    // Keep synonyms tight to avoid false positives
    synonyms: ['goth', 'gothic'],
    filters: { maxPrice: 0 },
    displayLabel: 'Goth (Free)'
  }
};

// Domain-specific synonym overrides for better recall. Keys are category labels (human-readable) or slugs.
const synonymsOverrides = {
  'big ass': ['big ass','big butt','booty','thick','dump truck','phat'],
  'ass': ['ass','booty','butt','bottom'],
  'pawg': ['pawg','phat ass white girl','phat ass','thick white','big booty white'],
  'big tits': ['big tits','big boobs','large breasts','boobs','tits'],
  'boobs': ['boobs','tits','breasts'],
  'tits': ['tits','boobs','breasts'],
  'big natural boobs': ['big natural boobs','natural boobs','big naturals','natural big boobs','natural breasts','natural tits','big natural','bignaturals'],
  'big-natural-boobs': ['big natural boobs','natural boobs','big naturals','natural big boobs','natural breasts','natural tits','big natural','bignaturals'],
  'milf': ['milf','mom','hot mom','mature mom','cougar'],
  'mature': ['mature','cougar','older'],
  'ebony': ['ebony','black','melanin'],
  // 'asian' override removed with category; will live under future geo taxonomy.
  'redhead': ['redhead','ginger','red hair'],
  'blonde': ['blonde','blond','blonde hair'],
  'lesbian': ['lesbian','girls only','wlw','sapphic'],
  'gay': ['gay','men','mlm'],
  'trans': ['trans','transgender','trans woman','tg'],
  'shemale': ['trans','transgender','tgirl'],
  'feet': ['feet','foot','toes','foot fetish'],
  'foot fetish': ['foot fetish','feet','toes'],
  'footjob': ['footjob','foot job','feet'],
  'dick ratings': ['dick ratings','rate my dick','rmd','rating'],
  'blowjobs': ['blowjobs','blowjob','bj','oral'],
  'anal': ['anal','backdoor'],
  'creampie': ['creampie','cream pie'],
  'handjob': ['handjob','hand job','hj'],
  'asmr': ['asmr','audio'],
  'instagram': ['instagram','ig'],
  'twitter': ['twitter','x','x.com'],
  'pornhub': ['pornhub','ph'],
  'no ppv': ['no ppv','no pay per view','all inclusive'],
  'vip': ['vip','premium'],
  'famous': ['famous','celebrity','popular'],
  'bbw': ['bbw','plus size','curvy','thick'],
  'pussy': ['pussy','kitty','coochie'],
  'pussy-play': ['pussy play','pussy','kitty','coochie','clit','clit play'],
  'pregnant': ['pregnant','preggo','expecting'],
  'deepthroat': ['deepthroat','deep throat','oral'],
  'pegging': ['pegging','strap-on','strapon'],
  'couple': ['couple','duo','pair'],
  'amateur': ['amateur','homemade'],
  'vip': ['vip','exclusive'],
  'models': ['models','model'],
  'sex': ['sex','xxx','nsfw'],
  'nude': ['nude','nudity','naked'],
  'reddit': ['reddit','subreddit'],
  'girl': ['girl','girls','babe'],
  'male': ['male','man','men']
};

function normalizeTerm(s){
  return String(s || '').trim();
}

function baseVariants(label){
  const variants = new Set();
  const l = normalizeTerm(label);
  if (!l) return [];
  variants.add(l);
  variants.add(l.toLowerCase());
  variants.add(l.replace(/\s+/g,'-'));
  variants.add(l.replace(/\s+/g,''));
  const words = l.split(/\s+/);
  if (words.length > 1) variants.add(words[0]);
  return Array.from(variants).filter(Boolean);
}

export const synonymsMap = (() => {
  const map = {};
  for (const cat of categories) {
    const slug = categoryToSlug(cat);
    const set = new Set(baseVariants(cat));
    const override = synonymsOverrides[cat] || synonymsOverrides[slug];
    if (override) override.forEach(v => set.add(normalizeTerm(v)));
    map[slug] = Array.from(set).filter(Boolean);
  }
  // Include compound category synonyms as well (by slug)
  Object.entries(compoundCategories || {}).forEach(([slug, def]) => {
    const arr = Array.isArray(def.synonyms) ? def.synonyms : [def.searchTerm].filter(Boolean);
    if (!map[slug]) map[slug] = [];
    arr.forEach(v => map[slug].push(normalizeTerm(v)));
    map[slug] = Array.from(new Set(map[slug].filter(Boolean)));
  });
  return map;
})();

// Popular categories for header dropdown and mobile drawer (order matters for UX)
export const popularCategories = [
  'milf',
  'big ass',
  'ebony',
  'big tits',
  'redhead',
  'lesbian',
  'bbw',
  'pawg',
  'foot fetish',
  'dick ratings',
  'pussy-play'
];

// Convert category name to URL slug
export function categoryToSlug(category) {
  return category.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
}

// Convert slug back to display label
export function slugToLabel(slug) {
  return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
