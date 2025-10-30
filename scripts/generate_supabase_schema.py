import pandas as pd

# Load your CSV file
df = pd.read_csv("onlyfans_profiles.csv")

print(f"Loaded {len(df)} rows and {len(df.columns)} columns")

# Detect column types
sql_types = {
    "object": "text",
    "float64": "numeric",
    "int64": "bigint",
    "bool": "boolean"
}

lines = []
for col, dtype in df.dtypes.items():
    col_clean = col.strip().replace(" ", "_").replace("-", "_")
    pg_type = sql_types.get(str(dtype), "text")
    lines.append(f'    "{col_clean}" {pg_type}')

schema = (
    "create table public.onlyfans_profiles (\n" +
    ",\n".join(lines) +
    "\n);"
)

# Save to .sql file
with open("create_onlyfans_profiles.sql", "w", encoding="utf-8") as f:
    f.write(schema)

print("✅ SQL schema generated: create_onlyfans_profiles.sql")
