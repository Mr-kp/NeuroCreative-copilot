import numpy as np
import joblib
from pathlib import Path
from pipeline_logger import get_logger

logger = get_logger("ml_predictor")

MODELS_DIR = Path(__file__).parent / "models"

_status_clf = None
_fatigue_reg = None
_perf_reg = None
_label_encoders = None
_metadata = None


def _load_models():
    global _status_clf, _fatigue_reg, _perf_reg, _label_encoders, _metadata
    if _status_clf is not None:
        return

    if not (MODELS_DIR / "status_classifier.pkl").exists():
        logger.warning("No saved models found in models/ — ML predictions unavailable")
        return

    _status_clf = joblib.load(MODELS_DIR / "status_classifier.pkl")
    _fatigue_reg = joblib.load(MODELS_DIR / "fatigue_regressor.pkl")
    _perf_reg = joblib.load(MODELS_DIR / "perf_regressor.pkl")
    _label_encoders = joblib.load(MODELS_DIR / "label_encoders.pkl")
    _metadata = joblib.load(MODELS_DIR / "model_metadata.pkl")
    logger.info(f"Loaded v3 boosted models ({len(_metadata['feature_columns'])} features, "
                f"accuracy={_metadata['accuracy']:.1%})")


def predict_creative(creative_row: dict, brain_scores: dict, image_feats: dict) -> dict:
    _load_models()

    if _status_clf is None:
        return {
            "predicted_status": "stable",
            "fatigue_probability": 0.3,
            "perf_score_predicted": 0.5,
            "model_source": "heuristic_fallback",
        }

    meta = _metadata
    enc = _label_encoders
    feat_cols = meta["feature_columns"]

    row = {}
    for col in meta["tier1_numeric"]:
        row[col] = float(creative_row.get(col, 0) or 0)
    for col in meta["tier2_campaign"]:
        row[col] = float(creative_row.get(col, 0) or 0)

    fmt = str(creative_row.get("format", "banner")).lower()
    row["is_video"] = 1 if fmt in ("rewarded_video", "interstitial_video", "video") else 0

    for col in meta["tier3_categorical"]:
        val = str(creative_row.get(col, "missing") or "missing")
        enc_col = col + "_enc"
        if col in enc:
            le = enc[col]
            if val in le.classes_:
                row[enc_col] = int(le.transform([val])[0])
            else:
                row[enc_col] = 0
        else:
            row[enc_col] = 0

    for col in meta["tier4_binary"]:
        row[col] = int(float(creative_row.get(col, 0) or 0))

    w = image_feats.get("width", float(creative_row.get("width", 360) or 360))
    h = image_feats.get("height", float(creative_row.get("height", 640) or 640))
    row["aspect_ratio"] = w / h if h > 0 else 0.5625

    brain_map = {
        "attention_score_real": brain_scores.get("attention_score", 50),
        "reward_score_real": brain_scores.get("reward_score", 50),
        "memory_score_real": brain_scores.get("memory_score", 50),
        "emotion_score_real": brain_scores.get("emotion_score", 50),
        "visual_load_score_real": brain_scores.get("visual_load_score", 50),
    }
    row.update(brain_map)

    for col in meta["image_features"]:
        row[col] = float(image_feats.get(col, 0))

    countries_str = str(creative_row.get("countries", "") or "")
    country_parts = [c.strip() for c in countries_str.split("|") if c.strip()]
    row["country_count"] = len(country_parts)
    for c in meta["all_countries"]:
        row[f"country_{c}"] = 1 if c in country_parts else 0

    row["motion_x_duration"] = row.get("motion_score", 0) * row.get("duration_sec", 0)
    row["text_density_x_readability"] = row.get("text_density", 0) * row.get("readability_score", 0)
    row["novelty_x_clutter"] = row.get("novelty_score", 0) * row.get("clutter_score", 0)
    row["faces_x_motion"] = row.get("faces_count", 0) * row.get("motion_score", 0)
    row["brightness_x_edge_density"] = row.get("brightness", 0) * row.get("edge_density", 0)
    row["saturation_x_color_var"] = row.get("saturation_mean", 0) * row.get("color_var", 0)
    row["emotion_x_visual_load"] = row.get("emotion_score_real", 50) * row.get("visual_load_score_real", 50)
    row["attention_x_duration"] = row.get("attention_score_real", 50) * row.get("duration_sec", 0)
    row["memory_x_text_density"] = row.get("memory_score_real", 50) * row.get("text_density", 0)
    row["clutter_x_edge_density"] = row.get("clutter_score", 0) * row.get("edge_density", 0)
    row["brand_vis_x_symmetry"] = row.get("brand_visibility_score", 0) * row.get("symmetry_v", 0)
    row["novelty_x_saturation"] = row.get("novelty_score", 0) * row.get("saturation_mean", 0)

    X = np.array([[row.get(c, -999) for c in feat_cols]], dtype=float)
    X = np.nan_to_num(X, nan=-999)

    status_code = int(_status_clf.predict(X)[0])
    fatigue_prob = float(np.clip(_fatigue_reg.predict(X)[0], 0, 1))
    perf_pred = float(_perf_reg.predict(X)[0])

    status_name = meta["status_inverse"].get(status_code, "stable")

    return {
        "predicted_status": status_name,
        "fatigue_probability": fatigue_prob,
        "perf_score_predicted": perf_pred,
        "model_source": "v3_boosted_lgbm",
    }
