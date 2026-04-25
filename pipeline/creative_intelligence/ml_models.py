import warnings
warnings.filterwarnings("ignore")

import matplotlib
matplotlib.use('Agg')

import pandas as pd
import numpy as np
import lightgbm as lgb
import shap
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import classification_report, mean_absolute_error
import matplotlib.pyplot as plt
import os

print("=" * 60)
print("SECTION 1: Loading data")
print("=" * 60)

master = pd.read_csv("data/master_creatives.csv")
decay = pd.read_csv("data/decay_features.csv")

print(f"master_creatives: {master.shape}")
print(f"decay_features:   {decay.shape}")

print("\n" + "=" * 60)
print("SECTION 2: Merging & feature engineering")
print("=" * 60)

feat = master.merge(decay, on="creative_id", how="left")

feat["aspect_ratio"] = feat["width"] / feat["height"].replace(0, 1)
feat["spend_per_day"] = feat["total_spend_usd"] / feat["total_days_active"].replace(0, 1)
feat["impressions_per_day"] = feat["total_impressions"] / feat["total_days_active"].replace(0, 1)
feat["is_video"] = (feat["duration_sec"] > 0).astype(int)
feat["has_price_or_discount"] = ((feat["has_price"] == 1) | (feat["has_discount_badge"] == 1)).astype(int)
feat["fatigue_day_filled"] = feat["fatigue_day"].fillna(999).astype(int)

numeric_features = [
    "total_spend_usd", "total_impressions", "total_clicks", "total_conversions",
    "overall_ctr", "overall_cvr", "overall_roas", "overall_ipm",
    "ctr_decay_pct", "cvr_decay_pct",
    "first_7d_ctr", "last_7d_ctr", "first_7d_cvr", "last_7d_cvr",
    "peak_rolling_ctr_5", "text_density", "copy_length_chars",
    "readability_score", "brand_visibility_score", "clutter_score",
    "novelty_score", "motion_score", "faces_count", "product_count",
    "duration_sec", "width", "height", "total_days_active", "perf_score",
    "peak_day_impressions", "first_7d_impressions", "first_7d_clicks",
    "first_7d_conversions", "last_7d_impressions", "last_7d_clicks",
    "last_7d_conversions", "data_points", "max_ctr", "mean_ctr",
    "peak_day", "decay_rate_prophet", "forecast_ctr_14d",
    "half_life_days", "exp_lambda", "exp_half_life"
]

engineered_features = [
    "aspect_ratio", "spend_per_day", "impressions_per_day",
    "is_video", "has_price_or_discount", "fatigue_day_filled"
]

categorical_raw = [
    "vertical", "format", "language", "theme", "hook_type",
    "cta_text", "dominant_color", "emotional_tone",
    "target_age_segment", "target_os", "objective", "kpi_goal", "hq_region"
]

binary_features = [
    "has_price", "has_discount_badge", "has_gameplay", "has_ugc_style"
]

categorical_enc = []
encoders = {}
for col in categorical_raw:
    if col in feat.columns:
        le = LabelEncoder()
        feat[col + "_enc"] = le.fit_transform(feat[col].astype(str))
        encoders[col] = le
        categorical_enc.append(col + "_enc")

all_features = numeric_features + engineered_features + categorical_enc + binary_features
all_features = [f for f in all_features if f in feat.columns]

print(f"Total features: {len(all_features)}")

print("\n" + "=" * 60)
print("SECTION 3: Defining targets")
print("=" * 60)

status_map = {"top_performer": 0, "stable": 1, "fatigued": 2, "underperformer": 3}
feat["status_label"] = feat["creative_status"].map(status_map)
feat["fatigue_continuous"] = feat["ctr_decay_pct"].clip(-1, 0).abs()

print(f"Status distribution:\n{feat['status_label'].value_counts().sort_index()}")

print("\n" + "=" * 60)
print("SECTION 4: Train/test split (GroupShuffleSplit by campaign_id)")
print("=" * 60)

feat_clean = feat.dropna(subset=["status_label", "fatigue_continuous", "perf_score"]).copy()
feat_clean["status_label"] = feat_clean["status_label"].astype(int)

X = feat_clean[all_features].fillna(-999)
y_status = feat_clean["status_label"]
y_fatigue = feat_clean["fatigue_continuous"]
y_perf = feat_clean["perf_score"]
groups = feat_clean["campaign_id"]

gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
train_idx, test_idx = next(gss.split(X, y_status, groups))

X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
y_status_train, y_status_test = y_status.iloc[train_idx], y_status.iloc[test_idx]
y_fatigue_train, y_fatigue_test = y_fatigue.iloc[train_idx], y_fatigue.iloc[test_idx]
y_perf_train, y_perf_test = y_perf.iloc[train_idx], y_perf.iloc[test_idx]

print(f"Train size: {len(X_train)}, Test size: {len(X_test)}")
print(f"Unique campaigns train: {feat_clean.iloc[train_idx]['campaign_id'].nunique()}")
print(f"Unique campaigns test:  {feat_clean.iloc[test_idx]['campaign_id'].nunique()}")

print("\n" + "=" * 60)
print("SECTION 5: Training Model A — Status Classifier")
print("=" * 60)

clf = lgb.LGBMClassifier(
    n_estimators=200, max_depth=6, learning_rate=0.05,
    num_leaves=31, min_child_samples=20,
    subsample=0.8, colsample_bytree=0.8,
    random_state=42, verbose=-1, n_jobs=1
)

clf.fit(
    X_train, y_status_train,
    eval_set=[(X_test, y_status_test)],
    callbacks=[lgb.early_stopping(20, verbose=False)]
)

y_status_pred = clf.predict(X_test)

print("\nClassification Report — Status Classifier:")
print(classification_report(
    y_status_test, y_status_pred,
    target_names=["top_performer", "stable", "fatigued", "underperformer"],
    zero_division=0
))

print("\n" + "=" * 60)
print("SECTION 6: Training Model B — Fatigue Probability Regressor")
print("=" * 60)

fatigue_reg = lgb.LGBMRegressor(
    n_estimators=200, max_depth=6, learning_rate=0.05,
    num_leaves=31, min_child_samples=20,
    subsample=0.8, colsample_bytree=0.8,
    random_state=42, verbose=-1, n_jobs=1
)

fatigue_reg.fit(
    X_train, y_fatigue_train,
    eval_set=[(X_test, y_fatigue_test)],
    callbacks=[lgb.early_stopping(20, verbose=False)]
)

y_fatigue_pred = fatigue_reg.predict(X_test)
fatigue_mae = mean_absolute_error(y_fatigue_test, y_fatigue_pred)
print(f"Fatigue Regression MAE: {fatigue_mae:.4f}")

print("\n" + "=" * 60)
print("SECTION 7: Training Model C — Performance Score Regressor")
print("=" * 60)

perf_reg = lgb.LGBMRegressor(
    n_estimators=200, max_depth=6, learning_rate=0.05,
    num_leaves=31, min_child_samples=20,
    subsample=0.8, colsample_bytree=0.8,
    random_state=42, verbose=-1, n_jobs=1
)

perf_reg.fit(
    X_train, y_perf_train,
    eval_set=[(X_test, y_perf_test)],
    callbacks=[lgb.early_stopping(20, verbose=False)]
)

y_perf_pred = perf_reg.predict(X_test)
perf_mae = mean_absolute_error(y_perf_test, y_perf_pred)
print(f"Performance Score Regression MAE: {perf_mae:.4f}")

print("\n" + "=" * 60)
print("SECTION 8: SHAP Analysis for Status Classifier")
print("=" * 60)

explainer = shap.TreeExplainer(clf)
shap_values = explainer.shap_values(X_test)

mean_abs_shap = np.mean(np.abs(np.concatenate(shap_values, axis=0)), axis=0)
top15_idx = np.argsort(mean_abs_shap)[::-1][:15]
top15_features = [all_features[i] for i in top15_idx]

plt.figure(figsize=(10, 8))
if isinstance(shap_values, list) and len(shap_values) == 4:
    sv_class2 = shap_values[2]
    shap.summary_plot(
        sv_class2, X_test, feature_names=all_features,
        max_display=15, show=False
    )
else:
    shap.summary_plot(
        shap_values, X_test, feature_names=all_features,
        max_display=15, show=False
    )
plt.tight_layout()
os.makedirs("charts", exist_ok=True)
plt.savefig("charts/shap_summary.png", dpi=150, bbox_inches="tight")
plt.close()
print("SHAP summary plot saved to charts/shap_summary.png")

print("\n" + "=" * 60)
print("SECTION 9: Feature Importance Charts")
print("=" * 60)

status_imp = pd.DataFrame({
    "feature": all_features,
    "importance": clf.feature_importances_
}).sort_values("importance", ascending=False).head(20)

plt.figure(figsize=(10, 8))
plt.barh(range(len(status_imp)), status_imp["importance"].values[::-1])
plt.yticks(range(len(status_imp)), status_imp["feature"].values[::-1])
plt.xlabel("Importance")
plt.title("Top 20 Features — Status Classifier")
plt.tight_layout()
plt.savefig("charts/feature_importance_status.png", dpi=150, bbox_inches="tight")
plt.close()
print("Status feature importance chart saved to charts/feature_importance_status.png")

fatigue_imp = pd.DataFrame({
    "feature": all_features,
    "importance": fatigue_reg.feature_importances_
}).sort_values("importance", ascending=False).head(20)

plt.figure(figsize=(10, 8))
plt.barh(range(len(fatigue_imp)), fatigue_imp["importance"].values[::-1])
plt.yticks(range(len(fatigue_imp)), fatigue_imp["feature"].values[::-1])
plt.xlabel("Importance")
plt.title("Top 20 Features — Fatigue Regressor")
plt.tight_layout()
plt.savefig("charts/feature_importance_fatigue.png", dpi=150, bbox_inches="tight")
plt.close()
print("Fatigue feature importance chart saved to charts/feature_importance_fatigue.png")

print("\n" + "=" * 60)
print("SECTION 10: Top 15 Feature Importances")
print("=" * 60)

print("\nStatus Classifier — Top 15:")
for i, row in status_imp.head(15).iterrows():
    print(f"  {row['feature']:40s} {row['importance']:>8.0f}")

print("\nFatigue Regressor — Top 15:")
for i, row in fatigue_imp.head(15).iterrows():
    print(f"  {row['feature']:40s} {row['importance']:>8.0f}")

print("\n" + "=" * 60)
print("SECTION 11: Generating predictions for all creatives")
print("=" * 60)

X_all = feat[all_features].fillna(-999)

status_pred_all = clf.predict(X_all)
fatigue_pred_all = np.clip(fatigue_reg.predict(X_all), 0, 1)
perf_pred_all = perf_reg.predict(X_all)

inv_status = {v: k for k, v in status_map.items()}

predictions = pd.DataFrame({
    "creative_id": feat["creative_id"],
    "predicted_status": [inv_status[s] for s in status_pred_all],
    "fatigue_probability": fatigue_pred_all,
    "perf_score_predicted": perf_pred_all
})

os.makedirs("data", exist_ok=True)
predictions.to_csv("data/ml_predictions.csv", index=False)
print(f"Predictions saved to data/ml_predictions.csv ({predictions.shape[0]} rows)")

print("\n" + "=" * 60)
print("DONE — Summary")
print("=" * 60)
print(f"Status Classifier  — test accuracy on {len(y_status_test)} samples")
print(f"Fatigue Regression — MAE: {fatigue_mae:.4f}")
print(f"Perf Score Regres. — MAE: {perf_mae:.4f}")
print(f"Predictions saved:  {predictions.shape[0]} rows x {predictions.shape[1]} cols")
print(f"Charts saved:       charts/feature_importance_status.png")
print(f"                    charts/feature_importance_fatigue.png")
print(f"                    charts/shap_summary.png")
