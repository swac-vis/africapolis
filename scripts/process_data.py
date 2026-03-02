"""
Process Excel data files to JSON format.
- urban_metrics_results_100k_1000k.xlsx: Fixed_Mode and Moving_Mode sheets only
- Africapolis_country_2025__wENV.xlsx: Country (first) sheet only
- Africapolis_agglomeration_2025_wENV.xlsx: Agglomeration (first) sheet only
"""

import json
from pathlib import Path

import pandas as pd


def df_to_json_ready(df: pd.DataFrame) -> list[dict]:
    """Convert DataFrame to list of dicts with NaN -> None for valid JSON."""
    return json.loads(df.to_json(orient="records", date_format="iso", default_handler=str))


def process_urban_metrics(input_path: Path, output_dir: Path) -> None:
    """Process urban_metrics: Fixed_Mode and Moving_Mode sheets only."""
    xlsx = pd.ExcelFile(input_path)
    for sheet in ["Fixed_Mode", "Moving_Mode"]:
        df = pd.read_excel(xlsx, sheet_name=sheet)
        data = df_to_json_ready(df)
        out_path = output_dir / f"urban_metrics_{sheet.lower()}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"  -> {out_path.name} ({len(data)} records)")


def process_africapolis_country(input_path: Path, output_dir: Path) -> None:
    """Process Africapolis country: first (Country) sheet only."""
    df = pd.read_excel(input_path, sheet_name=0)
    data = df_to_json_ready(df)
    out_path = output_dir / "africapolis_country.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  -> {out_path.name} ({len(data)} records)")


def process_africapolis_agglomeration(input_path: Path, output_dir: Path) -> None:
    """Process Africapolis agglomeration: first (Agglomeration) sheet only."""
    df = pd.read_excel(input_path, sheet_name=0)
    data = df_to_json_ready(df)
    out_path = output_dir / "africapolis_agglomeration.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  -> {out_path.name} ({len(data)} records)")


def main() -> None:
    base = Path(__file__).resolve().parent.parent
    data_dir = base / "public" / "data"

    print("Processing Excel files...")
    print("\n1. urban_metrics_results_100k_1000k.xlsx (Fixed_Mode + Moving_Mode)")
    process_urban_metrics(
        data_dir / "urban_metrics_results_100k_1000k.xlsx",
        data_dir,
    )
    print("\n2. Africapolis_country_2025__wENV.xlsx (Country sheet)")
    process_africapolis_country(
        data_dir / "Africapolis_country_2025__wENV.xlsx",
        data_dir,
    )
    print("\n3. Africapolis_agglomeration_2025_wENV.xlsx (Agglomeration sheet)")
    process_africapolis_agglomeration(
        data_dir / "Africapolis_agglomeration_2025_wENV.xlsx",
        data_dir,
    )
    print("\nDone.")


if __name__ == "__main__":
    main()
