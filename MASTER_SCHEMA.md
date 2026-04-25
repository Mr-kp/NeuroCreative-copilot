# master_creatives.csv — Schema

_Generated: 2026-04-25T16:16:55_

**1,080 rows × 81 columns** (one row per `creative_id`).


## Column groups

### IDs
- `creative_id`  *Int64*
- `campaign_id`  *Int64*
- `advertiser_id`  *Int64*

### Names
- `advertiser_name`  *object*
- `app_name`  *object*

### Dimensions
- `vertical`  *object*
- `format`  *object*
- `language`  *object*
- `theme`  *object*
- `hook_type`  *object*
- `cta_text`  *object*
- `dominant_color`  *object*
- `emotional_tone`  *object*
- `objective`  *object*
- `primary_theme`  *object*
- `target_age_segment`  *object*
- `target_os`  *object*
- `countries`  *object*
- `hq_region`  *object*
- `kpi_goal`  *object*

### Dates
- `creative_launch_date`  *datetime64[ns]*
- `campaign_start_date`  *datetime64[ns]*
- `campaign_end_date`  *datetime64[ns]*

### Visual features
- `width`  *int64*
- `height`  *int64*
- `duration_sec`  *int64*
- `text_density`  *float64*
- `copy_length_chars`  *int64*
- `readability_score`  *float64*
- `brand_visibility_score`  *float64*
- `clutter_score`  *float64*
- `novelty_score`  *float64*
- `motion_score`  *float64*
- `faces_count`  *int64*
- `product_count`  *int64*
- `has_price`  *int64*
- `has_discount_badge`  *int64*
- `has_gameplay`  *int64*
- `has_ugc_style`  *int64*
- `headline`  *object*
- `subhead`  *object*
- `asset_file`  *object*

### Lifetime raw
- `total_days_active`  *int64*
- `total_impressions`  *int64*
- `total_clicks`  *int64*
- `total_conversions`  *int64*
- `total_spend_usd`  *float64*
- `total_revenue_usd`  *float64*
- `daily_budget_usd`  *int64*

### Lifetime derived
- `overall_ctr`  *float64*
- `overall_cvr`  *float64*
- `overall_ipm`  *float64*
- `overall_roas`  *float64*
- `cpc_usd`  *float64*
- `cpa_usd`  *float64*

### Fatigue metrics
- `first_7d_ctr`  *float64*
- `last_7d_ctr`  *float64*
- `ctr_decay_pct`  *float64*
- `first_7d_cvr`  *float64*
- `last_7d_cvr`  *float64*
- `cvr_decay_pct`  *float64*
- `peak_rolling_ctr_5`  *float64*
- `fatigue_day`  *float64* (nulls: 881)

### Synthetic ground truth (validation only)
- `creative_status`  *object*
- `perf_score`  *float64*

### Our derived columns
- `ctr_pct_rank_in_vertical`  *float64*
- `roas_pct_rank_in_vertical`  *float64*
- `health_score`  *float64*
- `is_fatigued_recoverable`  *int64*
- `recommended_action`  *object*

## Key derived columns explained

- **`health_score`** (0–1): blend of in-vertical CTR rank (40%), ROAS rank (40%), and decay component (20%). Replaces the opaque synthetic `perf_score` with a transparent score.
- **`is_fatigued_recoverable`** (0/1): creative is flagged `fatigued` AND its lifetime CTR and ROAS are above the median for stable creatives. These are former winners worth refreshing.
- **`recommended_action`**: SCALE / REFRESH / PAUSE / HOLD / TEST. Rules-based v0; Member 2 can swap in a model.

## Row count contract

`master_creatives.csv` MUST have exactly 1,080 rows. If your downstream code produces a different count after a join, you have a bug.
