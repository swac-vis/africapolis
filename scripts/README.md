# Data Processing Scripts

## Setup

```bash
pip install -r scripts/requirements.txt
```

## Usage

```bash
python scripts/process_data.py
```

Processes Excel files in `public/data/` and outputs JSON:

| Input | Output |
|-------|--------|
| urban_metrics_results_100k_1000k.xlsx (Fixed_Mode, Moving_Mode) | urban_metrics_fixed_mode.json, urban_metrics_moving_mode.json |
| Africapolis_country_2025__wENV.xlsx (Country) | africapolis_country.json |
| Africapolis_agglomeration_2025_wENV.xlsx (Agglomeration) | africapolis_agglomeration.json |

## Text data deduplication

```bash
python scripts/dedupe_text.py
```

Removes redundant content from `public/data/text/`: empty files, obsolete files (_OLD), duplicate story files (keeps the more complete version), and fixes duplicate descriptions in about config.
