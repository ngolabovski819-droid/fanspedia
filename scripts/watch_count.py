import os
import sys
import time
from supabase import create_client

# Read env vars (uses your ANON key so RLS policy must allow SELECT)
URL = os.environ.get("SUPABASE_URL")
ANON = os.environ.get("SUPABASE_ANON_KEY")

if not URL or not ANON:
    print("Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment.")
    sys.exit(1)

sb = create_client(URL, ANON)

def get_count():
    # fetch 1 row but ask PostgREST to compute exact total
    r = sb.table("onlyfans_profiles").select("id", count="exact").range(0, 0).execute()
    return r.count

if __name__ == "__main__":
    while True:
        try:
            cnt = get_count()
            print("DB rows:", cnt)
        except KeyboardInterrupt:
            print("\nStopped.")
            sys.exit(0)
        except Exception as e:
            # print full error but keep looping
            print("Watcher error:", repr(e))
        time.sleep(10)
