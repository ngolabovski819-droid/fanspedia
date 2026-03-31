/**
 * SSR handler for /categories/:slug
 *
 * Fetches the top creators for a category from Supabase and returns a fully
 * rendered HTML page so Googlebot sees real content on the first request,
 * matching the structural SEO advantage of frameworks like Next.js.
 *
 * Flow:
 *   1. Resolve slug → search terms via synonymsMap / compoundCategories
 *   2. Fetch top PAGE_SIZE creators from Supabase
 *   3. Read category.html as a string template
 *   4. Inject <title>, <meta>, <link rel="canonical">, JSON-LD, pre-rendered cards
 *   5. Set window.__CATEGORY_SSR so client JS skips the duplicate first fetch
 *   6. Return complete HTML with 5-minute CDN cache
 *
 * On any error the handler falls back to a 302 to /category.html for
 * transparent client-side rendering.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  synonymsMap,
  compoundCategories,
  slugToLabel,
} from '../../config/categories.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATEGORY_HTML = join(__dirname, '..', '..', 'category.html');

const BASE_URL = 'https://fanspedia.net';
const PAGE_SIZE = 50;
const YEAR = new Date().getFullYear();

// ---------------------------------------------------------------------------
// Image helpers (mirrors category.html client-side logic)
// ---------------------------------------------------------------------------
function proxyImg(url, w, h) {
  try {
    if (!url || url.startsWith('/static/')) return url;
    const noScheme = url.replace(/^https?:\/\//, '');
    return `https://images.weserv.nl/?url=${encodeURIComponent(noScheme)}&w=${w}&h=${h}&fit=cover&output=webp`;
  } catch { return url; }
}

function buildResponsiveSources(originalUrl) {
  const widths = [144, 240, 320, 480, 720];
  const srcset = widths
    .map(w => `${proxyImg(originalUrl, w, Math.round(w * 4 / 3))} ${w}w`)
    .join(', ');
  const src = proxyImg(originalUrl, 320, Math.round(320 * 4 / 3));
  const sizes = '(max-width: 480px) 144px, (max-width: 768px) 240px, (max-width: 1200px) 320px, 360px';
  return { src, srcset, sizes };
}

// ---------------------------------------------------------------------------
// String helpers
// ---------------------------------------------------------------------------
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Card renderer
// ---------------------------------------------------------------------------
function renderCard(item, index) {
  const img = item.avatar || item.avatar_c144 || '';
  const imgSrc = img && img.startsWith('http') ? img : '/static/no-image.png';
  const { src, srcset, sizes } = buildResponsiveSources(imgSrc);

  const name = escHtml(item.name || 'Unknown');
  const username = escHtml(item.username || '');
  const subscribePrice = item.subscribePrice ?? item.subscribeprice;
  const priceText = (subscribePrice && !isNaN(subscribePrice))
    ? `$${parseFloat(subscribePrice).toFixed(2)}`
    : 'FREE';
  const isVerified = item.isVerified ?? item.isverified;
  const verifiedBadge = isVerified ? '<span aria-label="Verified" title="Verified creator">✓ </span>' : '';
  const profileUrl = username ? `https://onlyfans.com/${encodeURIComponent(username)}` : '#';
  const loading = index === 0 ? 'eager' : 'lazy';
  const fetchpriority = index === 0 ? ' fetchpriority="high"' : '';
  const priceHtml = priceText === 'FREE'
    ? `<p class="price-free" style="color:#34c759;font-weight:700;font-size:16px;text-transform:uppercase;">FREE</p>`
    : `<p class="price-tag" style="color:#34c759;font-weight:700;font-size:18px;">${priceText}</p>`;

  return `<div class="col-sm-6 col-md-4 col-lg-3 mb-4">
  <div class="card h-100">
    <button class="favorite-btn" data-username="${username}" onclick="event.preventDefault();toggleFavorite('${username}',this);">
      <span>♡</span>
    </button>
    <div class="card-img-wrap">
      <img src="${src}" srcset="${srcset}" sizes="${sizes}"
        alt="${name} OnlyFans creator" loading="${loading}"${fetchpriority}
        decoding="async" referrerpolicy="no-referrer"
        onerror="if(this.src!=='/static/no-image.png'){this.removeAttribute('srcset');this.removeAttribute('sizes');this.src='${escHtml(imgSrc)}';this.style.opacity='0.4';}">
    </div>
    <div class="card-body">
      <h3 style="font-size:1rem;font-weight:700;margin-bottom:4px;">${verifiedBadge}${name}</h3>
      <p class="username">@${username}</p>
      ${priceHtml}
      <a href="${escHtml(profileUrl)}" class="view-profile-btn" target="_blank" rel="noopener noreferrer">View Profile</a>
    </div>
  </div>
</div>`;
}

// ---------------------------------------------------------------------------
// JSON-LD structured data
// ---------------------------------------------------------------------------
function buildJsonLd(slug, label, creators, canonicalUrl) {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Categories', item: `${BASE_URL}/categories/` },
      { '@type': 'ListItem', position: 3, name: label, item: canonicalUrl },
    ],
  };
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Best ${label} OnlyFans Creators`,
    url: canonicalUrl,
    numberOfItems: creators.length,
    itemListElement: creators.slice(0, 10).map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: escHtml(c.name || c.username),
      url: `https://onlyfans.com/${encodeURIComponent(c.username)}`,
    })),
  };
  return [
    `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(itemList)}</script>`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Category-specific rich SEO content
// ---------------------------------------------------------------------------
function buildBestSeoContent() {
  const p = (txt) => `<p style="color:var(--text-primary);font-size:16px;line-height:1.7;margin-bottom:16px;">${txt}</p>`;
  const h2 = (txt) => `<h2 style="color:#00AFF0;font-weight:600;font-size:22px;margin-bottom:15px;margin-top:30px;">${txt}</h2>`;
  const h3 = (txt) => `<h3 style="color:#00AFF0;font-weight:600;font-size:20px;margin-bottom:12px;margin-top:24px;">${txt}</h3>`;
  const a = (href, txt) => `<a href="${href}" style="color:#00AFF0;">${txt}</a>`;
  return `
<h2 id="seoH2" style="color:#00AFF0;font-weight:700;font-size:26px;margin-bottom:16px;">Best OnlyFans Models (2026)</h2>
<p id="seoP1" style="color:var(--text-primary);font-size:16px;line-height:1.7;margin-bottom:16px;">The best OnlyFans models in 2026 combine authentic engagement, high-quality exclusive content, and distinctive personal brands that keep subscribers coming back. With over 4.6 million creators on the platform and fan spending exceeding $7 billion annually, finding the top performers requires cutting through the noise. This guide delivers a curated selection of established stars, rising creators, and fresh faces worth your attention right now.</p>

${h2('Quick Answer: Top OnlyFans Creators Right Now')}
<ul style="color:var(--text-primary);font-size:16px;line-height:1.8;margin-bottom:20px;">
  <li><strong>Blac Chyna</strong> – Celebrity crossover earning approximately $20M monthly through glamour content</li>
  <li><strong>Sophie Rain</strong> – Independent creator who earned $43M in her first year with cosplay and premium productions</li>
  <li><strong>Bella Thorne</strong> – Actress leveraging free subscription models with massive social media reach</li>
  <li><strong>Iggy Azalea</strong> – Music artist offering artistic, premium-positioned content</li>
  <li><strong>Cardi B</strong> – Rap superstar delivering personality-driven behind the scenes access</li>
  <li><strong>Gemma McCourt (Gem101)</strong> – UK model proving non-celebrities can earn $2.3M monthly through niche aesthetics</li>
  <li><strong>Mia Khalifa</strong> – Media personality balancing name recognition with exclusive private content</li>
</ul>

${h2('Top OnlyFans Models Right Now')}
${p('These established creators dominate the platform with proven track records, massive audiences, and content that consistently delivers.')}

${h3('Blac Chyna')}
${p("She's serving glamour and celebrity access like few others can. With estimated monthly earnings around $20M and lifetime platform earnings approaching $240M, Blac Chyna represents the pinnacle of celebrity crossover success on OnlyFans.")}
${p('Her official OnlyFans page attracts fans seeking high-profile exclusive content from a reality TV personality who knows how to keep subscribers engaged.')}

${h3('Sophie Rain')}
${p('This independent content creator built an empire without traditional celebrity backing. Sophie Rain earned approximately $43M in her first year and continues generating over $60M annually through glam and cosplay content.')}
${p(`Beyond creating content for her own OnlyFans account, she co-founded ${a('https://en.wikipedia.org/wiki/Bop_House', 'Bop House')}, a creator collective that's reshaping how models collaborate and cross-promote.`)}

${h3('Bella Thorne')}
${p(`The actress disrupted the adult entertainment industry by offering ${a('/categories/free/', 'free subscription')} access while monetizing through pay-per-view and custom content.`)}
${p("Her OnlyFans profile generates an estimated $11M monthly, demonstrating how mainstream celebrities can leverage existing audiences effectively. Fans subscribe for the combination of her actual personality and exclusive behind the scenes glimpses.")}

${h3('Iggy Azalea')}
${p("Rather than positioning her content as purely explicit, Iggy brings an artistic approach to her OnlyFans page.")}
${p("Earning approximately $9.5M monthly, she offers premium content that feels more like a curated visual experience. Her music career crossover brings fans who appreciate creative production value alongside sexy content.")}

${h3('Cardi B')}
${p("Personality drives everything on Cardi's official OnlyFans page. The rapper earns around $9–10M monthly by delivering candid, intimate storytelling alongside behind the scenes access to her life.")}
${p('Subscribers get the unfiltered version of someone they already love chatting to through social media.')}

${h3('Gemma McCourt (Gem101)')}
${p("Proof that the hottest girls don't need celebrity status to dominate. This UK model earns approximately $2.3M monthly through niche aesthetics, high pricing strategies, and exceptional subscriber engagement.")}
${p('Her success demonstrates what dedicated OnlyFans creators can achieve through focused branding and consistent new content.')}

${h3('Mia Khalifa')}
${p("Brand recognition meets exclusive content on Mia's OnlyFans profile. Generating roughly $6.5M monthly, she balances her public persona with private content that subscribers can't find elsewhere.")}
${p('Her commentary and media personality aspects add dimension beyond typical adult content.')}

${h3('Erica Mena')}
${p('Reality TV background meets premium content creation. Erica earns approximately $4.5M monthly using a freemium model that hooks new fans before converting them to paying subscribers.')}
${p('Her approach demonstrates effective funnel strategy in the adult entertainment space.')}

${h2('Rising &amp; Trending OnlyFans Creators (2026)')}
${p('These creators are gaining serious momentum through viral content, innovative approaches, and growing audiences.')}

${h3('Tana Mongeau')}
${p("The YouTube-to-OnlyFans pipeline has never worked better than with Tana. Her candidness and storytelling abilities translate perfectly to the platform, where subscribers feel like they're getting real access to her actual personality.")}
${p("She's giving fans the unfiltered content her YouTube audience always wanted.")}

${h3('Belle Delphine')}
${p("Meme culture meets cosplay in Belle's unique OnlyFans approach. She generates demand through scarcity – limited content drops that create excitement among her dedicated fanbase.")}
${p("While her earnings don't match the biggest celebrities, her viral moments and niche appeal make her a consistent trending creator.")}

${h3('Bhad Bhabie')}
${p('From TV controversy to top earner, Bhad Bhabie continues dominating the platform. Her rap career crossover brings music content alongside lifestyle glimpses.')}
${p('Subscribers follow for her authentic, unfiltered approach that feels like fresh air compared to overly produced content.')}

${h3('Morgpie')}
${p(`Twitch streaming meets OnlyFans in Morgpie's hybrid content approach. Her ${a('/categories/cosplay/', 'cosplay')}, ${a('/categories/fitness/', 'fitness')} content bridges between ${a('/categories/gaming/', 'gaming')} audiences and adult content in ways that feel natural rather than forced.`)}

${h2('New OnlyFans Models to Watch')}
${p('These newer creators show exceptional promise despite recently launching their OnlyFans accounts.')}

${h3('Fresh Independent Creators')}
${p("The platform's 2025–2026 newcomers increasingly leverage creator collectives like Bop House to accelerate growth. These collaborative approaches let new models share production resources, cross-pollinate audiences, and generate media attention that solo creators struggle to achieve. Expect the most successful new faces to emerge from these organized groups.")}

${h3('Micro-Niche Specialists')}
${p('New content creators are finding success by going deeper into specific interests rather than competing broadly. Whether focusing on cosplay, fitness transformations, or interactive live streams, these specialists charge premium subscription fees for highly targeted content. Their fans pay more because the content directly matches their wildest fantasies.')}

${h3('Girl Next Door Aesthetics')}
${p("The candy store approach of offering everything doesn't work for newer creators competing against established stars. Instead, fresh faces succeeding in 2026 embrace the girl next door appeal – relatable, accessible, and authentic. These creators build loyal followings through genuine interaction rather than production budgets.")}

${h2('Choose the Right OnlyFans Creator for Your Interests')}
${p('Finding the perfect OnlyFans page means understanding what you actually want from the experience.')}

${h3('For Interactive Experience Seekers')}
${p("Some fans value conversation as much as content. Look for creators known for responding to messages personally, offering custom content based on requests, and hosting interactive live streams. Creators like Gemma McCourt built their success partly through exceptional DM engagement. When a post feels personal, subscribers stay longer.")}

${h3('For Premium Content Enthusiasts')}
${p("Production value matters when you're paying a subscription fee. Seek creators who invest in lighting, sets, and diverse content types. The best OnlyFans models maintain consistent quality across photos, videos, and exclusive content while uploading regularly enough to justify ongoing subscriptions.")}

${h3('For Niche Content Fans')}
${p('Generic content saturates the platform. The creators who truly satisfy subscribers focus on specific aesthetics – lingerie shots, cosplay scenarios, fitness content, or uncensored content in particular styles. Finding someone who genuinely enjoys their niche shows in every post.')}

${h2('What Makes These OnlyFans Models Stand Out')}
${p('Understanding what separates top earners from the millions of other creators helps you find quality faster.')}

${h3('Authentic Engagement &amp; Personality')}
${p("The top 1% of creators earn about one-third of all platform revenue, and authenticity drives much of that success. Subscribers detect when responses feel managed or generic. The best performers let their actual personality shine through posts, messages, and live streams. Being a bit shy or a little freak – whatever's genuine – creates connection.")}

${h3('Consistent Content Quality')}
${p('Successful creators balance quantity with quality rather than flooding feeds with repetitive material. They evolve their content over time, experiment with new vibes, and maintain production standards. Regular uploads matter, but each post feels intentional rather than obligatory.')}

${h3('Cross-Platform Presence')}
${p(`The most successful OnlyFans creators don't rely solely on platform discovery. They build audiences on ${a('/categories/tiktok/', 'TikTok')}, ${a('/categories/instagram/', 'Instagram')}, and Reddit before funneling followers into their OnlyFans. Strong social presence correlates directly with subscription numbers.`)}

${h2('How to Discover More Amazing OnlyFans Creators')}
${p(`This list scratches the surface of what's available. Here's how to find more creators matching your interests, especially when you use a dedicated ${a('/', 'OnlyFans search engine with advanced filters')}.`)}

${h3('Explore Related Categories')}
${p(`Start with ${a('/categories/free/', 'free OnlyFans accounts')} to sample content styles before committing to paid subscriptions. Explore ${a('/locations/', 'location categories')} – Latina creators offer different aesthetics than ${a('/country/united-states/', 'American creators')}. Filtering by nationality helps you find what you're looking for faster than scrolling through content that doesn't excite you.`)}

${h3('Follow Creator Recommendations')}
${p('Established creators frequently collaborate with others or promote friends. Check social media accounts for guest appearances and collaborative content. Creator collectives like Bop House introduce you to multiple models through single discoveries. Following these connections expands your options beyond algorithm suggestions.')}

${h2('Start Exploring the Best OnlyFans Has to Offer')}
${p('The adult entertainment industry on OnlyFans spans everything from celebrity glamour to authentic independent creators building personal empires. Whether you prefer established stars with massive production budgets or rising models offering that fun girl next door experience, the platform delivers options at every subscription level.')}
${p("These curated creators represent diverse content styles, engagement approaches, and price points. Subscribe to explore what resonates with you, and don't be surprised when you discover new favorites beyond this list. The whole thing keeps evolving – and that's what makes it exciting.")}

${h2('FAQ')}

${h3('Who is #1 on OnlyFans?')}
${p('Blac Chyna is widely considered the #1 OnlyFans creator by earnings with more than $20 million per month, one of the highest lifetime earners on the platform.')}

${h3('What are the best OnlyFans models in 2026?')}
${p('The best OnlyFans models in 2026 include a mix of celebrity creators and independent stars such as Blac Chyna, Sophie Rain, Bella Thorne, and Mia Khalifa. These creators stand out due to strong engagement, consistent content quality, and unique personal branding that attracts loyal subscribers.')}

${h3('Who is the highest earning OnlyFans creator right now?')}
${p('Top earners vary by time, but creators like Blac Chyna and Sophie Rain have generated tens of millions monthly or annually. High earnings typically come from a combination of subscription pricing, pay-per-view content, and strong audience funnels.')}

${h3('How do OnlyFans models become successful?')}
${p('Successful OnlyFans creators focus on three key factors:')}
<ul style="color:var(--text-primary);font-size:16px;line-height:1.8;margin-bottom:20px;">
  <li>Consistent high-quality content</li>
  <li>Authentic interaction with subscribers</li>
  <li>Strong presence on platforms like TikTok, Instagram, and Reddit</li>
</ul>
${p('Top performers also build a clear niche or personal brand that differentiates them from millions of other creators.')}

${h3('Are non-celebrity OnlyFans models successful?')}
${p('Yes – many independent creators earn millions without celebrity status. For example, models like Gemma McCourt prove that niche branding, pricing strategy, and engagement can outperform even well-known personalities.')}

${h3('What type of content performs best on OnlyFans?')}
${p('Top-performing content typically includes:')}
<ul style="color:var(--text-primary);font-size:16px;line-height:1.8;margin-bottom:20px;">
  <li>Exclusive photos and videos</li>
  <li>Personalized messages and custom content</li>
  <li>Live streams and interactive experiences</li>
  <li>Niche content such as cosplay or fitness</li>
</ul>
${p('Creators who combine content quality with interaction tend to retain subscribers longer.')}

${h3('Is OnlyFans still growing in 2026?')}
${p('Yes – OnlyFans continues to grow rapidly, with millions of creators and billions in yearly spending. The platform is evolving with new content formats, creator collaborations, and niche markets expanding every year.')}

${h3('How do I find the best OnlyFans creators for my interests?')}
${p('The best way is to explore categorized lists and filters based on:')}
<ul style="color:var(--text-primary);font-size:16px;line-height:1.8;margin-bottom:20px;">
  <li>Content type (free, premium, niche)</li>
  <li>Location (USA, Latina, etc.)</li>
  <li>Style (cosplay, fitness, lifestyle)</li>
</ul>

<div id="faq" style="display:none;"></div>`;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  const slug = (req.query.slug || '').toLowerCase().trim();
  if (!slug) return res.status(400).send('Missing slug');

  const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

  // If env vars are missing, fall back to client-side rendering
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.redirect(302, '/category.html');
  }

  try {
    // --- 1. Resolve search terms ---
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const offset = (page - 1) * PAGE_SIZE;
    const isCompound = compoundCategories && compoundCategories[slug];
    const terms = isCompound
      ? (compoundCategories[slug].synonyms || [compoundCategories[slug].searchTerm])
      : (synonymsMap[slug]?.length ? synonymsMap[slug] : [slug.replace(/-/g, ' ')]);
    const label = isCompound ? compoundCategories[slug].displayLabel : slugToLabel(slug);

    // --- 2. Fetch creators from Supabase ---
    const searchCols = ['username', 'name', 'about', 'location'];
    const expressions = terms.flatMap(t =>
      searchCols.map(c => `${c}.ilike.*${t}*`)
    );

    const selectCols = [
      'id', 'username', 'name', 'avatar', 'avatar_c144',
      'isverified', 'subscribeprice', 'favoritedcount', 'subscriberscount',
    ].join(',');

    const params = new URLSearchParams({
      select: selectCols,
      order: 'favoritedcount.desc,subscribeprice.asc',
      limit: String(PAGE_SIZE),
      offset: String(offset),
      or: `(${expressions.join(',')})`,
    });

    // Compound category auto-filters
    if (isCompound && compoundCategories[slug].filters) {
      const { maxPrice, verified } = compoundCategories[slug].filters;
      if (maxPrice !== undefined) params.set('subscribeprice', `lte.${maxPrice}`);
      if (verified) params.set('isverified', 'eq.true');
    }

    const supaFetch = await fetch(`${SUPABASE_URL}/rest/v1/onlyfans_profiles?${params}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Accept-Profile': 'public',
        Prefer: 'count=estimated',
      },
    });

    // 416 = Range Not Satisfiable: offset is beyond total count → treat as empty page
    let creators, totalCount;
    if (supaFetch.status === 416) {
      creators = [];
      totalCount = 0;
    } else {
      if (!supaFetch.ok) throw new Error(`Supabase ${supaFetch.status}`);
      creators = await supaFetch.json();
      const contentRange = supaFetch.headers.get('content-range') || '';
      totalCount = parseInt(contentRange.split('/')[1] || '0', 10) || creators.length;
    }

    // Unknown slug with no results → hard 404 to prevent GSC soft-404
    if (creators.length === 0 && totalCount === 0 && page === 1) {
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=604800');
    res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=604800');
      return res.status(404).send('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Category Not Found | FansPedia</title><link rel="canonical" href="https://fanspedia.net/categories/"></head><body><h1>Category Not Found</h1><p><a href="/categories/">Browse all categories</a></p></body></html>');
    }

    // --- 3. Read template ---
    let html = readFileSync(CATEGORY_HTML, 'utf8');

    const canonicalUrl = page > 1
      ? `${BASE_URL}/categories/${slug}/${page}/`
      : `${BASE_URL}/categories/${slug}/`;
    const pageLabel = page > 1 ? ` - Page ${page}` : '';
    const titleText = `Best ${label} OnlyFans Creators${pageLabel} (${YEAR}) | FansPedia`;
    const metaDescription = `Browse ${totalCount > 0 ? totalCount + '+' : 'top'} ${label} OnlyFans creators on FansPedia. Filter by verified status, bundles, and price.${page > 1 ? ` Page ${page}.` : ''}`;

    // rel prev / next for paginated series
    const prevLink = page > 2
      ? `<link rel="prev" href="${BASE_URL}/categories/${slug}/${page - 1}/">`
      : page === 2
        ? `<link rel="prev" href="${BASE_URL}/categories/${slug}/">`
        : '';
    const nextLink = creators.length === PAGE_SIZE
      ? `<link rel="next" href="${BASE_URL}/categories/${slug}/${page + 1}/">`
      : '';

    // --- 4. Head injections ---
    html = html.replace(
      '<title>Best OnlyFans Category | FansPedia</title>',
      `<title>${escHtml(titleText)}</title>`
    );
    html = html.replace(
      /(<meta name="description" content=")[^"]*(")/,
      `$1${metaDescription}$2`
    );
    html = html.replace(
      /(<link id="canonicalLink" rel="canonical" href=")[^"]*(")/,
      `$1${canonicalUrl}$2`
    );

    const jsonLd = buildJsonLd(slug, label, creators, canonicalUrl);
    const ssrFlag = `<script>window.__CATEGORY_SSR={slug:${JSON.stringify(slug)},count:${totalCount},hasMore:${creators.length === PAGE_SIZE},page:${page}};</script>`;
    const paginationLinks = [prevLink, nextLink].filter(Boolean).join('\n');
    // hreflang cross-links: tell Google EN and ES are alternates, not duplicates
    const esUrl = page > 1
      ? `${BASE_URL}/es/categories/${slug}/${page}/`
      : `${BASE_URL}/es/categories/${slug}/`;
    const hreflangLinks = [
      `<link rel="alternate" hreflang="en" href="${canonicalUrl}">`,
      `<link rel="alternate" hreflang="es" href="${esUrl}">`,
      `<link rel="alternate" hreflang="x-default" href="${canonicalUrl}">`,
    ].join('\n');
    // LCP preload
    const _lcpImg = creators[0]?.avatar || creators[0]?.avatar_c144 || '';
    const _lcpSrc = _lcpImg.startsWith('http') ? _lcpImg : '';
    const preloadLink = _lcpSrc
      ? (() => { const { src, srcset, sizes } = buildResponsiveSources(_lcpSrc); return `<link rel="preload" as="image" fetchpriority="high" href="${src}" imagesrcset="${srcset}" imagesizes="${sizes}">`; })()
      : '';
    html = html.replace('</head>', `${preloadLink ? preloadLink + '\n' : ''}${jsonLd}\n${ssrFlag}\n${hreflangLinks}\n${paginationLinks ? paginationLinks + '\n' : ''}</head>`);

    // --- 5. Body injections ---

    // Pre-rendered breadcrumbs — avoids the client JS injecting them after paint (kills CLS)
    const categoryUrl = canonicalUrl;
    const breadcrumbsHtml = `<li class="breadcrumb-item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <a href="/" itemprop="item" class="breadcrumb-home"><i class="fas fa-home" aria-hidden="true"></i><span itemprop="name">Home</span></a>
          <meta itemprop="position" content="1" />
        </li>
        <li class="breadcrumb-separator" aria-hidden="true">/</li>
        <li class="breadcrumb-item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <a href="/categories/" itemprop="item"><span itemprop="name">Categories</span></a>
          <meta itemprop="position" content="2" />
        </li>
        <li class="breadcrumb-separator" aria-hidden="true">/</li>
        <li class="breadcrumb-item active" aria-current="page" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <span itemprop="item" itemscope itemtype="https://schema.org/WebPage" itemid="${categoryUrl}"><span itemprop="name">${escHtml(label)}</span></span>
          <meta itemprop="position" content="3" />
        </li>`;
    html = html.replace(
      /(<ol id="breadcrumbsList"[^>]*>)\s*<!--[^>]*-->\s*(<\/ol>)/,
      `$1${breadcrumbsHtml}$2`
    );

    html = html.replace(
      '<h1 id="catH1" class="mb-2">Best OnlyFans Creators</h1>',
      `<h1 id="catH1" class="mb-2">Best OnlyFans ${escHtml(label)} Creators</h1>`
    );
    html = html.replace(
      /(<p id="catSubtitle" class="subtitle">)[^<]*/,
      `$1Explore top ${escHtml(label)} OnlyFans creators. Use filters to find verified models, free accounts, and bundle deals.`
    );

    // Pre-rendered creator cards
    const cardsHtml = Array.isArray(creators) && creators.length > 0
      ? creators.map((c, i) => renderCard(c, i)).join('\n')
      : `<p class="text-muted text-center w-100 py-4">No results found for <strong>${escHtml(label)}</strong>.</p>`;

    html = html.replace(
      '<div id="results" class="row g-3 justify-content-center"></div>',
      `<div id="results" class="row g-3 justify-content-center">\n${cardsHtml}\n</div>`
    );

    // --- 7. Category-specific SEO content ---
    if (slug === 'best') {
      html = html.replace(
        /<h2 id="seoH2"[^>]*>About this category<\/h2>[\s\S]*?<div id="faq"[^>]*><\/div>/,
        buildBestSeoContent()
      );
    }

    // --- 6. Send ---
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // 5-minute CDN cache; stale-while-revalidate so Vercel serves stale while refreshing
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=604800');
    res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=604800');
    return res.status(200).send(html);

  } catch (err) {
    console.error('[ssr/category] error:', err.message);
    // Graceful fallback to client-side rendering
    return res.redirect(302, '/category.html');
  }
}
