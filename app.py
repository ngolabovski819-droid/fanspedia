import os, math
from flask import Flask, jsonify, request, render_template
import requests

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError("Set SUPABASE_URL and SUPABASE_ANON_KEY env vars first.")

TABLE = "onlyfans_profiles"

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/search")
def search():
    q = (request.args.get("q") or "").strip()
    verified = (request.args.get("verified") or "").strip().lower()  # "true" / "false" / ""
    max_price = (request.args.get("price") or "").strip()
    page = int(request.args.get("page", 1))
    page_size = max(1, min(int(request.args.get("page_size", 24)), 100))

    # Build PostgREST query
    # Select only the fields your UI needs
    select_cols = ",".join([
        "id","username","name","location","avatar",
        "isverified","subscribeprice","header","avatar_c50","avatar_c144"
    ])
    base = f"{SUPABASE_URL}/rest/v1/{TABLE}"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Accept-Profile": "public",
        "Content-Profile": "public",
        "Prefer": "count=exact"
    }

    params = {
        "select": select_cols,
        "order": "favoritedcount.desc,subscribeprice.asc",
        "limit": str(page_size),
        "offset": str((page - 1) * page_size),
    }

    # Filters
    filters = []

    # free-text q over username/name/location/about (use existing columns)
    if q:
        # Use ILIKE with or= if multiple fields exist
        ors = []
        # Adjust these field names to your table (snake or lower)
        for col in ["username","name","location","about"]:
            ors.append(f"{col}.ilike.*{q}*")
        params["or"] = "({})".format(",".join(ors))

    if verified in ("true","false"):
        params["isverified"] = f"eq.{'true' if verified=='true' else 'false'}"

    if max_price:
        try:
            # allow 0 (free) → price <= max_price
            params["subscribeprice"] = f"lte.{float(max_price)}"
        except:
            pass

    # Call Supabase
    r = requests.get(base, headers=headers, params=params, timeout=20)
    if not r.ok:
        return jsonify({"error": True, "status": r.status_code, "message": r.text}), 500

    data = r.json()

    # Parse content-range header for total count
    total = None
    cr = r.headers.get("content-range")  # e.g. "0-23/9587"
    if cr and "/" in cr:
        total = int(cr.split("/")[-1])

    return jsonify({
        "results": data,
        "page": page,
        "page_size": page_size,
        "total": total,
        "pages": (math.ceil(total/page_size) if total is not None else None)
    })

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")
