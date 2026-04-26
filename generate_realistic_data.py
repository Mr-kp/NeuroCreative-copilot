import pandas as pd
import numpy as np

# Set random seed for reproducibility
np.random.seed(42)

# Campaigns and Creatives definition
creatives = [
    {
        "creative_id": "APPLE-01",
        "campaign_id": "CMP-10",
        "advertiser_name": "Apple",
        "app_name": "iPhone 16 Pro",
        "vertical": "technology",
        "format": "video",
        "creative_status": "top_performer",
        "fatigue_day": np.nan,
        "base_cpm": 18.50,
        "base_ctr": 0.012,
        "base_cvr": 0.035,
        "base_aov": 999.00, # High AOV for Apple
        "daily_budget": 5000,
        "trend_factor": 1.01, # Slight growth
        "text_density": 0.05,
        "readability_score": 0.95,
        "brand_visibility_score": 0.98,
        "clutter_score": 0.1,
        "novelty_score": 0.90,
        "motion_score": 0.4,
        "faces_count": 1,
        "product_count": 1,
        "has_price": 0,
        "has_discount_badge": 0,
        "has_gameplay": 0,
        "has_ugc_style": 0,
        "duration_sec": 15,
        "emotional_tone": "sophisticated",
        "hook_type": "feature",
        "cta_text": "Learn More",
        "headline": "Pro Camera. Pro Display.",
        "dominant_color": "black",
        "language": "en",
        "asset_file": "assets/apple_ad.mp4",
        "perf_score": 0.94
    },
    {
        "creative_id": "NIKE-01",
        "campaign_id": "CMP-11",
        "advertiser_name": "Nike",
        "app_name": "Nike Training Club",
        "vertical": "apparel",
        "format": "video",
        "creative_status": "top_performer",
        "fatigue_day": np.nan,
        "base_cpm": 12.00,
        "base_ctr": 0.018,
        "base_cvr": 0.045,
        "base_aov": 120.00,
        "daily_budget": 3000,
        "trend_factor": 1.00, # Stable
        "text_density": 0.15,
        "readability_score": 0.85,
        "brand_visibility_score": 0.92,
        "clutter_score": 0.2,
        "novelty_score": 0.85,
        "motion_score": 0.85,
        "faces_count": 2,
        "product_count": 1,
        "has_price": 0,
        "has_discount_badge": 0,
        "has_gameplay": 0,
        "has_ugc_style": 1,
        "duration_sec": 30,
        "emotional_tone": "energetic",
        "hook_type": "lifestyle",
        "cta_text": "Shop Now",
        "headline": "Unlock Your Potential",
        "dominant_color": "black",
        "language": "en",
        "asset_file": "assets/nike_ad.mp4",
        "perf_score": 0.89
    },
    {
        "creative_id": "COKE-01",
        "campaign_id": "CMP-12",
        "advertiser_name": "Coca-Cola",
        "app_name": "Coke App",
        "vertical": "fmcg",
        "format": "banner",
        "creative_status": "stable",
        "fatigue_day": np.nan,
        "base_cpm": 6.50,
        "base_ctr": 0.008,
        "base_cvr": 0.015,
        "base_aov": 15.00,
        "daily_budget": 1500,
        "trend_factor": 0.995, # Slight decay but very slow
        "text_density": 0.1,
        "readability_score": 0.90,
        "brand_visibility_score": 0.99,
        "clutter_score": 0.15,
        "novelty_score": 0.40,
        "motion_score": 0.0,
        "faces_count": 0,
        "product_count": 1,
        "has_price": 0,
        "has_discount_badge": 0,
        "has_gameplay": 0,
        "has_ugc_style": 0,
        "duration_sec": 0,
        "emotional_tone": "happy",
        "hook_type": "brand",
        "cta_text": "Refresh Now",
        "headline": "Real Magic",
        "dominant_color": "red",
        "language": "en",
        "asset_file": "assets/coca_cola_ad.png",
        "perf_score": 0.68
    },
    {
        "creative_id": "MCD-01",
        "campaign_id": "CMP-13",
        "advertiser_name": "McDonalds",
        "app_name": "MyMcDonalds",
        "vertical": "food_delivery",
        "format": "banner",
        "creative_status": "fatigued",
        "fatigue_day": 14,
        "base_cpm": 9.00,
        "base_ctr": 0.015,
        "base_cvr": 0.060,
        "base_aov": 25.00,
        "daily_budget": 2000,
        "trend_factor": 0.92, # Fast decay after fatigue day
        "text_density": 0.20,
        "readability_score": 0.85,
        "brand_visibility_score": 0.95,
        "clutter_score": 0.4,
        "novelty_score": 0.30,
        "motion_score": 0.0,
        "faces_count": 0,
        "product_count": 3,
        "has_price": 1,
        "has_discount_badge": 1,
        "has_gameplay": 0,
        "has_ugc_style": 0,
        "duration_sec": 0,
        "emotional_tone": "appetizing",
        "hook_type": "craving",
        "cta_text": "Order Now",
        "headline": "Free Fries Friday",
        "dominant_color": "yellow",
        "language": "en",
        "asset_file": "assets/mcdonalds_ad.png",
        "perf_score": 0.41
    }
]

dates = pd.date_range(start="2026-03-27", end="2026-04-25")
total_days = len(dates)

daily_records = []

for c in creatives:
    spend = c["daily_budget"]
    ctr = c["base_ctr"]
    cvr = c["base_cvr"]
    cpm = c["base_cpm"]
    aov = c["base_aov"]
    
    for i, date in enumerate(dates):
        # Add noise
        daily_cpm = max(2.0, np.random.normal(cpm, cpm * 0.1))
        
        # Trend and fatigue logic
        if not pd.isna(c["fatigue_day"]) and i >= c["fatigue_day"]:
            days_since_fatigue = i - c["fatigue_day"]
            # Decay CTR and CVR significantly
            current_ctr = ctr * (c["trend_factor"] ** days_since_fatigue)
            current_cvr = cvr * (c["trend_factor"] ** days_since_fatigue)
            # Spend decreases as performance drops
            daily_spend = spend * (0.95 ** days_since_fatigue)
        else:
            current_ctr = ctr * (c["trend_factor"] ** i) if pd.isna(c["fatigue_day"]) else ctr
            current_cvr = cvr * (c["trend_factor"] ** i) if pd.isna(c["fatigue_day"]) else cvr
            daily_spend = spend
            
        daily_spend = max(100, np.random.normal(daily_spend, daily_spend * 0.1))
        
        current_ctr = max(0.001, np.random.normal(current_ctr, current_ctr * 0.15))
        current_cvr = max(0.001, np.random.normal(current_cvr, current_cvr * 0.15))
        
        impressions = int((daily_spend / daily_cpm) * 1000)
        clicks = int(impressions * current_ctr)
        conversions = int(clicks * current_cvr)
        revenue = conversions * max(1.0, np.random.normal(aov, aov * 0.1))
        
        daily_records.append({
            "creative_id": c["creative_id"],
            "date": date.strftime("%Y-%m-%d"),
            "campaign_id": c["campaign_id"],
            "impressions": impressions,
            "clicks": clicks,
            "conversions": conversions,
            "spend_usd": round(daily_spend, 2),
            "revenue_usd": round(revenue, 2)
        })

df_daily = pd.DataFrame(daily_records)
df_daily.to_csv("d:/files/videos/hackupc/neuralad/NeuroCreative-copilot/real_brands_daily.csv", index=False)

# Now aggregate creatives
creative_records = []
for c in creatives:
    df_c = df_daily[df_daily["creative_id"] == c["creative_id"]]
    total_days_active = len(df_c)
    total_spend = df_c["spend_usd"].sum()
    total_imps = df_c["impressions"].sum()
    total_clicks = df_c["clicks"].sum()
    total_convs = df_c["conversions"].sum()
    total_rev = df_c["revenue_usd"].sum()
    
    overall_ctr = total_clicks / total_imps if total_imps > 0 else 0
    overall_cvr = total_convs / total_clicks if total_clicks > 0 else 0
    overall_ipm = (total_convs / total_imps) * 1000 if total_imps > 0 else 0
    overall_roas = total_rev / total_spend if total_spend > 0 else 0
    
    # 7 day metrics
    df_first_7 = df_c.head(7)
    df_last_7 = df_c.tail(7)
    
    first_7d_ctr = df_first_7["clicks"].sum() / df_first_7["impressions"].sum() if df_first_7["impressions"].sum() > 0 else 0
    last_7d_ctr = df_last_7["clicks"].sum() / df_last_7["impressions"].sum() if df_last_7["impressions"].sum() > 0 else 0
    ctr_decay_pct = ((last_7d_ctr - first_7d_ctr) / first_7d_ctr * 100) if first_7d_ctr > 0 else 0
    
    first_7d_cvr = df_first_7["conversions"].sum() / df_first_7["clicks"].sum() if df_first_7["clicks"].sum() > 0 else 0
    last_7d_cvr = df_last_7["conversions"].sum() / df_last_7["clicks"].sum() if df_last_7["clicks"].sum() > 0 else 0
    cvr_decay_pct = ((last_7d_cvr - first_7d_cvr) / first_7d_cvr * 100) if first_7d_cvr > 0 else 0
    
    rec = {
        "creative_id": c["creative_id"],
        "campaign_id": c["campaign_id"],
        "advertiser_name": c["advertiser_name"],
        "app_name": c["app_name"],
        "vertical": c["vertical"],
        "format": c["format"],
        "creative_status": c["creative_status"],
        "fatigue_day": "" if pd.isna(c["fatigue_day"]) else int(c["fatigue_day"]),
        "total_days_active": total_days_active,
        "total_spend_usd": round(total_spend, 2),
        "total_impressions": total_imps,
        "total_clicks": total_clicks,
        "total_conversions": total_convs,
        "total_revenue_usd": round(total_rev, 2),
        "overall_ctr": round(overall_ctr, 4),
        "overall_cvr": round(overall_cvr, 4),
        "overall_ipm": round(overall_ipm, 2),
        "overall_roas": round(overall_roas, 2),
        "first_7d_ctr": round(first_7d_ctr, 4),
        "last_7d_ctr": round(last_7d_ctr, 4),
        "ctr_decay_pct": round(ctr_decay_pct, 1),
        "first_7d_cvr": round(first_7d_cvr, 4),
        "last_7d_cvr": round(last_7d_cvr, 4),
        "cvr_decay_pct": round(cvr_decay_pct, 1),
        "text_density": c["text_density"],
        "readability_score": c["readability_score"],
        "brand_visibility_score": c["brand_visibility_score"],
        "clutter_score": c["clutter_score"],
        "novelty_score": c["novelty_score"],
        "motion_score": c["motion_score"],
        "faces_count": c["faces_count"],
        "product_count": c["product_count"],
        "has_price": c["has_price"],
        "has_discount_badge": c["has_discount_badge"],
        "has_gameplay": c["has_gameplay"],
        "has_ugc_style": c["has_ugc_style"],
        "duration_sec": c["duration_sec"],
        "emotional_tone": c["emotional_tone"],
        "hook_type": c["hook_type"],
        "cta_text": c["cta_text"],
        "headline": c["headline"],
        "dominant_color": c["dominant_color"],
        "language": c["language"],
        "asset_file": c["asset_file"],
        "perf_score": c["perf_score"]
    }
    creative_records.append(rec)

df_creatives = pd.DataFrame(creative_records)
df_creatives.to_csv("d:/files/videos/hackupc/neuralad/NeuroCreative-copilot/real_brands_creatives.csv", index=False)
print("Data updated successfully.")
