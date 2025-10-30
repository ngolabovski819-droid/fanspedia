import os
from supabase import create_client

url = os.environ["SUPABASE_URL"]
key = os.environ["SUPABASE_ANON_KEY"]

sb = create_client(url, key)

# Ask Supabase for an exact count, only fetch 1 row
r = sb.table("onlyfans_profiles").select("id", count="exact").range(0, 0).execute()

print("DB rows:", r.count)
print("First row (if any):", r.data)
