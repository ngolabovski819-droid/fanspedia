#!/usr/bin/env node
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pages = ['index.html', 'categories.html', 'category.html', 'wishlist.html'];

const errors = [];

async function fileExists(p) {
  try { await access(p, constants.F_OK); return true; } catch { return false; }
}

async function checkFavicon() {
  const favPath = path.join(root, 'favicon.svg');
  if (!(await fileExists(favPath))) {
    errors.push('Missing favicon.svg at repo root');
  }
  for (const page of pages) {
    const p = path.join(root, page);
    const html = await readFile(p, 'utf8');
    if (!html.includes('<link rel="icon" type="image/svg+xml" sizes="any" href="/favicon.svg">')) {
      errors.push(`${page}: missing <link rel="icon" ... href="/favicon.svg">`);
    }
  }
}

function hasRegex(str, re) { return re.test(str); }

async function checkHeaderActionsGap() {
  for (const page of pages) {
    const html = await readFile(path.join(root, page), 'utf8');
    const has12 = hasRegex(html, /\.header-actions\s*\{[^}]*gap:\s*12px;?/s);
    if (!has12) {
      errors.push(`${page}: .header-actions rule missing gap: 12px;`);
    }
    const has8 = hasRegex(html, /\.header-actions\s*\{[^}]*gap:\s*8px;?/s);
    if (has8) {
      errors.push(`${page}: .header-actions uses gap: 8px; override still present`);
    }
  }
}

async function checkNoCircularHeaderButtons() {
  for (const page of pages) {
    const html = await readFile(path.join(root, page), 'utf8');
    const circTheme = /\.theme-toggle[^{]*\{[^}]*border-radius:\s*50%/s.test(html);
    const circSafe = /\.safe-search-toggle[^{]*\{[^}]*border-radius:\s*50%/s.test(html);
    if (circTheme) errors.push(`${page}: .theme-toggle has circular border (border-radius:50%)`);
    if (circSafe) errors.push(`${page}: .safe-search-toggle has circular border (border-radius:50%)`);
  }
}

(async () => {
  await checkFavicon();
  await checkHeaderActionsGap();
  await checkNoCircularHeaderButtons();

  if (errors.length) {
    console.error('\nCI checks failed:');
    for (const e of errors) console.error('- ' + e);
    process.exit(1);
  } else {
    console.log('All header and favicon checks passed.');
  }
})();
