import os
from supabase import create_client
sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE"])
r = sb.table("onlyfans_profiles").select("id", count="exact").range(0,0).execute()
print("SR count:", r.count, "first:", r.data)
