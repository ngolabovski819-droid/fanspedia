import os
import json
import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.engine.url import URL
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
assert DATABASE_URL, "DATABASE_URL missing in .env"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Adjust if your file is named differently
CSV_PATH = "temp.csv"   # or "onlyfans_profiles.csv"

# Minimal DDL if table doesn’t exist
DDL = """
CREATE TABLE IF NOT EXISTS creators (
  id BIGINT PRIMARY KEY,
  username TEXT,
  name TEXT,
  location TEXT,
  is_verified BOOLEAN,
  is_performer BOOLEAN,
  subscribe_price NUMERIC(10,2),
  avatar TEXT,
  about TEXT,
  last_seen TIMESTAMPTZ,
  join_date TIMESTAMPTZ,
  favorited_count BIGINT,
  posts_count BIGINT,
  medias_count BIGINT,
  raw_json JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
"""

UPSERT_SQL = text("""
INSERT INTO creators (
  id, username, name, location, is_verified, is_performer, subscribe_price,
  avatar, about, last_seen, join_date, favorited_count, posts_count, medias_count,
  raw_json, updated_at
) VALUES (
  :id, :username, :name, :location, :is_verified, :is_performer, :subscribe_price,
  :avatar, :about, :last_seen, :join_date, :favorited_count, :posts_count, :medias_count,
  CAST(:raw_json AS JSONB), NOW()
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  is_verified = EXCLUDED.is_verified,
  is_performer = EXCLUDED.is_performer,
  subscribe_price = EXCLUDED.subscribe_price,
  avatar = EXCLUDED.avatar,
  about = EXCLUDED.about,
  last_seen = EXCLUDED.last_seen,
  join_date = EXCLUDED.join_date,
  favorited_count = EXCLUDED.favorited_count,
  posts_count = EXCLUDED.posts_count,
  medias_count = EXCLUDED.medias_count,
  raw_json = EXCLUDED.raw_json,
  updated_at = NOW();
""")

def to_bool(v):
    if pd.isna(v): return None
    if isinstance(v, bool): return v
    s = str(v).strip().lower()
    return True if s in ("true","1","yes","y","t") else False if s in ("false","0","no","n","f") else None

def to_num(v):
    try:
        if pd.isna(v): return None
        return float(v)
    except:
        return None

def to_int(v):
    try:
        if pd.isna(v): return None
        return int(float(v))
    except:
        return None

def to_ts(s):
    if pd.isna(s) or not s: return None
    try:
        # Handles ISO dates like "2025-10-26T00:03:09+00:00"
        return pd.to_datetime(s, utc=True)
    except:
        return None

def main():
    with engine.begin() as conn:
        conn.exec_driver_sql(DDL)

    df = pd.read_csv(CSV_PATH, encoding="utf-8")
    # Normalize column names we care about (present or not)
    # Use .get to avoid KeyErrors
    rows = []
    for _, r in df.iterrows():
        raw = r.to_dict()
        rows.append({
            "id": to_int(raw.get("id")),
            "username": (raw.get("username") or None),
            "name": (raw.get("name") or None),
            "location": (raw.get("location") or None),
            "is_verified": to_bool(raw.get("isVerified")),
            "is_performer": to_bool(raw.get("isPerformer")),
            "subscribe_price": to_num(raw.get("subscribePrice")),
            "avatar": (raw.get("avatar") or None),
            "about": (raw.get("about") or None),
            "last_seen": to_ts(raw.get("lastSeen")),
            "join_date": to_ts(raw.get("joinDate")),
            "favorited_count": to_int(raw.get("favoritedCount")),
            "posts_count": to_int(raw.get("postsCount")),
            "medias_count": to_int(raw.get("mediasCount")),
            "raw_json": json.dumps(raw, ensure_ascii=False)
        })

    # Batch insert (safe upserts)
    batch = 1000
    total = 0
    with engine.begin() as conn:
        for i in range(0, len(rows), batch):
            conn.execute(UPSERT_SQL, rows[i:i+batch])
            total += len(rows[i:i+batch])
            print(f"Upserted {total}/{len(rows)}")

    print("Done.")

if __name__ == "__main__":
    main()
