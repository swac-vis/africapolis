import json
from pathlib import Path


def main():
  base_dir = Path(__file__).parent
  json_path = base_dir / "country_report_extra_data.json"

  text = json_path.read_text(encoding="utf-8")
  data = json.loads(text)

  extra_text_keys = [
    "spatial_features_en",
    "spatial_features_fr",
    "urban_forms_en",
    "urban_forms_fr",
    "territorial_en",
    "territorial_fr",
  ]

  updated = 0
  for iso, obj in data.items():
    if not isinstance(obj, dict):
      continue
    changed_here = False
    for key in extra_text_keys:
      if key not in obj:
        obj[key] = ""
        changed_here = True
    if changed_here:
      updated += 1

  json_path.write_text(
    json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8"
  )
  print(f"Updated {updated} country entries")


if __name__ == "__main__":
  main()

