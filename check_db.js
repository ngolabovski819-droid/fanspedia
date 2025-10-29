// Quick diagnostic script to check Supabase table count and test search
import fs from 'fs';

// Read .env manually
const envContent = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const SUPABASE_URL = envVars.SUPABASE_URL?.replace(/\/+$/, "");
const SUPABASE_ANON_KEY = envVars.SUPABASE_ANON_KEY;

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

async function checkDatabase() {
  try {
    // 1. Get total count
    const countUrl = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?select=id&limit=1`;
    const countRes = await fetch(countUrl, { headers });
    const contentRange = countRes.headers.get('content-range');
    const totalCount = contentRange ? parseInt(contentRange.split('/')[1]) : 0;
    console.log(`Total records in onlyfans_profiles: ${totalCount}`);

    // 2. Test a specific search (provide a username you know exists)
    const testUsername = process.argv[2] || '';
    if (testUsername) {
      const searchUrl = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?select=id,username,name&username.ilike.*${testUsername}*&limit=5`;
      const searchRes = await fetch(searchUrl, { headers });
      const searchData = await searchRes.json();
      console.log(`\nSearch for username containing "${testUsername}":`);
      console.log(JSON.stringify(searchData, null, 2));
    }

    // 3. Sample first 5 records to verify data structure
    const sampleUrl = `${SUPABASE_URL}/rest/v1/onlyfans_profiles?select=id,username,name,isverified,subscribeprice,avatar,avatar_c50,avatar_c144&limit=5`;
    const sampleRes = await fetch(sampleUrl, { headers });
    const sampleData = await sampleRes.json();
    console.log(`\nFirst 5 records (sample):`);
    console.log(JSON.stringify(sampleData, null, 2));

  } catch (err) {
    console.error('Error checking database:', err);
  }
}

checkDatabase();
