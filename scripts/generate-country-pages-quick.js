const fs = require('fs');
const path = require('path');

const countries = {
  canada: { name: 'Canada', location: 'Canada', flag: '', adjective: 'Canadian' },
  india: { name: 'India', location: 'India', flag: '', adjective: 'Indian' },
  japan: { name: 'Japan', location: 'Japan', flag: '', adjective: 'Japanese' }
};

const template = fs.readFileSync('united-states.html', 'utf8');

Object.entries(countries).forEach(([slug, country]) => {
  console.log(Creating .html...);
  
  let content = template
    .replace(/Best OnlyFans Creators in United States \| FansPedia/g, Best OnlyFans Creators in  | FansPedia)
    .replace(/Discover the most popular OnlyFans creators across United States\. Browse verified profiles, free accounts, and exclusive content from American creators\./g, Discover the most popular OnlyFans creators across . Browse verified profiles, free accounts, and exclusive content from  creators.)
    .replace(/<h1 class="page-title">The Best Onlyfans Creators All Across United States<\/h1>/g, <h1 class="page-title">The Best Onlyfans Creators All Across  </h1>)
    .replace(/statusDiv\.textContent = append \? 'Loading more\.\.\.' : 'Loading creators from United States\.\.\.';/g, statusDiv.textContent = append ? 'Loading more...' : 'Loading creators from ...';)
    .replace(/let apiUrl = \\/api\/search\?q=&location=United States&page=/g, let apiUrl = \/api/search?q=&location=&page=)
    .replace(/<div id="status">Loading creators from United States\.\.\.<\/div>/g, <div id="status">Loading creators from ...</div>)
    .replace(/resultsDiv\.innerHTML = \<p class='text-muted' style='grid-column: 1\/-1; text-align: center; padding: 40px 20px;'>No creators found from United States\.<\/p>\;/g, esultsDiv.innerHTML = \<p class='text-muted' style='grid-column: 1/-1; text-align: center; padding: 40px 20px;'>No creators found from .</p>\;);
  
  fs.writeFileSync(${slug}.html, content);
  console.log( Created .html);
});

// Update vercel.json
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
Object.keys(countries).forEach(slug => {
  if (!vercel.rewrites.find(r => r.source === /country/)) {
    const insertIndex = vercel.rewrites.findIndex(r => r.source === '/country/united-states/') + 1;
    vercel.rewrites.splice(insertIndex, 0,
      { source: /country/, destination: /.html },
      { source: /country//, destination: /.html }
    );
  }
  if (!vercel.headers.find(h => h.source === /.html)) {
    vercel.headers.splice(4, 0, {
      source: /.html,
      headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }]
    });
  }
});
fs.writeFileSync('vercel.json', JSON.stringify(vercel, null, 2));
console.log(' Updated vercel.json');

// Update server.js
let server = fs.readFileSync('server.js', 'utf8');
Object.entries(countries).forEach(([slug, country]) => {
  if (!server.includes(pp.get('/country/')) {
    const insertPoint = server.indexOf('app.get(\'/country/united-states\'');
    const routeCode = 
// Handle /country/ route
app.get('/country/', (req, res) => {
  res.sendFile(path.join(__dirname, '.html'));
});

;
    server = server.slice(0, insertPoint) + routeCode + server.slice(insertPoint);
  }
});
fs.writeFileSync('server.js', server);
console.log(' Updated server.js');

console.log('\n Done! Created pages for:');
Object.entries(countries).forEach(([slug, country]) => {
  console.log(    -> http://localhost:3000/country/);
});
