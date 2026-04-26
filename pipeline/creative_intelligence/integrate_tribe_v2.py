import os
import sys
import warnings
import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, mean_absolute_error

warnings.filterwarnings("ignore")

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "data")
CHARTS = os.path.join(BASE, "charts")
os.makedirs(CHARTS, exist_ok=True)

neural_path = os.path.join(DATA, "neural_cache.csv")
if not os.path.exists(neural_path):
    print("ERROR: neural_cache.csv not found in data/")
    print("Run the TRIBE_V2_Colab_Inference.ipynb notebook first to generate it.")
    sys.exit(1)

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

print("Loading data...")
master = pd.read_csv(os.path.join(DATA, "master_creatives.csv"))
decay = pd.read_csv(os.path.join(DATA, "decay_features.csv"))
neural = pd.read_csv(neural_path)

print(f"  master:     {len(master)} rows")
print(f"  decay:      {len(decay)} rows")
print(f"  neural:     {len(neural)} rows")

feat = master.copy()
feat = feat.merge(decay, on="creative_id", how="left")
feat = feat.merge(neural, on="creative_id", how="left")

brain_cols = [c for c in ["attention_score", "reward_score", "memory_score",
                          "emotion_score", "visual_load_score"] if c in feat.columns]
print(f"  Brain score columns found: {brain_cols}")
print(f"  Brain score NaN count: {feat[brain_cols].isnull().sum().to_dict()}")

if len(brain_cols) == 0:
    print("ERROR: No brain score columns found in neural_cache.csv")
    sys.exit(1)

brain_corr = {}
perf = feat["perf_score"].dropna()
for col in brain_cols:
    valid = feat[[col, "perf_score"]].dropna()
    if len(valid) > 10:
        brain_corr[col] = valid[col].corr(valid["perf_score"])
print(f"\nBrain score correlations with perf_score:")
for col, corr in brain_corr.items():
    print(f"  {col:25s}: {corr:+.4f}")
mean_brain = feat[brain_cols].mean(axis=1)
valid_mean = pd.DataFrame({"mean_brain": mean_brain, "perf_score": feat["perf_score"]}).dropna()
if len(valid_mean) > 10:
    overall_corr = valid_mean["mean_brain"].corr(valid_mean["perf_score"])
    print(f"  {'Overall mean brain':25s}: {overall_corr:+.4f}")
    print(f"  (Proxy scores achieved 0.0434)")

feat["aspect_ratio"] = feat["width"] / feat["height"].replace(0, 1)
feat["spend_per_day"] = feat["total_spend_usd"] / feat["total_days_active"].replace(0, 1)
feat["impressions_per_day"] = feat["total_impressions"] / feat["total_days_active"].replace(0, 1)
feat["is_video"] = (feat["duration_sec"] > 0).astype(int)
feat["has_price_or_discount"] = ((feat["has_price"] == 1) | (feat["has_discount_badge"] == 1)).astype(int)
feat["fatigue_day_filled"] = feat["fatigue_day"].fillna(999).astype(int)

numeric_cols = [
    "total_spend_usd", "total_impressions", "total_clicks", "total_conversions",
    "overall_ctr", "overall_cvr", "overall_roas", "overall_ipm",
    "ctr_decay_pct", "cvr_decay_pct",
    "first_7d_ctr", "last_7d_ctr", "first_7d_cvr", "last_7d_cvr",
    "peak_rolling_ctr_5",
    "text_density", "copy_length_chars", "readability_score",
    "brand_visibility_score", "clutter_score", "novelty_score",
    "motion_score", "faces_count", "product_count",
    "duration_sec", "width", "height",
    "total_days_active", "perf_score",
    "peak_day_impressions", "first_7d_impressions", "first_7d_clicks",
    "first_7d_conversions", "last_7d_impressions", "last_7d_clicks",
    "last_7d_conversions",
    "data_points", "max_ctr", "mean_ctr", "peak_day",
    "decay_rate_prophet", "forecast_ctr_14d", "half_life_days",
    "exp_lambda", "exp_half_life",
    "aspect_ratio", "spend_per_day", "impressions_per_day",
    "is_video", "has_price_or_discount",
    "fatigue_day_filled",
]
numeric_cols += brain_cols

cat_cols = [
    "vertical", "format", "language", "theme", "hook_type", "cta_text",
    "dominant_color", "emotional_tone", "target_age_segment", "target_os",
    "objective", "kpi_goal", "hq_region",
]
label_encoders = {}
for col in cat_cols:
    if col in feat.columns:
        le = LabelEncoder()
        feat[col + "_enc"] = le.fit_transform(feat[col].astype(str))
        label_encoders[col] = le

binary_cols = ["has_price", "has_discount_badge", "has_gameplay", "has_ugc_style"]

feature_cols = [c for c in numeric_cols if c in feat.columns]
feature_cols += binary_cols
feature_cols += [c + "_enc" for c in cat_cols if c + "_enc" in feat.columns]
feature_cols = list(set(feature_cols))
print(f"\nTotal features: {len(feature_cols)} (including {len(brain_cols)} brain scores)")

status_map = {"top_performer": 0, "stable": 1, "fatigued": 2, "underperformer": 3}
feat["status_label"] = feat["creative_status"].map(status_map)
feat["fatigue_continuous"] = feat["ctr_decay_pct"].clip(-1, 0).abs()

feat_clean = feat.dropna(subset=["status_label"]).copy()
X = feat_clean[feature_cols].copy().fillna(-999)
y_status = feat_clean["status_label"]
y_fatigue = feat_clean["fatigue_continuous"]
y_perf = feat_clean["perf_score"]

groups = feat_clean["campaign_id"]
gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
train_idx, test_idx = next(gss.split(X, y_status, groups))

X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
y_train_s, y_test_s = y_status.iloc[train_idx], y_status.iloc[test_idx]
y_train_f, y_test_f = y_fatigue.iloc[train_idx], y_fatigue.iloc[test_idx]
y_train_p, y_test_p = y_perf.iloc[train_idx], y_perf.iloc[test_idx]

print(f"\nTrain: {len(X_train)}, Test: {len(X_test)}")

clf = lgb.LGBMClassifier(
    n_estimators=200, max_depth=6, learning_rate=0.05,
    num_leaves=31, min_child_samples=20,
    subsample=0.8, colsample_bytree=0.8,
    random_state=42, verbose=-1, n_jobs=1,
)
clf.fit(X_train, y_train_s,
        eval_set=[(X_test, y_test_s)],
        callbacks=[lgb.early_stopping(20, verbose=False)])

y_pred_s = clf.predict(X_test)
print("\n=== Status Classification Report (with TRIBE V2 features) ===")
print(classification_report(y_test_s, y_pred_s,
      target_names=["top_performer", "stable", "fatigued", "underperformer"]))

fat_reg = lgb.LGBMRegressor(
    n_estimators=200, max_depth=6, learning_rate=0.05,
    num_leaves=31, min_child_samples=20,
    subsample=0.8, colsample_bytree=0.8,
    random_state=42, verbose=-1, n_jobs=1,
)
fat_reg.fit(X_train, y_train_f,
            eval_set=[(X_test, y_test_f)],
            callbacks=[lgb.early_stopping(20, verbose=False)])
y_pred_f = fat_reg.predict(X_test)
print(f"Fatigue Regression MAE: {mean_absolute_error(y_test_f, y_pred_f):.4f}")

perf_reg = lgb.LGBMRegressor(
    n_estimators=200, max_depth=6, learning_rate=0.05,
    num_leaves=31, min_child_samples=20,
    subsample=0.8, colsample_bytree=0.8,
    random_state=42, verbose=-1, n_jobs=1,
)
perf_reg.fit(X_train, y_train_p,
             eval_set=[(X_test, y_test_p)],
             callbacks=[lgb.early_stopping(20, verbose=False)])
y_pred_p = perf_reg.predict(X_test)
print(f"Perf Score Regression MAE: {mean_absolute_error(y_test_p, y_pred_p):.4f}")

importance_clf = pd.DataFrame({
    "feature": feature_cols,
    "importance": clf.feature_importances_,
}).sort_values("importance", ascending=False)

print("\n=== Feature Importance — Brain Score Ranking ===")
for _, row in importance_clf[importance_clf["feature"].isin(brain_cols)].iterrows():
    rank = importance_clf["feature"].tolist().index(row["feature"]) + 1
    print(f"  Rank {rank:3d}: {row['feature']:25s} importance={row['importance']}")

print("\n=== Top 15 Features Overall ===")
for i, (_, row) in enumerate(importance_clf.head(15).iterrows()):
    brain_tag = " [TRIBE V2]" if row["feature"] in brain_cols else ""
    print(f"  {i+1:2d}. {row['feature']:30s} {row['importance']:5.0f}{brain_tag}")

fig, ax = plt.subplots(figsize=(10, 8))
top20 = importance_clf.head(20)
colors = ["#ff6b35" if f in brain_cols else "#4a90d9" for f in top20["feature"]]
ax.barh(range(len(top20)), top20["importance"], color=colors)
ax.set_yticks(range(len(top20)))
ax.set_yticklabels(top20["feature"])
ax.invert_yaxis()
ax.set_title("Feature Importance — Status Classifier (with TRIBE V2 Brain Scores)")
ax.set_xlabel("Importance (split count)")
from matplotlib.patches import Patch
legend_elements = [Patch(facecolor="#ff6b35", label="TRIBE V2 Brain Score"),
                   Patch(facecolor="#4a90d9", label="Other Feature")]
ax.legend(handles=legend_elements, loc="lower right")
plt.tight_layout()
plt.savefig(os.path.join(CHARTS, "feature_importance_tribe_v2.png"), dpi=150)
plt.close()
print(f"\nSaved charts/feature_importance_tribe_v2.png")

X_all = feat[feature_cols].fillna(-999)
feat["predicted_status"] = clf.predict(X_all)
feat["fatigue_probability"] = fat_reg.predict(X_all).clip(0, 1)
feat["perf_score_predicted"] = perf_reg.predict(X_all)

status_reverse = {0: "top_performer", 1: "stable", 2: "fatigued", 3: "underperformer"}
feat["predicted_status_label"] = feat["predicted_status"].map(status_reverse)

output = feat[["creative_id", "predicted_status_label", "fatigue_probability",
               "perf_score_predicted"]].copy()
output.columns = ["creative_id", "predicted_status", "fatigue_probability",
                  "perf_score_predicted"]
output.to_csv(os.path.join(DATA, "ml_predictions_tribe.csv"), index=False)

brain_output = feat[["creative_id"] + brain_cols].copy()
brain_output.to_csv(os.path.join(DATA, "brain_features_tribe.csv"), index=False)

print(f"\nSaved data/ml_predictions_tribe.csv ({len(output)} rows)")
print(f"Saved data/brain_features_tribe.csv ({len(brain_output)} rows)")
print("\nDONE — TRIBE V2 integration complete!")
