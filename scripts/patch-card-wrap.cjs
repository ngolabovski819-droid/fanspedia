/**
 * patch-card-wrap.cjs  — wraps client-side <img> in .card-img-wrap for CLS fix
 * Run: node scripts/patch-card-wrap.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// --------------------------------------------------------------------------
// category.html — template literal uses backslash-escaped \" quotes
// --------------------------------------------------------------------------
{
  const file = path.join(ROOT, 'category.html');
  let html = fs.readFileSync(file, 'utf8');

  const START = '              <img src=\\"${responsive.src}\\"';
  const END   = '              <div class=\\"card-body\\">';
  const startIdx = html.indexOf(START);
  const endIdx   = html.indexOf(END, startIdx);

  if (startIdx === -1 || endIdx === -1) {
    console.error(`category.html: markers not found (start=${startIdx}, end=${endIdx})`);
  } else {
    const newBlock =
      '              <div class=\\"card-img-wrap\\">\n' +
      '                <img src=\\"${responsive.src}\\" srcset=\\"${responsive.srcset}\\" sizes=\\"${responsive.sizes}\\" alt=\\"${name}\\" loading=\\"lazy\\" decoding=\\"async\\" referrerpolicy=\\"no-referrer\\" onerror=\\"if(this.src!=\'/static/no-image.png\'){this.removeAttribute(\'srcset\'); this.removeAttribute(\'sizes\'); this.src=\'${imgSrc}\';}\\">\n' +
      '              </div>\n' +
      END;
    html = html.slice(0, startIdx) + newBlock + html.slice(endIdx + END.length);
    fs.writeFileSync(file, html, 'utf8');
    console.log('category.html: patched');
  }
}

// --------------------------------------------------------------------------
// Country pages + near-me — unescaped quotes in template literals
// --------------------------------------------------------------------------
function patchPage(filename, ind) {
  const file = path.join(ROOT, filename);
  let html = fs.readFileSync(file, 'utf8');
  // Normalize CRLF → LF for consistent matching, restore at end
  const hasCRLF = html.includes('\r\n');
  if (hasCRLF) html = html.replace(/\r\n/g, '\n');

  const START = ind + '<img src="${responsive.src}" \n';
  const END   = ind + '<div class="card-body">';
  const startIdx = html.indexOf(START);
  const endIdx   = html.indexOf(END, startIdx);

  if (startIdx === -1 || endIdx === -1) {
    console.error(`${filename}: markers not found (start=${startIdx}, end=${endIdx})`);
    return;
  }

  // The raw img block (everything from START up to but not including END)
  let imgBlock = html.slice(startIdx, endIdx);

  // Remove width / height / style lines
  imgBlock = imgBlock.replace(/ width="270" \n\s+height="360"\n/, '\n');
  imgBlock = imgBlock.replace(/\s+height="360"\n/, '\n');
  imgBlock = imgBlock.replace(/\s+style="aspect-ratio: 3 \/ 4;"\n/, '\n');
  // Fix onload depth (img now inside card-img-wrap > card > col)
  imgBlock = imgBlock.replace(
    'this.parentElement.parentElement.remove()',
    'this.parentElement.parentElement.parentElement.remove()'
  );

  const newBlock =
    ind + '<div class="card-img-wrap">\n' +
    ind + '  ' + imgBlock.trimStart() +
    '\n' + ind + '</div>\n' +
    END;

  html = html.slice(0, startIdx) + newBlock + html.slice(endIdx + END.length);
  if (hasCRLF) html = html.replace(/\n/g, '\r\n');
  fs.writeFileSync(file, html, 'utf8');
  console.log(`${filename}: patched`);
}

patchPage('united-states.html', '              ');
patchPage('canada.html',        '              ');
patchPage('india.html',         '              ');
patchPage('japan.html',         '              ');
patchPage('near-me.html',       '            ');

console.log('\nAll done.');
