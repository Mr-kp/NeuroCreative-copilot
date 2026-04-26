import os
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_DIR = os.path.join(BASE_DIR, "Smadex_Creative_Intelligence_Dataset_FULL")
OUTPUT_DIR = os.path.join(BASE_DIR, "data")

os.makedirs(OUTPUT_DIR, exist_ok=True)

advertisers = pd.read_csv(os.path.join(SOURCE_DIR, "advertisers.csv"))
campaigns = pd.read_csv(os.path.join(SOURCE_DIR, "campaigns.csv"))
creatives = pd.read_csv(os.path.join(SOURCE_DIR, "creatives.csv"))
creative_summary = pd.read_csv(os.path.join(SOURCE_DIR, "creative_summary.csv"))
campaign_summary = pd.read_csv(os.path.join(SOURCE_DIR, "campaign_summary.csv"))
daily_stats = pd.read_csv(os.path.join(SOURCE_DIR, "creative_daily_country_os_stats.csv"))

campaign_merge_cols = [
    "campaign_id",
    "advertiser_id",
    "objective",
    "primary_theme",
    "target_age_segment",
    "target_os",
    "countries",
    "start_date",
    "end_date",
    "daily_budget_usd",
    "kpi_goal",
]

campaign_subset = campaigns[campaign_merge_cols].rename(
    columns={"primary_theme": "campaign_theme"}
)

master_creatives = creative_summary.merge(campaign_subset, on="campaign_id", how="left")
master_creatives = master_creatives.merge(
    advertisers[["advertiser_id", "hq_region"]], on="advertiser_id", how="left"
)

master_creatives.to_csv(os.path.join(OUTPUT_DIR, "master_creatives.csv"), index=False)

daily_agg = (
    daily_stats.groupby(["date", "creative_id", "campaign_id"])
    .agg(
        impressions=("impressions", "sum"),
        clicks=("clicks", "sum"),
        conversions=("conversions", "sum"),
        spend_usd=("spend_usd", "sum"),
        revenue_usd=("revenue_usd", "sum"),
        days_since_launch=("days_since_launch", "max"),
    )
    .reset_index()
)

daily_agg["ctr"] = np.where(
    daily_agg["impressions"] > 0,
    daily_agg["clicks"] / daily_agg["impressions"],
    np.nan,
)
daily_agg["cvr"] = np.where(
    daily_agg["clicks"] > 0,
    daily_agg["conversions"] / daily_agg["clicks"],
    np.nan,
)
daily_agg["roas"] = np.where(
    daily_agg["spend_usd"] > 0,
    daily_agg["revenue_usd"] / daily_agg["spend_usd"],
    np.nan,
)

daily_agg.to_csv(os.path.join(OUTPUT_DIR, "daily_fatigue_table.csv"), index=False)

print("=" * 60)
print("VALIDATION")
print("=" * 60)

check1 = len(master_creatives) == 1080
print(f"1. master_creatives rows == 1080: {'PASS' if check1 else 'FAIL'} (got {len(master_creatives)})")

check2 = master_creatives["creative_id"].nunique() == 1080
print(f"2. master_creatives unique creative_id == 1080: {'PASS' if check2 else 'FAIL'} (got {master_creatives['creative_id'].nunique()})")

check3 = len(daily_agg) > 10000
print(f"3. daily_fatigue_table rows > 10000: {'PASS' if check3 else 'FAIL'} (got {len(daily_agg)})")

check4 = daily_agg["creative_id"].nunique() == 1080
print(f"4. daily_fatigue_table unique creative_id == 1080: {'PASS' if check4 else 'FAIL'} (got {daily_agg['creative_id'].nunique()})")

print()
print("NaN counts in daily_fatigue_table:")
print(f"  ctr:  {daily_agg['ctr'].isna().sum()}")
print(f"  cvr:  {daily_agg['cvr'].isna().sum()}")
print(f"  roas: {daily_agg['roas'].isna().sum()}")

print()
print("creative_status distribution:")
print(master_creatives["creative_status"].value_counts().to_string())

print()
print("master_creatives first 3 rows:")
print(master_creatives.head(3).to_string())

print()
print("daily_fatigue_table first 3 rows:")
print(daily_agg.head(3).to_string())
