/**
 * SEO Meta Lint — verifies title (≤60 chars) and meta description (130–160)
 * for every country and every category, EN + ES.
 *
 * Run:  node scripts/check-seo-meta.cjs
 */
'use strict';

(async () => {
  const { countrySeoEn, countrySeoEs, categorySeoEn, categorySeoEs } =
    await import('../api/ssr/seo-meta.js');
  const { categories, compoundCategories, slugToLabel, categoryToSlug } =
    await import('../config/categories.js');

  // Pull country slugs by reading the COUNTRIES const out of country.js.
  const fs = require('fs');
  const path = require('path');
  const countryJs = fs.readFileSync(path.join(__dirname, '..', 'api', 'ssr', 'country.js'), 'utf8');
  const countrySlugs = [];
  const labelMap = {};
  const descMap = {};
  // crude but reliable: capture `'slug': { ... label: '...', metaDesc: '...' }`
  const blockRe = /'([a-z-]+)':\s*\{[\s\S]*?label:\s*'([^']+)'[\s\S]*?metaDesc:\s*'([^']+)'/g;
  let m;
  while ((m = blockRe.exec(countryJs)) !== null) {
    countrySlugs.push(m[1]);
    labelMap[m[1]] = m[2];
    descMap[m[1]] = m[3];
  }
  // also accept unquoted keys like `canada: {`
  const blockRe2 = /\b([a-z][a-z-]*[a-z]):\s*\{\s*\n[\s\S]*?label:\s*'([^']+)'[\s\S]*?metaDesc:\s*'([^']+)'/g;
  while ((m = blockRe2.exec(countryJs)) !== null) {
    if (!labelMap[m[1]]) {
      countrySlugs.push(m[1]);
      labelMap[m[1]] = m[2];
      descMap[m[1]] = m[3];
    }
  }

  const esCountryJs = fs.readFileSync(path.join(__dirname, '..', 'api', 'ssr', 'es-country.js'), 'utf8');
  const esLabelMap = {};
  const esBlockRe = /'([a-z-]+)':\s*\{[\s\S]*?label:\s*'([^']+)'/g;
  while ((m = esBlockRe.exec(esCountryJs)) !== null) esLabelMap[m[1]] = m[2];
  const esBlockRe2 = /\b([a-z][a-z-]*[a-z]):\s*\{\s*\n[\s\S]*?label:\s*'([^']+)'/g;
  while ((m = esBlockRe2.exec(esCountryJs)) !== null) {
    if (!esLabelMap[m[1]]) esLabelMap[m[1]] = m[2];
  }

  let issues = 0;
  const seenTitles = new Map(); // dup detection
  const seenDescs = new Map();

  function check(label, surface, lang, slug, t, d) {
    const tag = `[${surface}/${lang}] ${slug}`;
    if (t.length > 60) { console.log(`  ! TITLE>60 (${t.length}) ${tag}: ${t}`); issues++; }
    if (t.length < 25) { console.log(`  ! TITLE<25 (${t.length}) ${tag}: ${t}`); issues++; }
    if (d.length > 165) { console.log(`  ! DESC>165 (${d.length}) ${tag}: ${d}`); issues++; }
    if (d.length < 120) { console.log(`  ! DESC<120 (${d.length}) ${tag}: ${d}`); issues++; }
    const tk = `${surface}/${lang}/${t}`;
    if (seenTitles.has(tk) && seenTitles.get(tk) !== slug) {
      console.log(`  ! TITLE-DUP ${tag} == ${seenTitles.get(tk)}`); issues++;
    }
    seenTitles.set(tk, slug);
    const dk = `${surface}/${lang}/${d}`;
    if (seenDescs.has(dk) && seenDescs.get(dk) !== slug) {
      console.log(`  ! DESC-DUP ${tag} == ${seenDescs.get(dk)}`); issues++;
    }
    seenDescs.set(dk, slug);
  }

  console.log('Countries (EN):');
  for (const slug of countrySlugs) {
    const { title, description } = countrySeoEn(slug, labelMap[slug], descMap[slug]);
    check(slug, 'country', 'en', slug, title, description);
  }
  console.log(`  ${countrySlugs.length} entries scanned`);

  console.log('Countries (ES):');
  for (const slug of Object.keys(esLabelMap)) {
    const { title, description } = countrySeoEs(slug, esLabelMap[slug]);
    check(slug, 'country', 'es', slug, title, description);
  }
  console.log(`  ${Object.keys(esLabelMap).length} entries scanned`);

  // Categories: build slug list from categories array + compound categories
  const catSlugs = new Set();
  for (const c of categories) {
    catSlugs.add(typeof c === 'string' ? categoryToSlug(c) : c.slug || categoryToSlug(c));
  }
  for (const k of Object.keys(compoundCategories || {})) catSlugs.add(k);

  console.log('Categories (EN):');
  for (const slug of catSlugs) {
    const label = (compoundCategories[slug]?.displayLabel) || slugToLabel(slug);
    const { title, description } = categorySeoEn(slug, label);
    check(slug, 'category', 'en', slug, title, description);
  }
  console.log(`  ${catSlugs.size} entries scanned`);

  console.log('Categories (ES):');
  for (const slug of catSlugs) {
    const label = (compoundCategories[slug]?.displayLabel) || slugToLabel(slug);
    const { title, description } = categorySeoEs(slug, label);
    check(slug, 'category', 'es', slug, title, description);
  }
  console.log(`  ${catSlugs.size} entries scanned`);

  console.log(`\n${issues === 0 ? 'OK — no issues' : issues + ' issues found'}`);
  process.exit(issues === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
