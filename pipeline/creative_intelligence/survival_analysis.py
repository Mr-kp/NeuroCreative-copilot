import os
import sys
import warnings
warnings.filterwarnings("ignore")

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from lifelines import KaplanMeierFitter, CoxPHFitter
from sklearn.preprocessing import LabelEncoder

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
CHARTS_DIR = os.path.join(BASE_DIR, "charts")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(CHARTS_DIR, exist_ok=True)

print("=" * 60)
print("SURVIVAL ANALYSIS — Creative Fatigue")
print("=" * 60)

print("\n[1/4] Loading data...")
df = pd.read_csv(os.path.join(DATA_DIR, "master_creatives.csv"))
print(f"  Loaded {len(df):,} creatives")

print("\n[2/4] Preparing survival data...")
surv = df[[
    "creative_id", "creative_status", "fatigue_day", "total_days_active",
    "vertical", "format", "dominant_color", "emotional_tone",
    "novelty_score", "motion_score", "text_density", "clutter_score",
    "brand_visibility_score", "readability_score", "duration_sec",
    "faces_count", "product_count",
    "has_price", "has_discount_badge", "has_gameplay", "has_ugc_style"
]].copy()

surv["event"] = (surv["creative_status"] == "fatigued").astype(int)
surv["duration"] = np.where(
    surv["event"] == 1,
    surv["fatigue_day"].fillna(surv["total_days_active"]),
    surv["total_days_active"]
)

surv["is_video"] = (surv["duration_sec"] > 0).astype(int)

print(f"  Events (fatigued): {surv['event'].sum()}")
print(f"  Censored: {(surv['event'] == 0).sum()}")
print(f"  Median duration: {surv['duration'].median():.0f} days")

numeric_features = [
    "novelty_score", "motion_score", "text_density", "clutter_score",
    "brand_visibility_score", "readability_score", "duration_sec",
    "faces_count", "product_count"
]
binary_features = [
    "has_price", "has_discount_badge", "has_gameplay", "has_ugc_style", "is_video"
]
categorical_features = ["vertical", "format", "dominant_color", "emotional_tone"]

label_encoders = {}
for col in categorical_features:
    le = LabelEncoder()
    surv[col + "_enc"] = le.fit_transform(surv[col].astype(str))
    label_encoders[col] = le

cox_features = numeric_features + binary_features + [c + "_enc" for c in categorical_features]

print("\n[3/4] Fitting Kaplan-Meier curves...")

kmf = KaplanMeierFitter()
kmf.fit(surv["duration"], event_observed=surv["event"])

fig, ax = plt.subplots(figsize=(10, 6))
kmf.plot_survival_function(ax=ax, ci_show=True, color="#2c3e50", linewidth=2)
median_overall = kmf.median_survival_time_
ax.set_xlabel("Days Since Launch", fontsize=12)
ax.set_ylabel("P(not fatigued)", fontsize=12)
ax.set_title("Overall Kaplan-Meier Survival Curve — Creative Fatigue", fontsize=14, fontweight="bold")
ax.legend(["Overall (all creatives)"], loc="upper right", fontsize=10)
ax.set_xlim(0, None)
ax.set_ylim(0, 1.02)
plt.tight_layout()
plt.savefig(os.path.join(CHARTS_DIR, "survival_curve_overall.png"), dpi=200)
plt.close(fig)
print(f"  Saved survival_curve_overall.png")
print(f"  Overall median fatigue-free lifespan: {median_overall} days")

vertical_colors = {
    "gaming": "#e74c3c",
    "ecommerce": "#3498db",
    "fintech": "#2ecc71",
    "travel": "#f39c12",
    "food_delivery": "#9b59b6",
    "entertainment": "#1abc9c"
}

fig, ax = plt.subplots(figsize=(11, 7))
vertical_medians = {}
for vert in sorted(surv["vertical"].unique()):
    mask = surv["vertical"] == vert
    kmf_v = KaplanMeierFitter()
    kmf_v.fit(surv.loc[mask, "duration"], event_observed=surv.loc[mask, "event"], label=vert)
    kmf_v.plot_survival_function(
        ax=ax, ci_show=True,
        color=vertical_colors.get(vert, None), linewidth=1.8
    )
    vertical_medians[vert] = kmf_v.median_survival_time_

ax.set_xlabel("Days Since Launch", fontsize=12)
ax.set_ylabel("P(not fatigued)", fontsize=12)
ax.set_title("Kaplan-Meier Survival Curves by Vertical", fontsize=14, fontweight="bold")
ax.legend(loc="upper right", fontsize=10, framealpha=0.9)
ax.set_xlim(0, None)
ax.set_ylim(0, 1.02)
plt.tight_layout()
plt.savefig(os.path.join(CHARTS_DIR, "survival_curve_by_vertical.png"), dpi=200)
plt.close(fig)
print(f"  Saved survival_curve_by_vertical.png")

format_colors = {
    "banner": "#e67e22",
    "interstitial": "#2980b9",
    "native": "#27ae60",
    "rewarded_video": "#8e44ad",
    "playable": "#c0392b"
}

fig, ax = plt.subplots(figsize=(11, 7))
format_medians = {}
for fmt in sorted(surv["format"].unique()):
    mask = surv["format"] == fmt
    kmf_f = KaplanMeierFitter()
    kmf_f.fit(surv.loc[mask, "duration"], event_observed=surv.loc[mask, "event"], label=fmt)
    kmf_f.plot_survival_function(
        ax=ax, ci_show=True,
        color=format_colors.get(fmt, None), linewidth=1.8
    )
    format_medians[fmt] = kmf_f.median_survival_time_

ax.set_xlabel("Days Since Launch", fontsize=12)
ax.set_ylabel("P(not fatigued)", fontsize=12)
ax.set_title("Kaplan-Meier Survival Curves by Format", fontsize=14, fontweight="bold")
ax.legend(loc="upper right", fontsize=10, framealpha=0.9)
ax.set_xlim(0, None)
ax.set_ylim(0, 1.02)
plt.tight_layout()
plt.savefig(os.path.join(CHARTS_DIR, "survival_curve_by_format.png"), dpi=200)
plt.close(fig)
print(f"  Saved survival_curve_by_format.png")

print("\n[4/4] Fitting Cox Proportional Hazards model...")
cox_data = surv[["duration", "event"] + cox_features].copy()
cox_data = cox_data.dropna()

cph = CoxPHFitter()
cph.fit(cox_data, duration_col="duration", event_col="event", show_progress=False)

print("\n--- CoxPH Summary ---")
cph.print_summary(columns=["coef", "exp(coef)", "p"])

summary_df = cph.summary.copy()
summary_df = summary_df.reset_index()
summary_df = summary_df.rename(columns={
    summary_df.columns[0]: "feature",
    "exp(coef)": "hazard_ratio",
    "p": "p_value"
})
hazard_df = summary_df[["feature", "coef", "hazard_ratio", "p_value"]].copy()
hazard_df = hazard_df.sort_values("hazard_ratio", ascending=False).reset_index(drop=True)
hazard_df.to_csv(os.path.join(DATA_DIR, "cox_hazard_ratios.csv"), index=False)
print(f"\n  Saved cox_hazard_ratios.csv ({len(hazard_df)} features)")

print("\n" + "=" * 60)
print("KEY FINDINGS")
print("=" * 60)

print(f"\n  Overall median fatigue-free lifespan: {median_overall} days")

print("\n  Median fatigue-free lifespan by vertical:")
for vert, med in sorted(vertical_medians.items(), key=lambda x: x[1] if x[1] != np.nan else float("inf")):
    if pd.isna(med):
        print(f"    {vert:>15s}: > max observation (no median reached)")
    else:
        print(f"    {vert:>15s}: {med:.0f} days")

print("\n  Top 5 highest fatigue-risk features (highest hazard ratio):")
top5_risk = hazard_df.head(5)
for _, row in top5_risk.iterrows():
    feat = row["feature"]
    hr = row["hazard_ratio"]
    pval = row["p_value"]
    pct_faster = (hr - 1) * 100
    sig = "*" if pval < 0.05 else ""
    print(f"    {feat:<30s}  HR={hr:.3f}  ({pct_faster:+.1f}% fatigue rate)  p={pval:.4f}{sig}")

print("\n  Top 5 most protective features (lowest hazard ratio):")
top5_protect = hazard_df.tail(5).iloc[::-1]
for _, row in top5_protect.iterrows():
    feat = row["feature"]
    hr = row["hazard_ratio"]
    pval = row["p_value"]
    pct_slower = (1 - hr) * 100
    sig = "*" if pval < 0.05 else ""
    print(f"    {feat:<30s}  HR={hr:.3f}  ({pct_slower:.1f}% less fatigue)  p={pval:.4f}{sig}")

print("\n  --- NeuroCreative Copilot Insight ---")
top_feature = hazard_df.iloc[0]
top_name = top_feature["feature"]
top_hr = top_feature["hazard_ratio"]
top_pct = (top_hr - 1) * 100
print(f'  "Creatives with high {top_name} (HR={top_hr:.2f}) fatigue {top_pct:.0f}% faster."')

protect_feature = hazard_df.iloc[-1]
prot_name = protect_feature["feature"]
prot_hr = protect_feature["hazard_ratio"]
prot_pct = (1 - prot_hr) * 100
print(f'  "Creatives with high {prot_name} (HR={prot_hr:.2f}) show {prot_pct:.0f}% less fatigue risk."')

print("\n" + "=" * 60)
print("DONE — All outputs saved to data/ and charts/")
print("=" * 60)
