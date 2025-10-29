# load_csv_to_supabase.py
"""
Robust CSV -> Supabase REST uploader (Windows/PowerShell friendly).

Features:
- Cleans NaN / ±inf -> null (JSON-safe)
- Lowercases column names
- Batching + retries
- Optional upsert with --on-conflict <col>
- --limit, --offset, --exclude-columns
- Timestamp normalizer (+0000 -> +00:00), safer bools
- Float->int fix: numbers like 563461.0 are sent as 563461 (int)
- Better error dumps (writes failed payload to failed_batch.json)

Usage examples:
  # smoke test 1 row
  python load_csv_to_supabase.py --csv onlyfans_profiles.csv --table onlyfans_profiles --limit 1 --batch-size 1 --upsert --on-conflict id

  # isolate a bad row (5 rows, one-by-one HTTP calls)
  python load_csv_to_supabase.py --csv onlyfans_profiles.csv --table onlyfans_profiles --limit 5 --batch-size 1 --upsert --on-conflict id

  # skip problematic columns for first big load
  python load_csv_to_supabase.py --csv onlyfans_profiles.csv --table onlyfans_profiles ^
    --exclude-columns raw_json,timestamp,firstpublishedpostdate,joindate,lastseen ^
    --batch-size 200 --upsert --on-conflict id

Env (do not hard-code keys):
  SUPABASE_URL, SUPABASE_SERVICE_ROLE
"""

import os
import sys
import json
import math
import time
import argparse
from typing import List, Dict, Any, Optional
import requests
import pandas as pd
import numpy as np
import re

# ---------------------------------
# Column type hints (best-effort)
# ---------------------------------
NUMERIC_GUESS_COLUMNS = {
    "subscriberscount","favoritedcount","favoritescount",
    "photoscount","postscount","mediascount","videoscount",
    "subscribeprice","currentsubscribeprice",
    "promotion1_id","promotion1_price","promotion1_discount",
    "promotion2_id","promotion2_price","promotion2_discount",
    "promotion3_id","promotion3_price","promotion3_discount",
    "bundle1_id","bundle1_discount","bundle1_duration","bundle1_price",
    "bundle2_id","bundle2_discount","bundle2_duration","bundle2_price",
    "bundle3_id","bundle3_discount","bundle3_duration","bundle3_price",
    "header_width","header_height","header_size",
    "tipsmax","tipsmin","tipsmininternal",
    "finishedstreamscount","archivedpostscount","privatearchivedpostscount",
    "success_attempt"
}

# NOTE: 'view' REMOVED from bools (it can be "f"/"t" or other)
BOOL_GUESS_COLUMNS = {
    "isverified","isadultcontent","isrestricted","isfriend","isperformer",
    "isspringconnected","isspotifyconnected","isreferrerallowed","isprivaterestriction",
    "ismarkdowndisabledforabout","showsubscriberscount","showpostsinfeed",
    "showmediacount","shouldshowfinishedstreams","subscribedisexpirednow",
    "subscribedonexpirednow","subscribedbyautoprolong","canaddsubscriber","canchat",
    "cancommentstory","cancreatepromotion","cancreatetrial","canearn","canlookstory",
    "canpayinternal","canreceivechatmessage","canreport","canrestrict","cantrialsend",
    "haslabels","haslinks","hasnotviewedstory","haspinnedposts","hassavedstreams",
    "hasscheduledstream","hasstories","hasstream","isblocked","tipstextenabled","tipsenabled"
}

# common date/time columns in your header
TIMESTAMP_GUESS_COLUMNS = {
    "firstpublishedpostdate","joindate","lastseen","timestamp"
}

# -----------------------------
# Normalizers
# -----------------------------
def normalize_bool_series(s: pd.Series) -> pd.Series:
    """Normalize truthy/falsey strings and numbers to real booleans (or None)."""
    if s.dtype == bool:
        return s
    mapping = {
        "true": True, "false": False,
        "t": True, "f": False,
        "1": True, "0": False,
        "yes": True, "no": False
    }
    def _coerce(x):
        if x is None:
            return None
        if isinstance(x, (bool, np.bool_)):
            return bool(x)
        if isinstance(x, (int, np.integer)):
            return bool(int(x))
        if isinstance(x, (float, np.floating)):
            if np.isnan(x):
                return None
            return bool(int(x))
        xs = str(x).strip().lower()
        if xs in mapping:
            return mapping[xs]
        if xs in ("", "none", "nan", "null"):
            return None
        return None
    return s.map(_coerce)

def normalize_timestamp_series(s: pd.Series) -> pd.Series:
    """
    Handles:
      - '...+0000' -> '...+00:00'
      - unparsable -> None
    """
    def fix_raw(v: Any) -> Optional[str]:
        if v is None:
            return None
        vs = str(v).strip()
        if vs == "" or vs.lower() in {"none","nan","null","false","true"}:
            return None
        # +0000 -> +00:00
        vs = re.sub(r"(\+|\-)(\d{2})(\d{2})$", r"\1\2:\3", vs)
        return vs

    s_fixed = s.map(fix_raw)
    parsed = pd.to_datetime(s_fixed, errors="coerce", utc=True)
    def to_iso(ts):
        if pd.isna(ts):
            return None
        return ts.isoformat().replace("+00:00","+00:00")
    return parsed.map(to_iso)

def coerce_types(df: pd.DataFrame) -> pd.DataFrame:
    for col in df.columns:
        lcol = col.lower()
        if lcol in NUMERIC_GUESS_COLUMNS:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        elif lcol in BOOL_GUESS_COLUMNS:
            df[col] = normalize_bool_series(df[col])
        elif lcol in TIMESTAMP_GUESS_COLUMNS:
            df[col] = normalize_timestamp_series(df[col])
    return df

# -----------------------------
# JSON safety
# -----------------------------
def scrub_scalar(v: Any) -> Any:
    """
    Convert pandas/NumPy scalars to plain JSON scalars.
    IMPORTANT: If a float is an integer value (e.g., 563461.0),
    cast it to int to satisfy Postgres INTEGER columns.
    """
    if v is None:
        return None

    # pandas missing sentinels
    if v is pd.NA or v is np.nan:
        return None

    # numpy bool -> bool
    if isinstance(v, (bool, np.bool_)):
        return bool(v)

    # numpy integer -> int
    if isinstance(v, (np.integer,)):
        return int(v)

    # float handling (numpy or python)
    if isinstance(v, (float, np.floating)):
        # NaN/Inf guard
        if (isinstance(v, float) and (math.isnan(v) or math.isinf(v))) or \
           (isinstance(v, np.floating) and (np.isnan(v) or np.isinf(v))):
            return None
        # If float is mathematically an integer, cast to int
        try:
            if float(v).is_integer():
                return int(float(v))
        except Exception:
            pass
        # else keep as float (prices etc.)
        return float(v)

    # plain int
    if isinstance(v, int):
        return v

    # everything else as-is (strings, dicts, etc.)
    return v

def scrub_row(row: Dict[str, Any]) -> Dict[str, Any]:
    return {k: scrub_scalar(v) for k, v in row.items()}

# -----------------------------
# HTTP
# -----------------------------
def post_batch(url: str, key: str, table: str, batch: List[Dict[str, Any]],
               upsert: bool, on_conflict: Optional[str],
               max_retries: int = 5, schema: Optional[str] = None) -> None:
    base = f"{url}/rest/v1"
    endpoint = f"{base}/{schema}:{table}" if schema else f"{base}/{table}"

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    params = {}
    if upsert:
        headers["Prefer"] = "resolution=merge-duplicates,return=minimal"
        if on_conflict:
            params["on_conflict"] = on_conflict

    safe_batch = [scrub_row(r) for r in batch]
    payload = json.dumps(safe_batch, allow_nan=False)

    last_text = ""
    for attempt in range(1, max_retries + 1):
        resp = requests.post(endpoint, headers=headers, params=params, data=payload, timeout=90)
        if 200 <= resp.status_code < 300:
            return
        last_text = resp.text
        retriable = resp.status_code in (408, 409, 429, 500, 502, 503, 504)
        if not retriable or attempt == max_retries:
            sys.stderr.write(f"\nERROR [{resp.status_code}] uploading batch: {resp.text}\n")
            try:
                with open("failed_batch.json", "w", encoding="utf-8") as f:
                    f.write(json.dumps(safe_batch, ensure_ascii=False, indent=2))
                sys.stderr.write("Wrote failing payload to failed_batch.json\n")
            except Exception as ex:
                sys.stderr.write(f"Could not write failed_batch.json: {ex}\n")
            resp.raise_for_status()
        time.sleep(min(2 ** attempt, 30))

# -----------------------------
# Main
# -----------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True, help="Path to CSV file")
    ap.add_argument("--table", required=True, help="Target table name (without schema)")
    ap.add_argument("--schema", default=None, help="Optional schema (e.g., public). If set, uses /rest/v1/<schema>:<table>")
    ap.add_argument("--batch-size", type=int, default=500, help="Rows per HTTP batch")
    ap.add_argument("--upsert", action="store_true", help="Use resolution=merge-duplicates upsert")
    ap.add_argument("--on-conflict", default=None, help="Column used for upsert conflict (e.g., id)")
    ap.add_argument("--limit", type=int, default=None, help="Only send the first N rows (after offset)")
    ap.add_argument("--offset", type=int, default=0, help="Skip the first K rows before sending")
    ap.add_argument("--exclude-columns", default="", help="Comma-separated list of columns to drop before upload")
    args = ap.parse_args()

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE")
    if not url or not key:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in environment.")

    print("✅ Connected to Supabase.")

    # Load CSV as text initially
    df = pd.read_csv(
        args.csv,
        encoding="utf-8",
        dtype=str,
        keep_default_na=False,
        na_values=["", "NaN", "nan", "NULL", "null"]
    )
    df.columns = [c.strip().lower() for c in df.columns]

    # Apply offset/limit early
    if args.offset:
        df = df.iloc[args.offset:]
    if args.limit:
        df = df.iloc[:args.limit]

    # Drop excluded columns (exact lowercased names)
    to_drop = [c.strip().lower() for c in args.exclude_columns.split(",") if c.strip()]
    if to_drop:
        keep = [c for c in df.columns if c not in to_drop]
        dropped = [c for c in df.columns if c in to_drop]
        if dropped:
            print(f"⚠️ Excluding columns: {dropped}")
        df = df[keep]

    # Type coercions (best-effort)
    df = coerce_types(df)

    # Replace ±inf, then convert all NA to None (JSON null)
    # (FutureWarning from pandas is safe to ignore)
    df = df.replace([np.inf, -np.inf], pd.NA)
    df = df.where(pd.notnull(df), None)

    total_rows = len(df)
    print(f"✅ Prepared {total_rows:,} rows from {args.csv}")
    print(f"✅ Columns being sent ({len(df.columns)}): {list(df.columns)}")

    records = df.to_dict(orient="records")

    # Batching
    batch_size = max(1, args.batch_size)
    uploaded = 0
    for i in range(0, total_rows, batch_size):
        batch = records[i:i+batch_size]
        batch = [scrub_row(r) for r in batch]
        try:
            post_batch(
                url, key, args.table, batch,
                upsert=args.upsert, on_conflict=args.on_conflict,
                schema=args.schema
            )
        except Exception as e:
            print(f"\n❌ Failed batch {i}-{i+len(batch)-1}: {e}")
            for idx, r in enumerate(batch[:3]):
                print(f"Example row {idx}:", r)
            sys.exit(1)
        uploaded += len(batch)
        print(f"✅ Uploaded {uploaded:,}/{total_rows:,} rows", end="\r", flush=True)

    print(f"\n🎉 Done. Uploaded {uploaded:,} rows to {args.table}.")

if __name__ == "__main__":
    main()
