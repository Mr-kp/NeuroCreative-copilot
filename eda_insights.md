# Smadex EDA & Schema Map

_Generated: 2026-04-25T11:52:40_

_Source of truth for Members 2 (ML), 3 (frontend), 4 (insights). If you need to change a column convention, ping the team in chat first._


## Tables (row counts)

- `advertisers.csv` — **36** rows × 4 cols
- `campaigns.csv` — **180** rows × 14 cols
- `creatives.csv` — **1,080** rows × 32 cols
- `creative_summary.csv` — **1,080** rows × 59 cols
- `creative_daily_country_os_stats.csv` — **192,315** rows × 14 cols
- `campaign_summary.csv` — **180** rows × 22 cols

## Join graph

```
advertisers
    └── campaigns           (FK: advertiser_id)
            └── creatives             (FK: campaign_id)
                    ├── creative_summary       (PK: creative_id)
                    └── creative_daily_country_os_stats   (composite PK: creative_id, date, country, os)
```

## Master table recipe (Phase 2)

`master_creatives.csv` = one row per creative_id, built from:

```
creative_summary  (spine — one row per creative_id, pre-computed metrics)
  ⟵ creatives          ON creative_id  (visual features, asset_file)
  ⟵ campaigns          ON campaign_id  (objective, primary_theme)
  ⟵ advertisers        ON advertiser_id  (hq_region)
```

Use **left joins from `creative_summary`** so we never lose a creative. After every join, assert `len(master) == len(creative_summary)`.

## Daily fatigue table recipe (Phase 3)

`daily_fatigue_table.csv` = `creative_daily_country_os_stats` aggregated to creative × date (collapse country/OS for the main fatigue signal). Keep the country/OS-level table too as `daily_fatigue_country_os.csv` for slice analysis.

## Conventions (locked)

- ID columns are `Int64` (nullable). Don't cast to float.
- Date columns are `pd.Timestamp` (UTC-naive).
- Spend/revenue use the `_usd` suffix.
- Metrics: `ctr = clicks/impressions`, `cvr = conversions/clicks`, `cpc = spend/clicks`, `cpa = spend/conversions`, `roas = revenue/spend`. Divide-by-zero → `NaN`, never `inf`.
- `creative_status` is the synthetic ground-truth label — **use only for validation**, not as a model input.
- Asset files live under: `/Users/ledafarouk/Downloads/Smadex_Creative_Intelligence_Dataset_FULL`

## Insights placeholder (Phase 4)

_Add 5 strong insights here. Each must include: number, sample size filter, and a one-line "so what."_
