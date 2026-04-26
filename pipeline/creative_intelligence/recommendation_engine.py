import os
import sys
import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
CHARTS_DIR = os.path.join(BASE_DIR, "charts")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(CHARTS_DIR, exist_ok=True)

master_path = os.path.join(DATA_DIR, "master_creatives.csv")
decay_path = os.path.join(DATA_DIR, "decay_features.csv")
preds_path = os.path.join(DATA_DIR, "ml_predictions.csv")
cox_path = os.path.join(DATA_DIR, "cox_hazard_ratios.csv")
output_path = os.path.join(DATA_DIR, "model_outputs.csv")
chart_path = os.path.join(CHARTS_DIR, "recommendation_distribution.png")

print("Loading data files...")
master = pd.read_csv(master_path)
decay = pd.read_csv(decay_path)
preds = pd.read_csv(preds_path)
cox = pd.read_csv(cox_path)

print(f"  master_creatives.csv : {master.shape}")
print(f"  decay_features.csv   : {decay.shape}")
print(f"  ml_predictions.csv   : {preds.shape}")
print(f"  cox_hazard_ratios.csv: {cox.shape}")

merged = master.merge(decay, on="creative_id", how="left")
merged = merged.merge(preds, on="creative_id", how="left")

print(f"\nMerged dataset: {merged.shape[0]} rows, {merged.shape[1]} columns")

RECOMMENDATION_ORDER = ["Scale", "Pivot Creative", "Refresh Soon", "Pause", "Monitor"]

def get_recommendation(row):
    fp = row.get("fatigue_probability", 0)
    status = row.get("predicted_status", "stable")
    roas = row.get("overall_roas", 0)
    ctr_decay = row.get("ctr_decay_pct", 0)
    decay_rate = row.get("decay_rate_prophet", None)
    half_life = row.get("half_life_days", None)

    if pd.isna(fp):
        fp = 0
    if pd.isna(roas):
        roas = 0
    if pd.isna(ctr_decay):
        ctr_decay = 0

    if fp > 0.7 and (ctr_decay < -0.7 or (pd.notna(decay_rate) and decay_rate < -0.0001)):
        return "Pivot Creative"
    elif fp > 0.5 and ctr_decay < -0.5:
        return "Refresh Soon"
    elif status == "top_performer" and roas > 2.0 and fp < 0.3:
        return "Scale"
    elif status == "underperformer" and roas < 1.0 and fp > 0.4:
        return "Pause"
    else:
        return "Monitor"

def generate_explanation(row):
    parts = []
    status = row.get("predicted_status", "stable")

    if status == "fatigued":
        decay_pct = abs(row.get("ctr_decay_pct", 0)) * 100
        parts.append(f"CTR has decayed by {decay_pct:.0f}% from first week to last week.")
        half_life = row.get("half_life_days")
        if pd.notna(half_life) and half_life < 20:
            parts.append(f"Estimated CTR half-life is only {half_life:.0f} days.")

    decay_rate = row.get("decay_rate_prophet")
    if pd.notna(decay_rate) and decay_rate < -0.0001:
        parts.append("Prophet trend confirms ongoing CTR decline.")

    if row.get("motion_score", 0) > 0.7:
        parts.append("High motion score may be accelerating fatigue (HR=5.51).")
    if row.get("text_density", 0) > 0.5:
        parts.append("Consider reducing text density for better retention.")
    if row.get("has_discount_badge", 0) == 1:
        parts.append("Discount badge creatives tend to fatigue faster (HR=1.96).")
    if row.get("novelty_score", 0) > 0.7:
        parts.append("Strong novelty â€” consider keeping the concept but refreshing the visual.")
    if row.get("faces_count", 0) >= 2:
        parts.append("Showing faces correlates with longer creative lifespan.")

    roas = row.get("overall_roas", 0)
    if pd.isna(roas):
        roas = 0
    if roas > 3.0:
        parts.append(f"ROAS is strong at {roas:.1f}x.")
    elif roas < 1.0:
        parts.append(f"ROAS is below breakeven at {roas:.2f}x.")

    fmt = row.get("format", "")
    vert = row.get("vertical", "")
    if pd.notna(fmt):
        fmt = str(fmt).strip().lower()
    else:
        fmt = ""
    if pd.notna(vert):
        vert = str(vert).strip().lower()
    else:
        vert = ""

    if fmt == "rewarded_video" and vert == "gaming":
        parts.append("Rewarded video performs well for gaming verticals.")
    if fmt == "banner" and roas < 1.0:
        parts.append("Banner format may need stronger visuals to compete.")

    return " ".join(parts) if parts else "Performance is within normal range. No urgent action needed."

print("\nGenerating recommendations...")
merged["recommendation"] = merged.apply(get_recommendation, axis=1)

print("Generating explanations...")
merged["explanation"] = merged.apply(generate_explanation, axis=1)

output = merged[["creative_id", "predicted_status", "fatigue_probability", "recommendation", "explanation"]].copy()
output.to_csv(output_path, index=False)
print(f"\nSaved model_outputs.csv â†’ {output_path} ({len(output)} rows)")

dist = output["recommendation"].value_counts()
print("\n" + "=" * 60)
print("VALIDATION")
print("=" * 60)

assert len(output) == 1080, f"Row count mismatch: expected 1080, got {len(output)}"
print(f"  [PASS] Row count: {len(output)} == 1080")

assert output["recommendation"].isna().sum() == 0, "NaN values found in recommendation column"
assert output["explanation"].isna().sum() == 0, "NaN values found in explanation column"
print(f"  [PASS] No NaN in recommendation or explanation columns")

assert len(dist) > 1 or dist.index[0] != "Monitor", "All recommendations are 'Monitor'"
print(f"  [PASS] Recommendation distribution is diverse")

print(f"\n  Recommendation distribution:")
for rec in RECOMMENDATION_ORDER:
    count = dist.get(rec, 0)
    pct = count / len(output) * 100
    bar = "â–ˆ" * int(pct / 2)
    print(f"    {rec:<16} {count:>5} ({pct:5.1f}%)  {bar}")

print(f"\n  Example explanations:")
shown_types = set()
examples_printed = 0
for rec_type in RECOMMENDATION_ORDER:
    if rec_type not in dist.index:
        continue
    sample = output[output["recommendation"] == rec_type].iloc[0]
    print(f"\n  [{rec_type}] creative_id={sample['creative_id']}")
    print(f"    fatigue_prob={sample['fatigue_probability']:.3f}  predicted_status={sample['predicted_status']}")
    explanation_text = sample["explanation"]
    if len(explanation_text) > 200:
        explanation_text = explanation_text[:197] + "..."
    print(f"    {explanation_text}")
    examples_printed += 1
    if examples_printed >= 3:
        break

fig, ax = plt.subplots(figsize=(10, 6))
plot_order = [r for r in RECOMMENDATION_ORDER if r in dist.index]
counts = [dist.get(r, 0) for r in plot_order]
colors = ["#2ecc71", "#e74c3c", "#f39c12", "#95a5a6", "#3498db"]
color_map = {r: c for r, c in zip(RECOMMENDATION_ORDER, colors)}
bar_colors = [color_map.get(r, "#3498db") for r in plot_order]

bars = ax.bar(plot_order, counts, color=bar_colors, edgecolor="white", linewidth=1.5)

for bar_item in bars:
    height = bar_item.get_height()
    ax.text(bar_item.get_x() + bar_item.get_width() / 2.0, height + 5,
            f"{int(height)}", ha="center", va="bottom", fontweight="bold", fontsize=11)

ax.set_title("Recommendation Distribution Across Creatives", fontsize=14, fontweight="bold", pad=15)
ax.set_xlabel("Recommendation", fontsize=12)
ax.set_ylabel("Number of Creatives", fontsize=12)
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
ax.set_ylim(0, max(counts) * 1.15)

plt.tight_layout()
plt.savefig(chart_path, dpi=150, bbox_inches="tight")
plt.close()
print(f"\nSaved chart â†’ {chart_path}")
print("\nDone.")

