"""
Update country_report_extra_data.json:
- Replace CEE rank from Country_cee_temp.csv
- Add CEE score field
- Remove description field (now computed in code by score range)
"""
import json, csv, re
from pathlib import Path

BASE = Path(__file__).parent.parent

CSV_PATH  = BASE / 'public/data/statistics/xlsx/Country_cee_temp.csv'
JSON_PATH = BASE / 'public/data/text/country-notes/country_report_extra_data.json'

# --- read CSV (skip row 0 = section headers, row 1 = column headers) ---
cee_map = {}  # ISO -> {score, rank}
with open(CSV_PATH, newline='', encoding='utf-8') as f:
    reader = csv.reader(f)
    next(reader)          # skip section-header row
    header = next(reader) # column names
    # Locate columns
    col = {h.strip(): i for i, h in enumerate(header)}
    iso_col   = col['ISO']
    score_col = col['CEE global score']
    rank_col  = col['CEE Rank']

    for row in reader:
        iso = row[iso_col].strip()
        if not iso:
            continue
        raw_score = row[score_col].strip()
        raw_rank  = row[rank_col].strip()
        def to_int(v):
            try:
                return int(v)
            except (ValueError, TypeError):
                return None
        cee_map[iso] = {
            'score': to_int(raw_score),
            'rank':  to_int(raw_rank),
        }

print(f"Loaded CEE data for {len(cee_map)} countries from CSV")

# --- update JSON ---
with open(JSON_PATH, encoding='utf-8') as f:
    data = json.load(f)

updated = 0
for iso, country in data.items():
    if iso not in cee_map:
        print(f"  WARN: {iso} not in CSV")
        continue
    csv_cee = cee_map[iso]
    for key in ('cee_en', 'cee_fr'):
        if key not in country:
            country[key] = {}
        cee = country[key]
        # Remove old description field
        cee.pop('description', None)
        # Update/add score and rank
        cee['score'] = csv_cee['score']
        cee['rank']  = csv_cee['rank']
        # If no valid data (e.g. Libya), nullify year too
        if csv_cee['score'] is None:
            cee['year'] = None
        elif 'year' not in cee or cee.get('year') is None:
            cee['year'] = 2021
    updated += 1

print(f"Updated {updated} countries")

with open(JSON_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Done →", JSON_PATH)
