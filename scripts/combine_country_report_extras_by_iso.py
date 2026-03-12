"""
Combine exported Country Report extras into a single JSON keyed by ISO3.

Input (produced by export_country_report_extras_for_newWebsite.py):
- public/json/countries/temp/newWebsite_support/cee_scores_en.json
- public/json/countries/temp/newWebsite_support/cee_scores_fr.json
- public/json/countries/temp/newWebsite_support/urban_planning_practice_en.json
- public/json/countries/temp/newWebsite_support/country_large_agglomerations.json

Output:
- public/json/countries/temp/newWebsite_support/country_report_extras_by_iso.json

Schema:
{
  "AGO": {
    "cee_en": { ... },
    "cee_fr": { ... },
    "urban_planning_en": { ... },
    "large_agglomerations": { ... }
  },
  "NER": { ... }
}
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict


def load_json(path: Path) -> Dict[str, Any]:
  if not path.exists():
    return {}
  with path.open("r", encoding="utf-8") as f:
    data = json.load(f)
  if isinstance(data, dict):
    return data
  # we expect dicts keyed by ISO; if not, return empty
  return {}


def main() -> None:
  root = Path(__file__).resolve().parent.parent
  out_dir = root / "public" / "json" / "countries" / "temp" / "newWebsite_support"

  cee_en = load_json(out_dir / "cee_scores_en.json")
  cee_fr = load_json(out_dir / "cee_scores_fr.json")
  urban_planning_en = load_json(out_dir / "urban_planning_practice_en.json")
  large_agglos = load_json(out_dir / "country_large_agglomerations.json")

  all_isos = set(cee_en.keys()) | set(cee_fr.keys()) | set(urban_planning_en.keys()) | set(large_agglos.keys())

  combined: Dict[str, Dict[str, Any]] = {}
  for iso in sorted(all_isos):
    entry: Dict[str, Any] = {}
    if iso in cee_en:
      entry["cee_en"] = cee_en[iso]
    if iso in cee_fr:
      entry["cee_fr"] = cee_fr[iso]
    if iso in urban_planning_en:
      entry["urban_planning_en"] = urban_planning_en[iso]
    if iso in large_agglos:
      entry["large_agglomerations"] = large_agglos[iso]
    combined[iso] = entry

  out_path = out_dir / "country_report_extras_by_iso.json"
  with out_path.open("w", encoding="utf-8") as f:
    json.dump(combined, f, ensure_ascii=False, indent=2)

  print("Wrote", out_path)


if __name__ == "__main__":
  main()

