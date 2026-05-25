export interface CategoryConfig {
  slug: string;
  label: string;
  terms: string[];
  maxPrice?: number;
  popular?: boolean;
}

function slug(label: string): string {
  return label.toLowerCase().replace(/\s+/g, '-');
}

function termsFor(label: string, overrides?: string[]): string[] {
  const base = new Set<string>();
  const l = label.toLowerCase();
  base.add(l);
  base.add(l.replace(/\s+/g, '-'));
  base.add(l.replace(/\s+/g, ''));
  const words = l.split(/\s+/);
  if (words.length > 1) base.add(words[0]);
  if (overrides) overrides.forEach((v) => base.add(v));
  return Array.from(base).filter(Boolean);
}

const synonymOverrides: Record<string, string[]> = {
  'big-ass': ['big ass', 'big butt', 'booty', 'thick', 'dump truck', 'phat'],
  ass: ['ass', 'booty', 'butt', 'bottom'],
  pawg: ['pawg', 'phat ass white girl', 'phat ass', 'thick white', 'big booty white'],
  'big-tits': ['big tits', 'big boobs', 'large breasts', 'boobs', 'tits'],
  boobs: ['boobs', 'tits', 'breasts'],
  tits: ['tits', 'boobs', 'breasts'],
  'big-natural-boobs': ['big natural boobs', 'natural boobs', 'big naturals', 'natural big boobs', 'natural breasts', 'natural tits', 'big natural', 'bignaturals'],
  milf: ['milf', 'mom', 'hot mom', 'mature mom', 'cougar'],
  mature: ['mature', 'cougar', 'older'],
  ebony: ['ebony', 'black', 'melanin'],
  redhead: ['redhead', 'ginger', 'red hair'],
  blonde: ['blonde', 'blond', 'blonde hair'],
  lesbian: ['lesbian', 'girls only', 'wlw', 'sapphic'],
  gay: ['gay', 'men', 'mlm'],
  trans: ['trans', 'transgender', 'trans woman', 'tg'],
  shemale: ['trans', 'transgender', 'tgirl'],
  feet: ['feet', 'foot', 'toes', 'foot fetish'],
  'foot-fetish': ['foot fetish', 'feet', 'toes'],
  footjob: ['footjob', 'foot job', 'feet'],
  'dick-ratings': ['dick ratings', 'rate my dick', 'rmd', 'rating'],
  blowjobs: ['blowjobs', 'blowjob', 'bj', 'oral'],
  anal: ['anal', 'backdoor'],
  creampie: ['creampie', 'cream pie'],
  handjob: ['handjob', 'hand job', 'hj'],
  asmr: ['asmr', 'audio'],
  instagram: ['instagram', 'ig'],
  twitter: ['twitter', 'x', 'x.com'],
  pornhub: ['pornhub', 'ph'],
  'no-ppv': ['no ppv', 'no pay per view', 'all inclusive'],
  vip: ['vip', 'premium'],
  famous: ['famous', 'celebrity', 'popular'],
  bbw: ['bbw', 'plus size', 'curvy', 'thick'],
  pussy: ['pussy', 'kitty', 'coochie'],
  'pussy-play': ['pussy play', 'coochie play', 'clit play', 'kitty play'],
  pregnant: ['pregnant', 'preggo', 'expecting'],
  deepthroat: ['deepthroat', 'deep throat', 'oral'],
  pegging: ['pegging', 'strap-on', 'strapon'],
  couple: ['couple', 'duo', 'pair'],
  amateur: ['amateur', 'homemade'],
  models: ['models', 'model'],
  sex: ['sex', 'xxx', 'nsfw'],
  nude: ['nude', 'nudity', 'naked'],
  reddit: ['reddit', 'subreddit'],
  girl: ['girl', 'girls', 'babe'],
  male: ['male', 'man', 'men'],
  '18-years-old': ['18 years old', 'teen 18', '18yo', '18+', 'teen 18+', 'barely legal', 'just 18'],
  best: ['best', 'top', 'elite', 'greatest', 'top creator', 'finest'],
  hentai: ['hentai', 'anime', 'cosplay', 'ahegao', 'waifu', 'neko', 'kawaii'],
};

const RAW_LABELS = [
  'nude', 'reddit', 'models', 'sex', 'gay', 'anal', 'feet', 'twitter', 'trans',
  'lesbian', 'squirt', 'couple', 'milf', 'tiktok', 'girl', 'big tits', 'blowjobs', 'boobs',
  'sextape', 'creampie', 'joi', 'threesome', '18 years old', 'shemale', 'bbc', 'tits', 'ebony', 'pornhub',
  'footjob', 'foot fetish', 'dick ratings', 'bbw', 'mature', 'teacher', 'pussy', 'cuckold',
  'big ass', 'squirting', 'hottest', 'best', 'amateur', 'blonde', 'instagram', 'pawg',
  'gangbang', 'redhead', 'male', 'vip', 'famous', 'twins', 'ass', 'deepthroat', 'pregnant',
  'handjob', 'facial', 'asmr', 'pegging', 'no ppv', 'nurse', 'smoking fetish',
  'big natural boobs', 'olympian', 'pussy-play', 'hentai',
];

const POPULAR_SLUGS = new Set([
  'milf', 'lesbian', 'trans', 'feet', 'bbw', 'big-tits', 'amateur', 'ebony',
  'blonde', 'gay', 'anal', 'couple', 'mature', 'ass', 'big-ass',
]);

export const categories: CategoryConfig[] = [
  // Simple categories from raw labels
  ...RAW_LABELS.map((label) => {
    const s = slug(label);
    return {
      slug: s,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      terms: termsFor(label, synonymOverrides[s]),
      popular: POPULAR_SLUGS.has(s),
    };
  }),
  // Compound — goth-free
  {
    slug: 'goth-free',
    label: 'Goth (Free)',
    terms: ['goth', 'gothic'],
    maxPrice: 0,
  },
];

export const popularCategories = categories.filter((c) => c.popular);

export function getCategoryBySlug(slug: string): CategoryConfig | undefined {
  return categories.find((c) => c.slug === slug);
}

export const ALL_CATEGORY_SLUGS = categories.map((c) => c.slug);
