"""
Remove redundant/duplicate content from public/data/text:
1. Delete empty files
2. Delete obsolete files (e.g. _OLD)
3. Delete redundant story files (duplicate content, keep more complete version)
4. Fix duplicate descriptions within about.json files
"""

import json
from pathlib import Path


def main():
    base = Path(__file__).resolve().parent.parent
    text_dir = base / "public" / "data" / "text"

    # 1. Delete empty file
    empty = text_dir / "stories" / "fr_Mapping exposure of urban and rural .json"
    if empty.exists() and empty.stat().st_size == 0:
        empty.unlink()
        print(f"Deleted empty file: {empty.relative_to(text_dir)}")

    # 2. Delete obsolete file
    old = text_dir / "config" / "en_countries_OLD.json"
    if old.exists():
        old.unlink()
        print(f"Deleted obsolete file: {old.relative_to(text_dir)}")

    # 3. Delete redundant story files (list format vs full markdown - keep markdown;
    #    short patterns vs evidence-from-ethiopia - keep evidence, config references it)
    redundant_stories = [
        "stories/en_Mapping exposure of urban and rural.json",  # keep mapping-exposure-of-... (full markdown)
        "stories/fr_Mapping exposure of urban and rural .json",  # empty, may already be deleted
        "stories/en_patterns-of-urbanisation-and-economic-development.json",  # keep --evidence version
        "stories/fr_patterns-of-urbanisation-and-economic-development.json",  # keep --evidence version
    ]
    for rel in redundant_stories:
        p = text_dir / rel
        if p.exists():
            p.unlink()
            print(f"Deleted redundant: {rel}")

    # 4. Fix duplicate descriptions in about.json (narratives list items 1 & 2 had identical description)
    for name in ["en_about.json", "fr_about.json"]:
        p = text_dir / "config" / name
        if not p.exists():
            continue
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
        fixed = False
        narratives = data.get("narratives", {}).get("list", [])
        for item in narratives:
            if item.get("id") == 1 and item.get("url") == "informing-policies":
                # Fix id 1: was wrongly copy-pasted from id 2
                if "word city" in item.get("description", ""):
                    if "en_" in name:
                        item["description"] = "By 2050, Africa's cities will be home to an additional 950 million people, informing policies for Africa's urban future."
                    else:
                        item["description"] = "D'ici 2050, les villes d'Afrique accueilleront 950 millions de personnes supplémentaires, pour informer les politiques de l'avenir urbain du continent."
                    fixed = True
        if fixed:
            with open(p, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=None)
            print(f"Fixed duplicate description in: config/{name}")

    # 5. Recursively dedupe arrays (remove items with identical JSON content)
    for json_file in text_dir.rglob("*.json"):
        with open(json_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        new_data = dedupe_arrays(data)
        if json.dumps(new_data, sort_keys=True) != json.dumps(data, sort_keys=True):
            with open(json_file, "w", encoding="utf-8") as f:
                json.dump(new_data, f, ensure_ascii=False, indent=None)
            print(f"Deduped arrays in: {json_file.relative_to(text_dir)}")

    print("Done.")


def dedupe_arrays(obj):
    """Recursively remove duplicate items from arrays (keep first occurrence)."""
    if isinstance(obj, dict):
        return {k: dedupe_arrays(v) for k, v in obj.items()}
    if isinstance(obj, list):
        seen = set()
        result = []
        for item in obj:
            key = json.dumps(dedupe_arrays(item), sort_keys=True)
            if key not in seen:
                seen.add(key)
                result.append(dedupe_arrays(item))
        return result
    return obj


if __name__ == "__main__":
    main()
