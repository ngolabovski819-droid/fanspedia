import pandas as pd
import requests
import json

# --- CONFIG ---
SUPABASE_URL = "https://sirudrqheimbgpkchtwi.supabase.co"
SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcnVkcnFoZWltYmdwa2NodHdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNTk0NiwiZXhwIjoyMDc3MDkxOTQ2fQ.FJmA1ChyHy-rgcVMy5aklDrZjijRc-yfyLRC8tN8XFs"
TABLE_NAME = "onlyfans_profiles"
CSV_PATH = "onlyfans_profiles.csv"
# ---------------

# Load CSV
df = pd.read_csv(CSV_PATH)
csv_cols = [c.lower() for c in df.columns]

# Fetch table definition from Supabase REST metadata endpoint
url = f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}?select=*"
headers = {
    "apikey": SUPABASE_API_KEY,
    "Authorization": f"Bearer {SUPABASE_API_KEY}",
    "Range": "0-0",
    "Accept-Profile": "public",
}

r = requests.options(url, headers=headers)

if r.status_code == 200:
    try:
        metadata = r.json()
        db_cols = [c.lower() for c in metadata.get("columns", {}).keys()]
        missing = [c for c in csv_cols if c not in db_cols]

        print(f"✅ Found {len(db_cols)} columns in Supabase table '{TABLE_NAME}'.")
        if missing:
            print("⚠️ Missing columns:", missing)
        else:
            print("🎉 All CSV columns exist in Supabase.")
    except json.JSONDecodeError:
        print("❌ Could not parse metadata (Supabase returned no JSON).")
        print("Try again later or verify your table name and API key.")
else:
    print(f"❌ Failed to connect. Status code: {r.status_code}")
    print("Response:", r.text)
