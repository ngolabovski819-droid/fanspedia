#!/usr/bin/env node
/* Bulk-insert preconnect hints into all root HTML files after the viewport meta tag. */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PATTERN = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
const INSERT = `
  <!-- Preconnect to critical third-party origins (LCP / image performance) -->
  <link rel="preconnect" href="https://images.weserv.nl" crossorigin>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
  <link rel="dns-prefetch" href="https://images.weserv.nl">
  <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">`;

const SENTINEL = 'rel="preconnect" href="https://images.weserv.nl"';

function processDir(dir) {
  let changed = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const full = path.join(dir, entry.name);
    let c = fs.readFileSync(full, 'utf8');
    if (c.includes(SENTINEL)) continue;
    const idx = c.indexOf(PATTERN);
    if (idx < 0) continue;
    const after = idx + PATTERN.length;
    c = c.slice(0, after) + INSERT + c.slice(after);
    fs.writeFileSync(full, c, 'utf8');
    changed++;
    console.log(`  + ${path.relative(ROOT, full)}`);
  }
  return changed;
}

const total = processDir(ROOT) + processDir(path.join(ROOT, 'es'));
console.log(`\nTotal files updated: ${total}`);
