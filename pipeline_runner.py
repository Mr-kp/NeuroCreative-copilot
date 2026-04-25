"""
pipeline_runner.py — Live creative intelligence pipeline.

Refactored from pipeline/creative_intelligence/ scripts into importable
functions with graceful fallbacks:
  - scipy available   → curve_fit decay analysis
  - scipy unavailable → simple linear decay heuristic
  - lightgbm available → trained ML model predictions
  - lightgbm unavailable → rule-based heuristic predictions
  - shap / lifelines / prophet → optional, never required

Usage from api_server.py:
    from pipeline_runner import run_pipeline, detect_tables
    tables = detect_tables(uploaded_files)
    result = run_pipeline(tables)
    # result = {master, brain, decay, recommendations, daily, pipeline_log}
"""

import numpy as np
import pandas as pd
from collections import Counter

try:
    from scipy.optimize import curve_fit
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False

try:
    from sklearn.preprocessing import LabelEncoder
    from sklearn.model_selection import GroupShuffleSplit
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

try:
    import lightgbm as lgb
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False


TABLE_SIGNATURES = {
    "advertisers": {"advertiser_id", "advertiser_name", "vertical", "hq_region"},
    "campaigns": {"campaign_id", "advertiser_id", "objective", "primary_theme"},
    "creatives": {
        "creative_id", "campaign_id", "format", "text_density",
        "motion_score", "novelty_score", "clutter_score", "asset_file",
    },
    "creative_summary": {
        "creative_id", "campaign_id", "creative_status", "overall_ctr",
        "overall_cvr", "overall_roas", "total_impressions", "total_spend_usd",
    },
    "daily_stats": {
        "date", "creative_id", "impressions", "clicks", "spend_usd",
        "days_since_launch",
    },
}


def detect_tables(file_data: dict[str, pd.DataFrame]) -> dict[str, pd.DataFrame]:
    """
    Given a dict of {filename: DataFrame}, detect which Smadex table each is.
    Returns {table_name: DataFrame}.
    """
    detected = {}
    log = []

    filename_hints = {
        "advertisers": "advertisers",
        "campaigns": "campaigns",
        "creatives": "creatives",
        "creative_summary": "creative_summary",
        "creative_daily_country_os_stats": "daily_stats",
        "campaign_summary": "campaign_summary",
    }

    for filename, df in file_data.items():
        base = filename.lower().replace(".csv", "").replace(".zip", "").strip()
        hint_match = None
        for key, table in filename_hints.items():
            if key in base:
                hint_match = table
                break

        if hint_match:
            detected[hint_match] = df
            log.append(f"{filename} -> {hint_match} (filename match)")
            continue

        cols = set(df.columns)
        best_match = None
        best_score = 0
        best_specificity = 0

        for table_name, signature in TABLE_SIGNATURES.items():
            overlap = len(cols & signature)
            score = overlap / len(signature) if signature else 0
            specificity = len(signature)
            if score > best_score and score >= 0.5:
                best_score = score
                best_match = table_name
                best_specificity = specificity
            elif score == best_score and specificity > best_specificity:
                best_match = table_name
                best_specificity = specificity

        if best_match:
            if best_match in detected:
                old_cols = set(detected[best_match].columns)
                new_cols = set(df.columns)
                if len(new_cols & TABLE_SIGNATURES.get(best_match, set())) > len(old_cols & TABLE_SIGNATURES.get(best_match, set())):
                    detected[best_match] = df
                    log.append(f"{filename} -> {best_match} ({best_score:.0%} match, replaced better)")
                else:
                    log.append(f"{filename} -> {best_match} ({best_score:.0%} match, skipped duplicate)")
            else:
                detected[best_match] = df
                log.append(f"{filename} -> {best_match} ({best_score:.0%} match)")
        else:
            log.append(f"{filename} -> unrecognized (closest: {best_score:.0%})")

    print("[detect_tables]", "; ".join(log).encode("ascii", "replace").decode())
    return detected


def build_master_table(tables: dict[str, pd.DataFrame]) -> tuple[pd.DataFrame, list[str]]:
    """
    Join uploaded tables into a master creatives table.
    Uses creative_summary as spine if available, falls back to creatives.
    """
    log = []

    if "creative_summary" in tables:
        master = tables["creative_summary"].copy()
        log.append(f"Spine: creative_summary ({len(master)} rows)")
    elif "creatives" in tables:
        master = tables["creatives"].copy()
        log.append(f"Spine: creatives ({len(master)} rows)")
    else:
        first_key = next(iter(tables))
        master = tables[first_key].copy()
        log.append(f"Spine: {first_key} ({len(master)} rows, fallback)")

    if "creatives" in tables and "creative_summary" in tables:
        before = len(master)
        creative_cols = [c for c in tables["creatives"].columns if c not in master.columns or c == "creative_id"]
        master = master.merge(tables["creatives"][creative_cols], on="creative_id", how="left")
        log.append(f"Joined creatives: {before} → {len(master)} rows")

    if "campaigns" in tables:
        camp_cols = [
            "campaign_id", "advertiser_id", "objective", "primary_theme",
            "target_age_segment", "target_os", "countries", "start_date",
            "end_date", "daily_budget_usd", "kpi_goal",
        ]
        camp_subset = tables["campaigns"][[c for c in camp_cols if c in tables["campaigns"].columns]].copy()
        camp_subset = camp_subset.rename(columns={"primary_theme": "campaign_theme"})
        before = len(master)
        master = master.merge(camp_subset, on="campaign_id", how="left")
        log.append(f"Joined campaigns: {before} → {len(master)} rows")

    if "advertisers" in tables:
        adv_cols = [c for c in ["advertiser_id", "hq_region"] if c in tables["advertisers"].columns]
        master = master.merge(tables["advertisers"][adv_cols], on="advertiser_id", how="left")
        log.append("Joined advertisers")

    for col in ["creative_id", "campaign_id", "advertiser_id"]:
        if col in master.columns:
            # Only coerce to numeric if the column appears to contain numeric data
            # This preserves string IDs like 'CR-1042'
            test_vals = master[col].dropna().astype(str)
            if len(test_vals) > 0 and test_vals.str.match(r'^-?\d+(\.\d+)?$').all():
                master[col] = pd.to_numeric(master[col], errors="coerce").astype("Int64")
            else:
                master[col] = master[col].astype(str)

    # Coerce expected numeric columns to numeric — user CSVs may have
    # text labels (e.g. "High", "Low") instead of float values.
    numeric_cols = [
        "total_spend_usd", "total_impressions", "total_clicks",
        "total_conversions", "total_revenue_usd",
        "overall_ctr", "overall_cvr", "overall_roas", "overall_ipm",
        "ctr_decay_pct", "cvr_decay_pct", "first_7d_ctr", "last_7d_ctr",
        "text_density", "readability_score", "brand_visibility_score",
        "clutter_score", "novelty_score", "motion_score", "faces_count",
        "product_count", "duration_sec", "has_price", "has_discount_badge",
        "has_gameplay", "has_ugc_style", "fatigue_day", "total_days_active",
        "perf_score",
    ]
    for col in numeric_cols:
        if col in master.columns:
            master[col] = pd.to_numeric(master[col], errors="coerce")

    return master, log


def build_daily_table(tables: dict[str, pd.DataFrame]) -> tuple[pd.DataFrame, list[str]]:
    """
    Aggregate daily stats into creative × date level.
    Returns empty DataFrame if no daily stats available.
    """
    log = []

    if "daily_stats" not in tables:
        log.append("No daily_stats uploaded, skipping daily table")
        return pd.DataFrame(), log

    daily = tables["daily_stats"].copy()
    log.append(f"Raw daily stats: {len(daily)} rows")

    group_cols = ["creative_id"]
    if "date" in daily.columns:
        group_cols.insert(0, "date")
    if "campaign_id" in daily.columns:
        group_cols.append("campaign_id")

    agg_dict = {}
    for col, agg_name in [
        ("impressions", "sum"), ("clicks", "sum"), ("conversions", "sum"),
        ("spend_usd", "sum"), ("revenue_usd", "sum"),
    ]:
        if col in daily.columns:
            agg_dict[col] = agg_name

    if "days_since_launch" in daily.columns:
        agg_dict["days_since_launch"] = "max"

    if len(group_cols) > 0 and len(agg_dict) > 0:
        daily_agg = daily.groupby(group_cols).agg(**{k: pd.NamedAgg(column=k, aggfunc=v) for k, v in agg_dict.items()}).reset_index()
    else:
        daily_agg = pd.DataFrame()

    if "impressions" in daily_agg.columns and "clicks" in daily_agg.columns:
        daily_agg["ctr"] = np.where(
            daily_agg["impressions"] > 0,
            daily_agg["clicks"] / daily_agg["impressions"],
            np.nan,
        )

    if "clicks" in daily_agg.columns and "conversions" in daily_agg.columns:
        daily_agg["cvr"] = np.where(
            daily_agg["clicks"] > 0,
            daily_agg["conversions"] / daily_agg["clicks"],
            np.nan,
        )

    if "spend_usd" in daily_agg.columns and "revenue_usd" in daily_agg.columns:
        daily_agg["roas"] = np.where(
            daily_agg["spend_usd"] > 0,
            daily_agg["revenue_usd"] / daily_agg["spend_usd"],
            np.nan,
        )

    log.append(f"Aggregated daily table: {len(daily_agg)} rows, {daily_agg['creative_id'].nunique() if 'creative_id' in daily_agg.columns else 0} creatives")
    return daily_agg, log


def compute_brain_features(master: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """
    Compute brain-inspired scores from visual metadata.
    Pure pandas/numpy — always works.
    """
    log = []
    df = master

    if "creative_id" not in df.columns:
        log.append("ERROR: no creative_id column")
        return pd.DataFrame(), log

    brain_df = pd.DataFrame({"creative_id": df["creative_id"]})

    has_motion = "motion_score" in df.columns
    has_novelty = "novelty_score" in df.columns
    has_clutter = "clutter_score" in df.columns
    has_duration = "duration_sec" in df.columns
    has_brand = "brand_visibility_score" in df.columns
    has_discount = "has_discount_badge" in df.columns
    has_price = "has_price" in df.columns
    has_products = "product_count" in df.columns
    has_readability = "readability_score" in df.columns
    has_text_density = "text_density" in df.columns
    has_emotion = "emotional_tone" in df.columns
    has_faces = "faces_count" in df.columns
    has_ugc = "has_ugc_style" in df.columns

    # Coerce numeric columns — user CSVs may have text labels (e.g. "High")
    # instead of numeric values. Convert to numeric, replacing non-numeric with NaN.
    numeric_cols = [
        "motion_score", "novelty_score", "clutter_score", "duration_sec",
        "brand_visibility_score", "has_discount_badge", "has_price",
        "product_count", "readability_score", "text_density",
        "faces_count", "has_ugc_style",
    ]
    df = df.copy()
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    attention_raw = np.zeros(len(df))
    if has_motion:
        attention_raw += 0.40 * df["motion_score"].fillna(0)
    if has_novelty:
        attention_raw += 0.30 * df["novelty_score"].fillna(0)
    if has_clutter:
        attention_raw += 0.20 * df["clutter_score"].fillna(0)
    if has_duration:
        attention_raw += 0.10 * (df["duration_sec"].fillna(0) > 0).astype(float)

    max_product_count = df["product_count"].max() if has_products else 1
    if pd.isna(max_product_count) or max_product_count == 0:
        max_product_count = 1

    reward_raw = np.zeros(len(df))
    if has_brand:
        reward_raw += 0.30 * df["brand_visibility_score"].fillna(0)
    if has_discount:
        reward_raw += 0.25 * df["has_discount_badge"].fillna(0)
    if has_price:
        reward_raw += 0.25 * df["has_price"].fillna(0)
    if has_products:
        reward_raw += 0.20 * df["product_count"].fillna(0) / max_product_count

    memory_raw = np.zeros(len(df))
    if has_readability:
        memory_raw += 0.35 * df["readability_score"].fillna(0)
    if has_text_density:
        memory_raw += 0.25 * (1 - df["text_density"].fillna(0.5))
    if has_brand:
        memory_raw += 0.25 * df["brand_visibility_score"].fillna(0)
    if has_novelty:
        memory_raw += 0.15 * df["novelty_score"].fillna(0)

    tone_map = {
        "urgent": 0.9, "excited": 0.85, "playful": 0.7, "adventurous": 0.75,
        "premium": 0.6, "trustworthy": 0.5, "calm": 0.3,
    }
    tone_numeric = df["emotional_tone"].map(tone_map).fillna(0.5) if has_emotion else np.full(len(df), 0.5)
    max_faces = df["faces_count"].max() if has_faces else 1
    if pd.isna(max_faces) or max_faces == 0:
        max_faces = 1

    emotion_raw = np.zeros(len(df))
    emotion_raw += 0.40 * tone_numeric
    if has_faces:
        emotion_raw += 0.30 * df["faces_count"].fillna(0) / max_faces
    if has_ugc:
        emotion_raw += 0.20 * df["has_ugc_style"].fillna(0)
    if has_motion:
        emotion_raw += 0.10 * df["motion_score"].fillna(0)

    visual_load_raw = np.zeros(len(df))
    if has_clutter:
        visual_load_raw += 0.35 * df["clutter_score"].fillna(0)
    if has_text_density:
        visual_load_raw += 0.35 * df["text_density"].fillna(0)
    if has_products:
        visual_load_raw += 0.20 * df["product_count"].fillna(0) / max_product_count
    if has_motion:
        visual_load_raw += 0.10 * df["motion_score"].fillna(0)

    brain_df["attention_score"] = attention_raw
    brain_df["reward_score"] = reward_raw
    brain_df["memory_score"] = memory_raw
    brain_df["emotion_score"] = emotion_raw
    brain_df["visual_load_score"] = visual_load_raw

    score_cols = ["attention_score", "reward_score", "memory_score", "emotion_score", "visual_load_score"]
    for col in score_cols:
        col_min = brain_df[col].min()
        col_max = brain_df[col].max()
        if col_max > col_min:
            brain_df[col] = ((brain_df[col] - col_min) / (col_max - col_min)) * 100
        else:
            brain_df[col] = 50.0

    available = sum([has_motion, has_novelty, has_clutter, has_duration, has_brand,
                     has_discount, has_price, has_products, has_readability,
                     has_text_density, has_emotion, has_faces, has_ugc])
    total = 13
    log.append(f"Brain features computed for {len(brain_df)} creatives ({available}/{total} visual columns available)")
    return brain_df, log


def compute_decay_features(
    daily: pd.DataFrame, master: pd.DataFrame
) -> tuple[pd.DataFrame, list[str]]:
    """
    Fit CTR decay curves per creative.
    Uses scipy curve_fit if available, falls back to simple linear regression.
    """
    log = []

    if daily.empty or "creative_id" not in daily.columns or "ctr" not in daily.columns:
        log.append("No daily data available for decay analysis — using master table heuristics")
        return _decay_from_master(master), log

    if "creative_id" not in master.columns:
        return pd.DataFrame(), ["No creative_id in master"]

    creative_groups = daily.groupby("creative_id")
    results = []
    processed = 0

    for creative_id, grp in creative_groups:
        processed += 1
        if processed % 200 == 0:
            log.append(f"  Decay: processed {processed} creatives...")

        grp = grp.sort_values("days_since_launch" if "days_since_launch" in grp.columns else "date").reset_index(drop=True)
        n = len(grp)

        row = {
            "creative_id": creative_id,
            "data_points": n,
            "max_ctr": grp["ctr"].max() if "ctr" in grp.columns else np.nan,
            "mean_ctr": grp["ctr"].mean() if "ctr" in grp.columns else np.nan,
            "peak_day": 0,
            "exp_lambda": np.nan,
            "exp_half_life": np.nan,
            "best_parametric": "none",
            "method": "too_short",
        }

        if "days_since_launch" in grp.columns and "ctr" in grp.columns:
            row["peak_day"] = int(grp.loc[grp["ctr"].idxmax(), "days_since_launch"]) if n > 0 else 0

        if n >= 3 and "days_since_launch" in grp.columns and "ctr" in grp.columns and HAS_SCIPY:
            t = grp["days_since_launch"].values.astype(float)
            y = grp["ctr"].values.astype(float)
            y = np.nan_to_num(y, nan=0)

            def exp_func(t, a, lam):
                return a * np.exp(-lam * t)

            try:
                popt, _ = curve_fit(exp_func, t, y, p0=[y.max() if len(y) > 0 else 0.01, 0.05], maxfev=3000)
                row["exp_lambda"] = float(popt[1])
                row["exp_half_life"] = float(np.log(2) / popt[1]) if popt[1] > 0 else np.nan
                row["best_parametric"] = "exponential"
                row["method"] = "exp_decay"
            except Exception:
                row["method"] = "linear_fallback"

        elif n >= 3 and "days_since_launch" in grp.columns and "ctr" in grp.columns:
            t = grp["days_since_launch"].values.astype(float)
            y = grp["ctr"].values.astype(float)
            y = np.nan_to_num(y, nan=0)

            if len(y) >= 2:
                first_half = y[: len(y) // 2].mean()
                second_half = y[len(y) // 2 :].mean()
                if first_half > 0:
                    decay_rate = (first_half - second_half) / first_half
                    row["exp_lambda"] = max(0, decay_rate)
                    row["method"] = "linear_fallback"
                else:
                    row["method"] = "no_signal"
            else:
                row["method"] = "too_short"
        else:
            row["method"] = "too_short"

        results.append(row)

    decay_df = pd.DataFrame(results)
    log.append(f"Decay analysis complete: {len(decay_df)} creatives, method distribution: {decay_df['method'].value_counts().to_dict()}")
    return decay_df, log


def _decay_from_master(master: pd.DataFrame) -> pd.DataFrame:
    """Fallback: derive basic decay info from master table metrics."""
    rows = []
    for _, row in master.iterrows():
        ctr_decay = row.get("ctr_decay_pct", 0)
        if pd.isna(ctr_decay):
            ctr_decay = 0
        rows.append({
            "creative_id": row.get("creative_id"),
            "data_points": 0,
            "max_ctr": row.get("overall_ctr", 0),
            "mean_ctr": row.get("overall_ctr", 0),
            "peak_day": 0,
            "exp_lambda": max(0, abs(ctr_decay)),
            "exp_half_life": np.nan,
            "best_parametric": "none",
            "method": "master_heuristic",
        })
    return pd.DataFrame(rows)


def compute_predictions_heuristic(master: pd.DataFrame, decay: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """
    Rule-based fatigue probability and status prediction.
    Used when lightgbm is not available or as the primary method
    (the original scripts also use rules for final recommendations).
    """
    log = []

    if "creative_id" not in master.columns:
        return pd.DataFrame(), ["No creative_id"]

    merged = master.copy()
    if not decay.empty and "creative_id" in decay.columns:
        merged = merged.merge(decay[["creative_id"] + [c for c in decay.columns if c != "creative_id"]],
                              on="creative_id", how="left")

    predictions = []

    for _, row in merged.iterrows():
        ctr_decay = abs(row.get("ctr_decay_pct", 0)) if pd.notna(row.get("ctr_decay_pct")) else 0
        if ctr_decay > 1:
            ctr_decay = ctr_decay / 100

        decay_lambda = row.get("exp_lambda", 0)
        if pd.isna(decay_lambda):
            decay_lambda = 0

        roas = row.get("overall_roas", 0)
        if pd.isna(roas):
            roas = 0
        ctr = row.get("overall_ctr", 0)
        if pd.isna(ctr):
            ctr = 0
        cvr = row.get("overall_cvr", 0)
        if pd.isna(cvr):
            cvr = 0

        fatigue_prob = 0.3 * min(1, ctr_decay * 2) + 0.3 * min(1, decay_lambda * 5) + 0.2 * max(0, 1 - roas / 3) + 0.2 * max(0, 1 - ctr * 50)
        fatigue_prob = np.clip(fatigue_prob, 0, 1)

        if "creative_status" in row and pd.notna(row.get("creative_status")):
            status = str(row["creative_status"])
        else:
            if fatigue_prob > 0.65:
                status = "fatigued"
            elif fatigue_prob < 0.25 and roas > 1.5:
                status = "top_performer"
            elif fatigue_prob > 0.45 and roas < 0.8:
                status = "underperformer"
            else:
                status = "stable"

        predictions.append({
            "creative_id": row.get("creative_id"),
            "predicted_status": status,
            "fatigue_probability": float(fatigue_prob),
        })

    pred_df = pd.DataFrame(predictions)
    log.append(f"Heuristic predictions: {len(pred_df)} creatives")
    if "predicted_status" in pred_df.columns:
        log.append(f"  Status distribution: {pred_df['predicted_status'].value_counts().to_dict()}")
    return pred_df, log


def compute_predictions_ml(master: pd.DataFrame, decay: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """
    LightGBM-based predictions. Falls back to heuristic if lightgbm unavailable.
    """
    log = []

    if not HAS_LIGHTGBM or not HAS_SKLEARN:
        log.append("lightgbm/sklearn not available, using heuristic predictions")
        return compute_predictions_heuristic(master, decay)

    merged = master.copy()
    if not decay.empty and "creative_id" in decay.columns:
        merged = merged.merge(
            decay[["creative_id"] + [c for c in decay.columns if c != "creative_id"]],
            on="creative_id", how="left",
        )

    has_status = "creative_status" in merged.columns
    if not has_status:
        log.append("No creative_status column — falling back to heuristic (need labels for ML)")
        return compute_predictions_heuristic(master, decay)

    status_map = {"top_performer": 0, "stable": 1, "fatigued": 2, "underperformer": 3}
    merged["_status_label"] = merged["creative_status"].map(status_map)

    if merged["_status_label"].isna().all() or merged["_status_label"].nunique() < 2:
        log.append("Insufficient label variety — falling back to heuristic")
        return compute_predictions_heuristic(master, decay)

    # ML needs enough data to be meaningful; with < 50 rows, heuristics are more reliable
    if len(merged) < 50:
        log.append(f"Only {len(merged)} rows — too few for reliable ML, using heuristic predictions")
        return compute_predictions_heuristic(master, decay)

    numeric_candidates = [
        "total_spend_usd", "total_impressions", "total_clicks", "total_conversions",
        "overall_ctr", "overall_cvr", "overall_roas", "overall_ipm",
        "ctr_decay_pct", "cvr_decay_pct", "first_7d_ctr", "last_7d_ctr",
        "text_density", "readability_score", "brand_visibility_score",
        "clutter_score", "novelty_score", "motion_score", "faces_count",
        "product_count", "duration_sec", "data_points", "max_ctr", "mean_ctr",
        "exp_lambda", "exp_half_life",
    ]

    cat_candidates = [
        "vertical", "format", "language", "emotional_tone", "hook_type",
    ]

    features = [c for c in numeric_candidates if c in merged.columns]
    for c in cat_candidates:
        if c in merged.columns:
            le = LabelEncoder()
            merged[c + "_enc"] = le.fit_transform(merged[c].astype(str))
            features.append(c + "_enc")

    binary_candidates = ["has_price", "has_discount_badge", "has_gameplay", "has_ugc_style"]
    for c in binary_candidates:
        if c in merged.columns:
            features.append(c)

    if len(features) < 5:
        log.append(f"Only {len(features)} features available — falling back to heuristic")
        return compute_predictions_heuristic(master, decay)

    clean = merged.dropna(subset=["_status_label"]).copy()
    clean["_status_label"] = clean["_status_label"].astype(int)

    X = clean[features].fillna(-999)
    y = clean["_status_label"]

    if "campaign_id" in clean.columns:
        groups = clean["campaign_id"]
        try:
            gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
            train_idx, test_idx = next(gss.split(X, y, groups))
        except Exception:
            train_idx = np.arange(len(X))
            test_idx = train_idx[:10]
    else:
        n = len(X)
        train_idx = np.arange(int(n * 0.8))
        test_idx = np.arange(int(n * 0.8), n)

    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

    unique_labels = y_train.nunique()
    if unique_labels < 2:
        log.append("Only 1 class in training set — falling back to heuristic")
        return compute_predictions_heuristic(master, decay)

    try:
        clf = lgb.LGBMClassifier(
            n_estimators=100, max_depth=5, learning_rate=0.05,
            num_leaves=31, min_child_samples=10,
            random_state=42, verbose=-1, n_jobs=1,
        )
        clf.fit(X_train, y_train, eval_set=[(X_test, y_test)],
                callbacks=[lgb.early_stopping(10, verbose=False)])

        fatigue_reg = lgb.LGBMRegressor(
            n_estimators=100, max_depth=5, learning_rate=0.05,
            random_state=42, verbose=-1, n_jobs=1,
        )
        ctr_decay_target = clean["ctr_decay_pct"].clip(-1, 0).abs()
        fatigue_reg.fit(X_train, ctr_decay_target.iloc[train_idx],
                        eval_set=[(X_test, ctr_decay_target.iloc[test_idx])],
                        callbacks=[lgb.early_stopping(10, verbose=False)])

        X_all = merged[features].fillna(-999)
        status_pred = clf.predict(X_all)
        fatigue_pred = np.clip(fatigue_reg.predict(X_all), 0, 1)

        inv_status = {v: k for k, v in status_map.items()}
        pred_df = pd.DataFrame({
            "creative_id": merged["creative_id"],
            "predicted_status": [inv_status.get(int(s), "stable") for s in status_pred],
            "fatigue_probability": fatigue_pred,
        })

        log.append(f"LightGBM predictions: {len(pred_df)} creatives, {len(features)} features")
        if "predicted_status" in pred_df.columns:
            log.append(f"  Status distribution: {pred_df['predicted_status'].value_counts().to_dict()}")
        return pred_df, log

    except Exception as e:
        log.append(f"LightGBM training failed ({e}) — falling back to heuristic")
        return compute_predictions_heuristic(master, decay)


def generate_recommendations(
    master: pd.DataFrame, predictions: pd.DataFrame, brain: pd.DataFrame
) -> tuple[pd.DataFrame, list[str]]:
    """
    Generate Scale/Monitor/Pivot/Refresh/Pause recommendations with explanations.
    Pure pandas — always works.
    """
    log = []

    if "creative_id" not in master.columns:
        return pd.DataFrame(), ["No creative_id"]

    merged = master.copy()
    if not predictions.empty and "creative_id" in predictions.columns:
        merged = merged.merge(predictions, on="creative_id", how="left")
    if not brain.empty and "creative_id" in brain.columns:
        merged = merged.merge(brain[["creative_id"] + [c for c in brain.columns if c != "creative_id"]],
                              on="creative_id", how="left")

    merged["fatigue_probability"] = merged.get("fatigue_probability", pd.Series([0.0] * len(merged)))
    merged["fatigue_probability"] = merged["fatigue_probability"].fillna(0)
    merged["predicted_status"] = merged.get("predicted_status", pd.Series(["stable"] * len(merged)))
    merged["predicted_status"] = merged["predicted_status"].fillna("stable")

    def get_rec(row):
        fp = float(row.get("fatigue_probability", 0))
        status = str(row.get("predicted_status", "stable"))
        roas = float(row.get("overall_roas", 0)) if pd.notna(row.get("overall_roas")) else 0
        ctr_decay = float(row.get("ctr_decay_pct", 0)) if pd.notna(row.get("ctr_decay_pct")) else 0

        if fp > 0.7 and ctr_decay < -0.7:
            return "Pivot Creative"
        elif fp > 0.5 and ctr_decay < -0.5:
            return "Refresh Soon"
        elif status == "top_performer" and roas > 2.0 and fp < 0.3:
            return "Scale"
        elif status == "underperformer" and roas < 1.0 and fp > 0.4:
            return "Pause"
        else:
            return "Monitor"

    def get_explanation(row):
        parts = []
        status = str(row.get("predicted_status", "stable"))
        fp = float(row.get("fatigue_probability", 0))

        if status == "fatigued":
            decay_pct = abs(float(row.get("ctr_decay_pct", 0))) * 100
            parts.append(f"CTR has decayed by {decay_pct:.0f}% from first week to last week.")
            half_life = row.get("exp_half_life")
            if pd.notna(half_life) and float(half_life) < 20:
                parts.append(f"Estimated CTR half-life is only {float(half_life):.0f} days.")

        if row.get("motion_score", 0) > 0.7:
            parts.append("High motion score may be accelerating fatigue.")
        if row.get("text_density", 0) > 0.5:
            parts.append("Consider reducing text density for better retention.")
        if row.get("has_discount_badge", 0) == 1:
            parts.append("Discount badge creatives tend to fatigue faster.")
        if row.get("novelty_score", 0) > 0.7:
            parts.append("Strong novelty — consider keeping the concept but refreshing the visual.")

        roas = float(row.get("overall_roas", 0)) if pd.notna(row.get("overall_roas")) else 0
        if roas > 3.0:
            parts.append(f"ROAS is strong at {roas:.1f}x.")
        elif roas < 1.0:
            parts.append(f"ROAS is below breakeven at {roas:.2f}x.")

        return " ".join(parts) if parts else "Performance is within normal range. No urgent action needed."

    merged["recommendation"] = merged.apply(get_rec, axis=1)
    merged["explanation"] = merged.apply(get_explanation, axis=1)

    output = merged[["creative_id", "predicted_status", "fatigue_probability",
                      "recommendation", "explanation"]].copy()

    dist = output["recommendation"].value_counts()
    log.append(f"Recommendations: {len(output)} creatives")
    log.append(f"  Distribution: {dist.to_dict()}")
    return output, log


def run_pipeline(file_data: dict[str, pd.DataFrame]) -> dict:
    """
    Main entry point. Accepts {filename: DataFrame}, runs full pipeline.

    Returns:
        {
            "master": pd.DataFrame,
            "brain": pd.DataFrame,
            "decay": pd.DataFrame,
            "predictions": pd.DataFrame,
            "recommendations": pd.DataFrame,
            "daily": pd.DataFrame,
            "merged": pd.DataFrame,   # master + brain + recommendations (for dashboard)
            "log": list[str],
        }
    """
    full_log = ["=== NeuroCreative Pipeline ==="]

    tables = detect_tables(file_data)
    full_log.append(f"Detected tables: {list(tables.keys())}")

    master, master_log = build_master_table(tables)
    full_log.extend(master_log)

    if master.empty:
        full_log.append("ERROR: Empty master table — cannot proceed")
        return {"master": master, "brain": pd.DataFrame(), "decay": pd.DataFrame(),
                "predictions": pd.DataFrame(), "recommendations": pd.DataFrame(),
                "daily": pd.DataFrame(), "merged": pd.DataFrame(), "log": full_log}

    daily, daily_log = build_daily_table(tables)
    full_log.extend(daily_log)

    brain, brain_log = compute_brain_features(master)
    full_log.extend(brain_log)

    decay, decay_log = compute_decay_features(daily, master)
    full_log.extend(decay_log)

    predictions, pred_log = compute_predictions_ml(master, decay)
    full_log.extend(pred_log)

    recs, rec_log = generate_recommendations(master, predictions, brain)
    full_log.extend(rec_log)

    merged = master.copy()
    if not brain.empty:
        merged = merged.merge(brain, on="creative_id", how="left")
    if not recs.empty:
        merged = merged.merge(recs[["creative_id", "predicted_status", "fatigue_probability",
                                     "recommendation", "explanation"]],
                              on="creative_id", how="left")
    if not predictions.empty and "fatigue_probability" not in merged.columns:
        merged = merged.merge(predictions[["creative_id", "fatigue_probability"]],
                              on="creative_id", how="left")

    merged["fatigue_probability"] = merged.get("fatigue_probability", pd.Series([0.0] * len(merged)))
    merged["fatigue_probability"] = merged["fatigue_probability"].fillna(0)
    merged["recommendation"] = merged.get("recommendation", pd.Series(["Monitor"] * len(merged)))
    merged["recommendation"] = merged["recommendation"].fillna("Monitor")
    merged["explanation"] = merged.get("explanation", pd.Series([""] * len(merged)))
    merged["explanation"] = merged["explanation"].fillna("Performance within normal range.")
    merged["predicted_status"] = merged.get("predicted_status", pd.Series(["stable"] * len(merged)))
    merged["predicted_status"] = merged["predicted_status"].fillna("stable")

    full_log.append(f"=== Pipeline complete: {len(merged)} creatives processed ===")

    return {
        "master": master,
        "brain": brain,
        "decay": decay,
        "predictions": predictions,
        "recommendations": recs,
        "daily": daily,
        "merged": merged,
        "log": full_log,
    }
