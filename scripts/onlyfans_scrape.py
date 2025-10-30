from flask import Flask, request, render_template, jsonify
import pandas as pd
import numpy as np
import json
import re

app = Flask(__name__)

# Load your dataset
df = pd.read_csv("temp.csv", encoding="utf-8")

def clean_value(v):
    """Clean individual value for JSON serialization"""
    if v is None:
        return None
    if isinstance(v, float):
        if np.isnan(v) or np.isinf(v):
            return None
        return float(v)
    if isinstance(v, str):
        if v.strip().lower() in ["nan", "none", "null", "inf", "-inf"]:
            return None
        # Replace textual NaN in embedded JSON
        return re.sub(r'\bNaN\b', 'null', v)
    return v

def sanitize_records(df):
    """Sanitize DataFrame to JSON-safe Python objects"""
    records = df.to_dict(orient="records")
    for rec in records:
        for k, v in rec.items():
            rec[k] = clean_value(v)
    return records

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/search")
def search():
    q = request.args.get("q", "").strip().lower()
    verified = request.args.get("verified", "").strip().lower()
    price = request.args.get("price", "").strip()

    res = df.copy()

    # --- Text search ---
    if q:
        cols = [c for c in ["about", "username", "name", "location", "id"] if c in res.columns]
        mask = pd.Series(False, index=res.index)
        for c in cols:
            mask |= res[c].astype(str).str.lower().str.contains(q, na=False)
        res = res[mask]

    # --- Verified filter ---
    if verified == "true" and "isVerified" in res.columns:
        res = res[res["isVerified"] == True]

    # --- Price filter ---
    if price and "subscribePrice" in res.columns:
        try:
            price_val = float(price)
            res = res[res["subscribePrice"].astype(float) <= price_val]
        except:
            pass

    # --- Clean up before returning ---
    sanitized = sanitize_records(res.head(100))

    # Now dump safely — will raise error if any NaN remains
    try:
        payload = json.dumps(sanitized, ensure_ascii=False, allow_nan=False)
    except ValueError:
        # Fallback: replace NaN text manually
        payload = json.dumps(json.loads(json.dumps(sanitized, default=str)).replace("NaN", "null"))

    return app.response_class(payload, status=200, mimetype="application/json")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")
