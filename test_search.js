// Test search for a known username in Supabase
import fs from 'fs';

// Read .env manually
const envContent = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const SUPABASE_URL = envVars.SUPABASE_URL?.replace(/\/+$/, "");
const SUPABASE_ANON_KEY = envVars.SUPABASE_ANON_KEY || envVars.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Accept-Profile': 'public',
  'Content-Profile': 'public',
  'Prefer': 'count=exact'
};

async function testSearch() {
  const testQuery = process.argv[2] || 'skylar';
  
  try {
    // Test exact username match
    console.log(`\n1. Testing exact username match for: ${testQuery}`);
    const exactUrl = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?select=id,username,name,isverified,subscribeprice&username=eq.${testQuery}&limit=5`;
    const exactRes = await fetch(exactUrl, { headers });
    const exactData = await exactRes.json();
    console.log('Exact match results:', JSON.stringify(exactData, null, 2));

    // Test case-insensitive partial match (what the API uses)
    console.log(`\n2. Testing case-insensitive partial match (ilike) for: ${testQuery}`);
    const ilikeUrl = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?select=id,username,name,isverified,subscribeprice&username.ilike.*${testQuery}*&limit=5`;
    const ilikeRes = await fetch(ilikeUrl, { headers });
    const ilikeData = await ilikeRes.json();
    console.log('Partial match results:', JSON.stringify(ilikeData, null, 2));

    // Test OR query like the search API
    console.log(`\n3. Testing OR query (username/name/location/about) for: ${testQuery}`);
    const ors = ['username','name','location','about'].map(c => `${c}.ilike.*${testQuery}*`);
    const orUrl = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?select=id,username,name,location,isverified,subscribeprice&or=(${ors.join(',')})&limit=5`;
    const orRes = await fetch(orUrl, { headers });
    const orData = await orRes.json();
    console.log('OR query results:', JSON.stringify(orData, null, 2));

    // Get total count
    console.log(`\n4. Getting total record count...`);
    const countUrl = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?select=id&limit=1`;
    const countRes = await fetch(countUrl, { headers });
    const contentRange = countRes.headers.get('content-range');
    const totalCount = contentRange ? parseInt(contentRange.split('/')[1]) : 0;
    console.log(`Total records in database: ${totalCount}`);

  } catch (err) {
    console.error('Search test error:', err);
  }
}

testSearch();
