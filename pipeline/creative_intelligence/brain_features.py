import os
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_PATH = os.path.join(BASE_DIR, "data", "master_creatives.csv")
OUTPUT_PATH = os.path.join(BASE_DIR, "data", "brain_features.csv")

df = pd.read_csv(INPUT_PATH)

attention_raw = (
    0.40 * df["motion_score"]
    + 0.30 * df["novelty_score"]
    + 0.20 * df["clutter_score"]
    + 0.10 * (df["duration_sec"] > 0).astype(float)
)

max_product_count = df["product_count"].max()
reward_raw = (
    0.30 * df["brand_visibility_score"]
    + 0.25 * df["has_discount_badge"]
    + 0.25 * df["has_price"]
    + 0.20 * df["product_count"] / max_product_count
)

memory_raw = (
    0.35 * df["readability_score"]
    + 0.25 * (1 - df["text_density"])
    + 0.25 * df["brand_visibility_score"]
    + 0.15 * df["novelty_score"]
)

tone_map = {
    "urgent": 0.9,
    "excited": 0.85,
    "playful": 0.7,
    "adventurous": 0.75,
    "premium": 0.6,
    "trustworthy": 0.5,
    "calm": 0.3,
}
tone_numeric = df["emotional_tone"].map(tone_map).fillna(0.5)
max_faces_count = df["faces_count"].max()

emotion_raw = (
    0.40 * tone_numeric
    + 0.30 * df["faces_count"] / max_faces_count
    + 0.20 * df["has_ugc_style"]
    + 0.10 * df["motion_score"]
)

visual_load_raw = (
    0.35 * df["clutter_score"]
    + 0.35 * df["text_density"]
    + 0.20 * df["product_count"] / max_product_count
    + 0.10 * df["motion_score"]
)

brain_df = pd.DataFrame({"creative_id": df["creative_id"]})
brain_df["attention_score"] = attention_raw
brain_df["reward_score"] = reward_raw
brain_df["memory_score"] = memory_raw
brain_df["emotion_score"] = emotion_raw
brain_df["visual_load_score"] = visual_load_raw

score_cols = [
    "attention_score",
    "reward_score",
    "memory_score",
    "emotion_score",
    "visual_load_score",
]

for col in score_cols:
    col_min = brain_df[col].min()
    col_max = brain_df[col].max()
    brain_df[col] = ((brain_df[col] - col_min) / (col_max - col_min)) * 100

brain_mean = brain_df[score_cols].mean(axis=1)
perf = df["perf_score"]
brain_performance_corr = brain_mean.corr(perf)
brain_df["brain_performance_corr"] = brain_performance_corr

os.makedirs(os.path.join(BASE_DIR, "data"), exist_ok=True)
brain_df.to_csv(OUTPUT_PATH, index=False)

print(f"Shape: {brain_df.shape}")
print()
print("Mean scores:")
for col in score_cols:
    print(f"  {col}: {brain_df[col].mean():.2f}")
print()
print("Correlation with perf_score:")
for col in score_cols:
    corr = brain_df[col].corr(perf)
    print(f"  {col}: {corr:.4f}")
print()
print(f"brain_performance_corr: {brain_performance_corr:.4f}")
print()
top10 = brain_df.nlargest(10, "attention_score")[["creative_id", "attention_score"]]
print("Top 10 creatives by attention_score:")
print(top10.to_string(index=False))
