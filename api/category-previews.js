/**
 * /api/category-previews
 *
 * Returns one avatar URL per category slug — replaces 16 separate /api/search
 * calls from the homepage carousel with a single request.
 *
 * Server-side parallel queries run close to Supabase (~5ms each vs ~200ms
 * from the browser). Result is CDN-cached for 1 hour so most users never
 * trigger a DB hit at all.
 */

const CATEGORIES = [
  { slug: 'big-ass',   terms: ['big ass']  },
  { slug: 'big-tits',  terms: ['big tits'] },
  { slug: 'milf',      terms: ['milf']     },
  { slug: 'pawg',      terms: ['pawg']     },
  { slug: 'ebony',     terms: ['ebony']    },
  { slug: 'bbw',       terms: ['bbw']      },
  { slug: 'blonde',    terms: ['blonde']   },
  { slug: 'redhead',   terms: ['redhead']  },
  { slug: 'lesbian',   terms: ['lesbian']  },
  { slug: 'trans',     terms: ['trans']    },
  { slug: 'feet',      terms: ['feet']     },
  { slug: 'amateur',   terms: ['amateur']  },
  { slug: 'squirt',    terms: ['squirt']   },
  { slug: 'goth-free', terms: ['goth']     },
  { slug: 'blowjobs',  terms: ['blowjob']  },
  { slug: 'anal',      terms: ['anal']     },
];

// In-memory cache — serverless instances reuse this within their lifetime
let _cache = null;
let _cacheTs = 0;
const CACHE_TTL = 3600 * 1000; // 1 hour

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  // Serve from in-process cache if warm
  if (_cache && Date.now() - _cacheTs < CACHE_TTL) {
    return res.status(200).json(_cache);
  }

  const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Missing env vars' });
  }

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  try {
    // Fire all category queries in parallel — from Vercel edge, latency to
    // Supabase is ~5ms each, so parallelising 16 costs ~50ms total
    const results = await Promise.all(
      CATEGORIES.map(async ({ slug, terms }) => {
        const searchCols = ['username', 'name', 'about'];
        const orExpressions = terms
          .flatMap(t => searchCols.map(c => `${c}.ilike.*${t}*`))
          .join(',');

        const params = new URLSearchParams({
          select: 'avatar',
          or: `(${orExpressions})`,
          order: 'favoritedcount.desc.nullslast',
          limit: '5',
        });

        try {
          const r = await fetch(
            `${SUPABASE_URL}/rest/v1/onlyfans_profiles?${params}`,
            { headers }
          );
          if (!r.ok) return { slug, avatar: null };
          const rows = await r.json();
          // Pick first row with a real http avatar
          const hit = Array.isArray(rows)
            ? rows.find(row => row.avatar && row.avatar.startsWith('http'))
            : null;
          return { slug, avatar: hit?.avatar || null };
        } catch {
          return { slug, avatar: null };
        }
      })
    );

    const output = {};
    results.forEach(({ slug, avatar }) => { if (avatar) output[slug] = avatar; });

    _cache = output;
    _cacheTs = Date.now();

    return res.status(200).json(output);
  } catch (err) {
    console.error('api/category-previews error', err);
    return res.status(500).json({ error: err.message });
  }
}
