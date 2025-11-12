const fs = require('fs');
const path = require('path');
const glob = require('glob').glob;
function slugify(username) {
  return username.replace(/\./g, '-');
}
function toCreatorUrl(id, username) {
  return `/c/${id}/${slugify(username)}`;
}
const idMap = require('./idMap.json'); // {username: id}
glob('**/*.html', {}, (err, files) => {
  files.forEach(file => {
    let html = fs.readFileSync(file, 'utf8');
    html = html.replace(
      /href="\/creator\.html\?u=([^"]+)"/g,
      (match, username) => {
        const id = idMap[username];
        return `href="${toCreatorUrl(id, username)}"`;
      }
    );
    fs.writeFileSync(file, html);
  });
});
