#!/usr/bin/env node
/* Convert render-blocking Bootstrap CSS link to non-blocking preload pattern.
 * Idempotent: skips files already converted. */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BLOCKING = '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">';
const NONBLOCKING =
  '<link rel="preload" as="style" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" onload="this.onload=null;this.rel=\'stylesheet\'">\n' +
  '  <noscript><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"></noscript>';

function processDir(dir) {
  let changed = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const full = path.join(dir, entry.name);
    let c = fs.readFileSync(full, 'utf8');
    if (!c.includes(BLOCKING)) continue;
    c = c.replace(BLOCKING, NONBLOCKING);
    fs.writeFileSync(full, c, 'utf8');
    changed++;
    console.log(`  + ${path.relative(ROOT, full)}`);
  }
  return changed;
}

const total = processDir(ROOT) + processDir(path.join(ROOT, 'es'));
console.log(`\nTotal files updated: ${total}`);
