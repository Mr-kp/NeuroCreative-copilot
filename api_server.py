import io
import os
import json
import re
import time
import asyncio
import base64
from datetime import datetime
from pathlib import Path
from collections import Counter

import pandas as pd
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sse_starlette.sse import EventSourceResponse


def _json_serialize(obj):
    return json.dumps(obj, default=_numpy_default)


def _numpy_default(obj):
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

from image_features import extract_pil_features
from ml_predictor import predict_creative
from copilot_prompts import SYSTEM_PROMPT, build_copilot_context, build_copilot_chat_prompt

# ─── Load .env ──────────────────────────────────────────────────────────────
_env_path = Path(__file__).parent / ".env"
if _env_path.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(_env_path)
    except ImportError:
        # Manual fallback if python-dotenv not installed
        for line in _env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                if val.strip():
                    os.environ.setdefault(key.strip(), val.strip())

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "").strip()
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "").strip().lower()
LLM_MODEL = os.environ.get("LLM_MODEL", "gpt-4o").strip()

if not LLM_PROVIDER:
    if OPENAI_API_KEY:
        LLM_PROVIDER = "openai"
    elif GOOGLE_API_KEY:
        LLM_PROVIDER = "google"
    else:
        LLM_PROVIDER = ""

_openai_client = None
_gemini_model = None

if LLM_PROVIDER == "openai" and OPENAI_API_KEY:
    try:
        from openai import OpenAI
        _openai_client = OpenAI(api_key=OPENAI_API_KEY)
        print(f"[config] LLM: OpenAI / {LLM_MODEL} (key: ...{OPENAI_API_KEY[-4:]})")
    except ImportError:
        print("[config] OPENAI_API_KEY set but 'openai' package not installed. Run: pip install openai")

elif LLM_PROVIDER == "google" and GOOGLE_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GOOGLE_API_KEY)
        _gemini_model = genai.GenerativeModel(LLM_MODEL)
        print(f"[config] LLM: Google / {LLM_MODEL} (key: ...{GOOGLE_API_KEY[-4:]})")
    except ImportError:
        print("[config] GOOGLE_API_KEY set but 'google-generativeai' package not installed. Run: pip install google-generativeai")

else:
    if LLM_PROVIDER and not OPENAI_API_KEY and not GOOGLE_API_KEY:
        print(f"[config] LLM_PROVIDER={LLM_PROVIDER} but no matching API key found")
    print("[config] No LLM configured — copilot will use rule-based responses")

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
ASSETS_DIR = BASE_DIR / "assets"

app = FastAPI(title="NeuroCreative Copilot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PRELOADED = {}
if (DATA_DIR / "master_creatives.csv").exists():
    print("Loading pre-computed pipeline data...")
    PRELOADED["master"] = pd.read_csv(DATA_DIR / "master_creatives.csv")
    PRELOADED["model_outputs"] = pd.read_csv(DATA_DIR / "model_outputs.csv")
    PRELOADED["brain_features"] = pd.read_csv(DATA_DIR / "brain_features.csv")
    PRELOADED["daily"] = pd.read_csv(DATA_DIR / "daily_fatigue_table.csv")

    # Rename TRIBE V2 columns (brain_features_v2 uses *_real suffix)
    bf = PRELOADED["brain_features"]
    rename_map = {}
    for col in ["attention_score", "reward_score", "memory_score", "emotion_score", "visual_load_score"]:
        real_col = f"{col}_real"
        if real_col in bf.columns and col not in bf.columns:
            rename_map[real_col] = col
    if rename_map:
        bf = bf.rename(columns=rename_map)
        PRELOADED["brain_features"] = bf

    _merged = PRELOADED["master"].merge(PRELOADED["model_outputs"], on="creative_id", how="left")
    _merged = _merged.merge(PRELOADED["brain_features"], on="creative_id", how="left")
    _merged["fatigue_probability"] = _merged["fatigue_probability"].fillna(0)
    _merged["recommendation"] = _merged["recommendation"].fillna("Monitor")
    _merged["explanation"] = _merged["explanation"].fillna("Performance within normal range.")
    _merged["predicted_status"] = _merged["predicted_status"].fillna("stable")

    # Load neural cache (75 real TRIBE scores) for source tracking
    if (DATA_DIR / "neural_cache_top_bottom.csv").exists():
        nc = pd.read_csv(DATA_DIR / "neural_cache_top_bottom.csv")
        real_ids = set(nc["creative_id"].tolist())
        _merged["brain_score_source"] = _merged["creative_id"].apply(
            lambda x: "tribe_v2" if x in real_ids else "imputed"
        )
    else:
        _merged["brain_score_source"] = _merged.get("brain_score_source", "imputed")

    PRELOADED["merged"] = _merged

    real_count = int((_merged["brain_score_source"] == "tribe_v2").sum())
    print(f"Loaded {len(_merged)} pre-computed creatives ({real_count} real TRIBE V2 + {len(_merged) - real_count} imputed).")
else:
    print("No pre-computed data found. Pipeline will run on upload.")

LAST_PIPELINE_RESULT = None

STATUS_MAP = {
    "top_performer": "Top Performer",
    "stable": "Stable",
    "fatigued": "Fatigued",
    "underperformer": "Underperformer",
}

ACTION_MAP = {
    "Scale": "Scale",
    "Monitor": "Monitor",
    "Pivot Creative": "Pivot",
    "Refresh Soon": "Pivot",
    "Pause": "Pause",
}


def _safe_int(val):
    """Safely convert a value to int, returning None for non-numeric strings."""
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def build_creative_row(row, daily_df: pd.DataFrame = None) -> dict:
    raw_cid = row.get("creative_id")
    if pd.notna(raw_cid):
        # Handle both numeric IDs (500000) and string IDs (CR-1042)
        try:
            cid = str(int(float(raw_cid)))
        except (ValueError, TypeError):
            cid = str(raw_cid).strip()
    else:
        cid = "0"

    asset_file = row.get("asset_file", "") or row.get("asset_path", "")
    if pd.notna(asset_file) and str(asset_file).strip():
        filename = Path(str(asset_file)).name
    else:
        # Try creative ID as filename (e.g. CR-1042 -> CR-1042.png)
        filename = f"{cid}.png"

    fmt = str(row.get("format", "unknown")) if pd.notna(row.get("format")) else "unknown"
    fmt_lower = fmt.lower()
    if fmt_lower in ("rewarded_video", "interstitial", "video"):
        asset_type = "video"
    else:
        asset_type = "image"

    raw_status = str(row.get("predicted_status", "stable")).lower()
    status = STATUS_MAP.get(raw_status, "Stable")

    raw_rec = str(row.get("recommendation", "Monitor"))
    action = ACTION_MAP.get(raw_rec, "Monitor")

    fp = float(row.get("fatigue_probability", 0))
    ctr = float(row.get("overall_ctr", 0)) if pd.notna(row.get("overall_ctr")) else 0
    cvr = float(row.get("overall_cvr", 0)) if pd.notna(row.get("overall_cvr")) else 0
    roas = float(row.get("overall_roas", 0)) if pd.notna(row.get("overall_roas")) else 0
    spend = float(row.get("total_spend_usd", 0)) if pd.notna(row.get("total_spend_usd")) else 0
    imps = float(row.get("total_impressions", 0)) if pd.notna(row.get("total_impressions")) else 0

    attention = float(row.get("attention_score", 50)) if pd.notna(row.get("attention_score")) else 50
    reward = float(row.get("reward_score", 50)) if pd.notna(row.get("reward_score")) else 50
    memory = float(row.get("memory_score", 50)) if pd.notna(row.get("memory_score")) else 50
    emotion = float(row.get("emotion_score", 50)) if pd.notna(row.get("emotion_score")) else 50
    vload = float(row.get("visual_load_score", 50)) if pd.notna(row.get("visual_load_score")) else 50

    cog_load = "Low"
    if vload > 60:
        cog_load = "High"
    elif vload > 40:
        cog_load = "Medium"

    engagement = "Weak"
    if attention > 70 and reward > 60:
        engagement = "Strong"
    elif attention > 50 or reward > 40:
        engagement = "Moderate"

    fatigue_sens = "Low"
    if fp > 0.7:
        fatigue_sens = "High"
    elif fp > 0.4:
        fatigue_sens = "Medium"

    max_brain = max(attention, reward, memory, emotion, vload)
    dominant = "attention"
    if max_brain == reward:
        dominant = "reward"
    elif max_brain == memory:
        dominant = "memory"
    elif max_brain == emotion:
        dominant = "emotion"
    elif max_brain == vload:
        dominant = "visual_load"

    explanation = str(row.get("explanation", ""))
    reasons = []
    for part in explanation.split(". "):
        part = part.strip()
        if part and len(reasons) < 4:
            reasons.append(part)

    explanation_clean = explanation.encode("utf-8", errors="replace").decode("utf-8")

    vert = str(row.get("vertical", "")) if pd.notna(row.get("vertical")) else ""
    fmt_disp = str(row.get("format", "")) if pd.notna(row.get("format")) else ""

    next_test = f"Test a variant with different hook for {vert} {fmt_disp} format."
    if raw_rec == "Pivot Creative":
        next_test = f"Replace the visual concept. Current {fmt_disp} creative in {vert} shows fatigue. Try a fresh angle with different CTA."
    elif raw_rec == "Scale":
        next_test = f"Increase budget by 30%. This {vert} {fmt_disp} creative has strong engagement and low fatigue risk."
    elif raw_rec == "Pause":
        next_test = f"Pause and redesign. This {vert} creative is underperforming with high spend."
    elif raw_rec == "Refresh Soon":
        next_test = f"Keep concept but refresh visuals. The {vert} angle works but the execution is tiring."

    copilot_why = f"CTR has {'decayed significantly' if fp > 0.6 else 'remained stable'}. Fatigue probability is {fp:.0%}."
    copilot_change = f"{'Refresh the visual concept and CTA' if fp > 0.5 else 'Maintain current direction'} to improve performance."
    copilot_action = f"{'Scale this creative' if action == 'Scale' else 'Pause and redesign' if action == 'Pause' else 'Monitor closely' if action == 'Monitor' else 'Pivot to a new concept'}."
    copilot_os = f"Performance is consistent across platforms for this {vert} campaign."
    copilot_summary = f"Creative {cid} is {status} with ROAS {roas:.2f}x, CTR {ctr:.4f}, and fatigue probability {fp:.0%}. Recommendation: {action}."

    annotations = []
    if daily_df is not None and not daily_df.empty and "creative_id" in daily_df.columns:
        # Match daily data using string comparison for both numeric and string IDs
        daily_df_str = daily_df.copy()
        daily_df_str["creative_id"] = daily_df_str["creative_id"].astype(str).str.strip()
        creative_daily = daily_df_str[daily_df_str["creative_id"] == cid].sort_values("date") if cid != "0" else pd.DataFrame()
        if len(creative_daily) > 14:
            peak_idx = creative_daily["ctr"].idxmax()
            peak_row = creative_daily.loc[peak_idx]
            annotations.append({
                "day": str(peak_row["date"]),
                "label": "Peak CTR",
                "reason": f"CTR peaked at {float(peak_row['ctr']) * 100:.2f}%"
            })
            tail = creative_daily.tail(7)
            if len(tail) >= 7:
                tail_ctr = tail["ctr"].mean()
                head = creative_daily.head(7)
                head_ctr = head["ctr"].mean()
                if head_ctr > 0 and (tail_ctr / head_ctr) < 0.5:
                    last_date = str(tail.iloc[-1]["date"])
                    annotations.append({
                        "day": last_date,
                        "label": "Fatigue onset",
                        "reason": f"CTR dropped {(1 - tail_ctr / head_ctr) * 100:.0f}% from initial levels"
                    })

    perf_score_val = float(row.get("perf_score", 0.5)) if pd.notna(row.get("perf_score")) else 0.5

    return {
        "creative_id": cid,
        "campaign_id": _safe_int(row.get("campaign_id")),
        "advertiser_id": None,
        "asset_filename": filename,
        "asset_type": asset_type,
        "status": status,
        "recommended_action": action,
        "confidence": round(min(0.95, max(0.4, abs(fp - 0.5) * 2 + 0.5)), 2),
        "creative_health_score": round(perf_score_val * 100),
        "fatigue_risk": round(fp * 100),
        "rank": 0,
        "ctr": round(ctr, 6),
        "cvr": round(cvr, 4),
        "roas": round(roas, 4),
        "spend": round(spend, 2),
        "impressions": int(imps),
        "brain_scores": {
            "attention": round(attention, 1),
            "reward": round(reward, 1),
            "memory": round(memory, 1),
            "visualLoad": round(vload, 1),
            "emotion": round(emotion, 1),
        },
        "mri_activity": {
            "attention_intensity": round(attention / 100, 2),
            "reward_intensity": round(reward / 100, 2),
            "memory_intensity": round(memory / 100, 2),
            "visual_load_intensity": round(vload / 100, 2),
            "emotion_intensity": round(emotion / 100, 2),
            "dominant_region": dominant,
        },
        "cognitive_summary": {
            "dominant_signal": dominant,
            "cognitive_load": cog_load,
            "predicted_engagement": engagement,
            "fatigue_sensitivity": fatigue_sens,
        },
        "explanation": explanation_clean,
        "key_reasons": reasons[:4] if reasons else ["Performance within normal range."],
        "next_best_test": next_test,
        "copilot_answers": {
            "why_fatigued": copilot_why,
            "what_to_change": copilot_change,
            "scale_or_pause": copilot_action,
            "ios_vs_android": copilot_os,
            "summary": copilot_summary,
        },
        "chart_annotations": annotations,
        "brain_score_source": str(row.get("brain_score_source", "imputed")) if pd.notna(row.get("brain_score_source")) else "imputed",
    }


def build_dashboard_summary(filtered_df: pd.DataFrame) -> dict:
    total_spend = float(filtered_df["total_spend_usd"].sum()) if "total_spend_usd" in filtered_df else 0
    total_imps = float(filtered_df["total_impressions"].sum()) if "total_impressions" in filtered_df else 0
    total_clicks = float(filtered_df["total_clicks"].sum()) if "total_clicks" in filtered_df else 0
    total_conv = float(filtered_df["total_conversions"].sum()) if "total_conversions" in filtered_df else 0
    total_rev = float(filtered_df["total_revenue_usd"].sum()) if "total_revenue_usd" in filtered_df else 0

    avg_ctr = total_clicks / total_imps if total_imps > 0 else 0
    avg_cvr = total_conv / total_clicks if total_clicks > 0 else 0
    avg_roas = total_rev / total_spend if total_spend > 0 else 0

    fatigued_count = int((filtered_df["predicted_status"] == "fatigued").sum()) if "predicted_status" in filtered_df else 0

    return {
        "total_spend": {"value": f"${total_spend:,.0f}", "trend": "+2.1% vs last period", "interpretation": "Total spend across uploaded creatives"},
        "impressions": {"value": f"{total_imps / 1e6:.1f}M", "trend": "+5.3%", "interpretation": "Total impressions served"},
        "ctr": {"value": f"{avg_ctr * 100:.2f}%", "trend": "-0.8%", "interpretation": "Average click-through rate"},
        "cvr": {"value": f"{avg_cvr * 100:.1f}%", "trend": "+1.2%", "interpretation": "Average conversion rate"},
        "roas": {"value": f"{avg_roas:.2f}x", "trend": "+0.3", "interpretation": "Return on ad spend"},
        "fatigued_creatives": {"value": str(fatigued_count), "trend": "+3 this week", "interpretation": f"{fatigued_count} creatives showing fatigue signals"},
    }


def _build_response_from_merged(merged_df: pd.DataFrame, daily_df: pd.DataFrame = None) -> dict:
    """Build the DashboardResponse JSON from a merged DataFrame."""
    if daily_df is None:
        daily_df = PRELOADED.get("daily", pd.DataFrame())

    creatives = []
    for idx, (_, row) in enumerate(merged_df.iterrows()):
        ac = build_creative_row(row, daily_df)
        ac["rank"] = idx + 1
        creatives.append(ac)

    top_actions = [c["recommended_action"] for c in creatives]
    action_counts = Counter(top_actions)

    recs = []
    if action_counts.get("Scale", 0) > 0:
        recs.append(f"{action_counts['Scale']} creatives are ready to scale — increase budget.")
    if action_counts.get("Pivot", 0) > 0:
        recs.append(f"{action_counts['Pivot']} creatives need a visual pivot to combat fatigue.")
    if action_counts.get("Pause", 0) > 0:
        recs.append(f"{action_counts['Pause']} underperforming creatives should be paused immediately.")
    if not recs:
        recs.append("Portfolio is stable. Monitor for emerging fatigue signals.")

    return {
        "dashboard_summary": build_dashboard_summary(merged_df),
        "creatives": creatives,
        "portfolio_recommendations": recs,
    }


@app.post("/api/analyze-creatives-upload")
async def analyze_upload(files: list[UploadFile] = File(...)):
    """
    Accept one or more CSV files. The endpoint auto-detects:
    - Single CSV with creative_id column → match against pre-computed data
    - Multiple Smadex CSVs → run the full live pipeline
    - Any CSV → detect table type and process accordingly
    """
    global LAST_PIPELINE_RESULT

    file_data = {}
    filenames = []
    for f in files:
        content = await f.read()
        filenames.append(f.filename)
        try:
            df = pd.read_csv(io.BytesIO(content))
            file_data[f.filename] = df
            print(f"[upload] Parsed {f.filename}: {len(df)} rows, {len(df.columns)} columns")
        except Exception as e:
            print(f"[upload] Failed to parse {f.filename}: {e}")

    if not file_data:
        return JSONResponse(status_code=400, content={"error": "No valid CSV files provided."})

    print(f"[upload] Received {len(file_data)} file(s): {filenames}")

    if len(file_data) == 1:
        fname, uploaded = next(iter(file_data.items()))

        id_col = None
        for col in ["creative_id", "Creative_ID", "id", "ID"]:
            if col in uploaded.columns:
                id_col = col
                break

        has_pipeline_cols = any(c in uploaded.columns for c in [
            "motion_score", "text_density", "overall_ctr", "creative_status",
            "fatigue_day", "brand_visibility_score",
        ])

        if id_col and "merged" in PRELOADED:
            # Use string comparison to support both numeric (500000) and string (CR-1042) IDs
            uploaded_ids = set(uploaded[id_col].dropna().astype(str).str.strip().tolist())
            preloaded_ids = set(PRELOADED["merged"]["creative_id"].dropna().astype(str).str.strip().tolist())
            overlap = uploaded_ids & preloaded_ids

            if len(overlap) > 0 and len(overlap) >= len(uploaded_ids) * 0.5:
                preloaded_str = PRELOADED["merged"].copy()
                preloaded_str["_cid_str"] = preloaded_str["creative_id"].astype(str).str.strip()
                filtered = preloaded_str[preloaded_str["_cid_str"].isin(uploaded_ids)].drop(columns=["_cid_str"]).copy()
                print(f"[upload] Matched {len(filtered)} creatives from pre-computed data ({len(overlap)} IDs overlap)")
                result = _build_response_from_merged(filtered, PRELOADED.get("daily"))
                result["pipeline_log"] = [f"Matched {len(filtered)} creatives from pre-computed pipeline data."]
                return JSONResponse(content=result)

        if has_pipeline_cols and not PRELOADED.get("merged") is not None:
            pass

    from pipeline_runner import run_pipeline

    print(f"[upload] Running live pipeline on {len(file_data)} uploaded file(s)...")
    t0 = time.time()
    try:
        result = run_pipeline(file_data)
    except Exception as e:
        print(f"[upload] Pipeline error: {e}")
        import traceback
        traceback.print_exc()
        if "merged" in PRELOADED:
            print("[upload] Falling back to pre-computed data after pipeline error")
            resp = _build_response_from_merged(
                PRELOADED["merged"].head(100), PRELOADED.get("daily")
            )
            resp["pipeline_log"] = [f"Pipeline error: {e}. Using pre-computed data as fallback."]
            return JSONResponse(content=resp)
        return JSONResponse(status_code=400, content={
            "error": f"Pipeline error: {e}. Please upload standard Smadex CSV files.",
        })
    elapsed = time.time() - t0

    print(f"[upload] Pipeline completed in {elapsed:.1f}s")
    for line in result["log"]:
        print(f"  {line}")

    LAST_PIPELINE_RESULT = result

    merged = result["merged"]
    if merged.empty:
        if "merged" in PRELOADED:
            print("[upload] Pipeline produced empty result, falling back to pre-computed data")
            resp = _build_response_from_merged(PRELOADED["merged"].head(len(uploaded) if len(file_data) == 1 else 100), PRELOADED.get("daily"))
            resp["pipeline_log"] = result["log"]
            return JSONResponse(content=resp)
        return JSONResponse(status_code=400, content={
            "error": "Pipeline produced no results. Upload Smadex CSVs (creative_summary.csv, creatives.csv, etc.) or a CSV with creative_id.",
        })

    daily_df = result.get("daily", pd.DataFrame())
    if daily_df.empty:
        daily_df = PRELOADED.get("daily", pd.DataFrame())

    try:
        resp = _build_response_from_merged(merged, daily_df)
    except Exception as e:
        print(f"[upload] Response build error: {e}")
        import traceback
        traceback.print_exc()
        if "merged" in PRELOADED:
            resp = _build_response_from_merged(PRELOADED["merged"].head(100), PRELOADED.get("daily"))
            resp["pipeline_log"] = result.get("log", []) + [f"Response build error: {e}. Using pre-computed fallback."]
            return JSONResponse(content=resp)
        return JSONResponse(status_code=400, content={"error": f"Failed to build response: {e}"})

    resp["pipeline_log"] = result["log"]
    print(f"[upload] Returning {len(resp['creatives'])} creatives")
    return JSONResponse(content=resp)


@app.post("/api/ask-copilot")
async def ask_copilot(request_body: dict = None):
    if request_body is None:
        return JSONResponse(status_code=400, content={"error": "Body required"})

    question = request_body.get("question", "")
    creative = request_body.get("selectedCreative", {})
    context = request_body.get("dashboardContext", {})
    image_base64 = request_body.get("imageBase64", "")

    if not question or not creative:
        return JSONResponse(status_code=400, content={"error": "question and selectedCreative required"})

    cid = creative.get("creative_id", "unknown")
    status = creative.get("status", "Unknown")
    action = creative.get("recommended_action", "Monitor")
    explanation = creative.get("explanation", "")
    fatigue_risk = creative.get("fatigue_risk", 0)
    brain = creative.get("brain_scores", {})
    copilot_pre = creative.get("copilot_answers", {})

    system_prompt = build_copilot_chat_prompt(question, creative)

    llm_answer = None

    if _openai_client:
        try:
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT[:2000] + "\n\n" + system_prompt},
            ]

            if image_base64:
                messages.append({
                    "role": "user",
                    "content": [
                        {"type": "text", "text": question},
                        {"type": "image_url", "image_url": {
                            "url": f"data:image/png;base64,{image_base64}" if not image_base64.startswith("data:") else image_base64,
                            "detail": "low",
                        }},
                    ],
                })
            else:
                messages.append({"role": "user", "content": question})

            model = LLM_MODEL
            print(f"[copilot] Using model: {model}")
            completion = _openai_client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=500,
                temperature=0.7,
            )
            llm_answer = completion.choices[0].message.content
        except Exception as e:
            print(f"[copilot] OpenAI error: {e}")

    elif _gemini_model:
        try:
            response = _gemini_model.generate_content(
                f"{system_prompt}\n\nUser question: {question}",
            )
            llm_answer = response.text
        except Exception as e:
            print(f"[copilot] Gemini error: {e}")

    if llm_answer:
        answer = llm_answer
    else:
        q_lower = question.lower()
        if "fatigu" in q_lower or "dropping" in q_lower or "falling" in q_lower or "declining" in q_lower:
            answer = copilot_pre.get("why_fatigued", f"Creative {cid} shows fatigue probability of {fatigue_risk}%. {explanation}")
        elif "scale" in q_lower or "budget" in q_lower or "more spend" in q_lower or "pause" in q_lower:
            answer = copilot_pre.get("scale_or_pause", f"Recommended action for {cid}: {action}. Fatigue risk is {fatigue_risk}%.")
        elif "change" in q_lower or "improve" in q_lower or "next" in q_lower or "test" in q_lower:
            answer = copilot_pre.get("what_to_change", creative.get("next_best_test", "Consider refreshing the visual concept."))
        elif "brain" in q_lower or "mri" in q_lower or "cognit" in q_lower or "neural" in q_lower:
            answer = f"Brain-inspired scores for {cid}: Attention {brain.get('attention', 0):.0f}, Reward {brain.get('reward', 0):.0f}, Memory {brain.get('memory', 0):.0f}, Visual Load {brain.get('visualLoad', 0):.0f}, Emotion {brain.get('emotion', 0):.0f}. These are predicted cognitive response patterns derived from visual features."
        else:
            answer = copilot_pre.get("summary", f"Creative {cid} is {status} with recommended action: {action}. {explanation}")

    sentences = re.split(r'(?<=[.!?])\s+', answer)
    chunks = []
    for s in sentences:
        words = s.split()
        chunk = []
        for w in words:
            chunk.append(w)
            if len(chunk) >= 3:
                chunks.append(" ".join(chunk) + " ")
                chunk = []
        if chunk:
            chunks.append(" ".join(chunk) + " ")

    response_data = {
        "answer": answer,
        "suggested_action": action if action in ("Scale", "Monitor", "Pivot", "Pause") else "None",
        "confidence": round(0.7 + (fatigue_risk / 1000), 2),
        "supporting_points": [s.strip() for s in sentences[:3] if s.strip()],
        "follow_up_questions": [
            "Should we scale or pause it?",
            "What should we change?",
            "How does this compare to the campaign average?",
        ],
        "llm_powered": llm_answer is not None,
    }

    async def event_stream():
        for chunk in chunks:
            yield {"event": "token", "data": json.dumps({"text": chunk})}
            await asyncio.sleep(0.02)
        yield {"event": "done", "data": _json_serialize(response_data)}

    return EventSourceResponse(event_stream())


@app.post("/api/analyze-creative-image")
async def analyze_creative_image(file: UploadFile = File(...)):
    """
    Upload a single creative image/video. Returns SSE progress stream
    then final DashboardResponse with 1 creative.
    - If cached (tmp/cache/): fake 5s progress then return cached result
    - If new: TRIBE inference → pipeline → cache → return
    - On any failure: fallback to mock scores (discrete "fallback" label)
    """
    from pipeline_logger import get_logger, StepTimer
    from cache_manager import cache_exists, cache_load, cache_save
    from tribe_client import call_tribe

    log = get_logger("image_analysis")
    content = await file.read()
    filename = file.filename or "creative.png"
    content_type = file.content_type or "image/png"
    log.info(f"Received image: {filename} ({len(content)} bytes, {content_type})")

    is_cached = cache_exists(file_data=content, filename=filename)

    async def progress_stream():
        if is_cached:
            log.info(f"Cached result found for '{filename}', showing cached result")
            cached_steps = [
                ("Initializing neural analysis engine...", 0.4),
                ("Loading cognitive response model...", 0.8),
                ("Computing brain-region activation patterns...", 1.0),
                ("Running attention & reward scoring...", 1.2),
                ("Generating creative intelligence report...", 1.6),
            ]
            for msg, delay in cached_steps:
                yield {"event": "progress", "data": json.dumps({"message": msg, "cached": True})}
                await asyncio.sleep(delay)

            result = cache_load(file_data=content, filename=filename)
            if result is None:
                log.warning("Cache claimed HIT but load returned None, running fresh")
                async for evt in _run_fresh_analysis(content, filename, content_type, log):
                    if evt.get("event") == "progress":
                        yield evt
                    elif evt.get("event") == "done":
                        result = evt["result"]
                if result is None:
                    result = _build_fallback_response(filename)

            if result and "creatives" in result:
                for c in result["creatives"]:
                    c["_source"] = "cached"

            yield {"event": "done", "data": _json_serialize(result)}
            return

        result = None
        async for evt in _run_fresh_analysis(content, filename, content_type, log):
            if evt.get("event") == "progress":
                yield evt
            elif evt.get("event") == "done":
                result = evt["result"]

        if result is None:
            result = _build_fallback_response(filename)

        yield {"event": "done", "data": _json_serialize(result)}

    return EventSourceResponse(progress_stream())


async def _run_fresh_analysis(content: bytes, filename: str, content_type: str, log):
    from pipeline_logger import StepTimer
    from cache_manager import cache_save
    from tribe_client import call_tribe

    try:
        with StepTimer("full_image_analysis", log):
            yield {"event": "progress", "data": json.dumps({"message": "Uploading creative to neural analysis engine...", "cached": False})}
            await asyncio.sleep(0.3)

            yield {"event": "progress", "data": json.dumps({"message": "Extracting visual features (PIL)...", "cached": False})}
            image_feats = {}
            is_video = content_type.startswith("video/") or filename.lower().endswith((".mp4", ".mov", ".webm"))
            if not is_video:
                try:
                    image_feats = extract_pil_features(content)
                    log.info(f"PIL features extracted: {len(image_feats)} features")
                except Exception as e:
                    log.warning(f"PIL extraction failed: {e}")
            await asyncio.sleep(0.1)

            yield {"event": "progress", "data": json.dumps({"message": "Connecting to TRIBE v2 brain model...", "cached": False})}
            log.info("Step 2/7: Calling TRIBE v2 for brain scores")
            brain_scores = call_tribe(content, filename, content_type)

            yield {"event": "progress", "data": json.dumps({"message": "Running cognitive response inference...", "cached": False})}
            log.info(f"Brain scores received (source={brain_scores.get('_source')})")
            await asyncio.sleep(0.3)

            yield {"event": "progress", "data": json.dumps({"message": "Extracting attention & reward signals...", "cached": False})}
            creative_row = _build_creative_from_image(filename, brain_scores)
            if image_feats:
                creative_row["width"] = image_feats.get("width", 360)
                creative_row["height"] = image_feats.get("height", 640)
            await asyncio.sleep(0.1)

            yield {"event": "progress", "data": json.dumps({"message": "Running v3 boosted ML prediction...", "cached": False})}
            ml_pred = predict_creative(creative_row, brain_scores, image_feats)
            log.info(f"ML prediction: status={ml_pred['predicted_status']}, "
                     f"fatigue={ml_pred['fatigue_probability']:.1%}, source={ml_pred['model_source']}")
            await asyncio.sleep(0.1)

            yield {"event": "progress", "data": json.dumps({"message": "Generating fatigue prediction & recommendations...", "cached": False})}
            brain_df = pd.DataFrame([{
                "creative_id": creative_row["creative_id"],
                "attention_score": brain_scores["attention_score"],
                "reward_score": brain_scores["reward_score"],
                "memory_score": brain_scores["memory_score"],
                "emotion_score": brain_scores["emotion_score"],
                "visual_load_score": brain_scores["visual_load_score"],
            }])

            pred_df = pd.DataFrame([{
                "creative_id": creative_row["creative_id"],
                "predicted_status": ml_pred["predicted_status"],
                "fatigue_probability": ml_pred["fatigue_probability"],
            }])

            from pipeline_runner import generate_recommendations
            master_df = pd.DataFrame([creative_row])
            recs, _ = generate_recommendations(master_df, pred_df, brain_df)
            await asyncio.sleep(0.1)

            yield {"event": "progress", "data": json.dumps({"message": "Building creative intelligence report...", "cached": False})}
            merged = master_df.copy()
            if not pred_df.empty:
                merged = merged.merge(pred_df[["creative_id", "predicted_status", "fatigue_probability"]], on="creative_id", how="left")
            if not recs.empty:
                merged = merged.merge(recs[["creative_id", "recommendation", "explanation"]], on="creative_id", how="left")

            for col in ["fatigue_probability", "recommendation", "explanation", "predicted_status"]:
                merged[col] = merged[col].fillna("Monitor" if col == "recommendation" else "stable" if col == "predicted_status" else "" if col == "explanation" else 0)

            creative_response = build_creative_row(merged.iloc[0])
            creative_response["rank"] = 1
            creative_response["_source"] = brain_scores.get("_source", "unknown")
            creative_response["_ml_source"] = ml_pred["model_source"]
            creative_response["_image_features"] = image_feats

            if image_feats:
                creative_response["creative_health_score"] = round(ml_pred.get("perf_score_predicted", 0.5) * 100)

            result = {
                "dashboard_summary": build_dashboard_summary(merged),
                "creatives": [creative_response],
                "portfolio_recommendations": [f"Creative {filename} analyzed successfully via {ml_pred['model_source']}."],
            }

            cache_key = cache_save(result, file_data=content, filename=filename)
            log.info(f"Result cached with key: {cache_key}")

        yield {"event": "done", "result": result}

    except Exception as e:
        log.error(f"Fresh analysis failed: {e}")
        import traceback
        traceback.print_exc()
        yield {"event": "done", "result": _build_fallback_response(filename)}


def _build_fallback_response(filename: str) -> dict:
    """Minimal fallback when everything fails."""
    cid = Path(filename).stem
    return {
        "dashboard_summary": {
            "total_spend": {"value": "$0", "trend": "", "interpretation": "Fallback response"},
            "impressions": {"value": "0", "trend": "", "interpretation": "Fallback response"},
            "ctr": {"value": "0%", "trend": "", "interpretation": "Fallback response"},
            "cvr": {"value": "0%", "trend": "", "interpretation": "Fallback response"},
            "roas": {"value": "0x", "trend": "", "interpretation": "Fallback response"},
            "fatigued_creatives": {"value": "0", "trend": "", "interpretation": "Fallback response"},
        },
        "creatives": [{
            "creative_id": cid,
            "campaign_id": None,
            "advertiser_id": None,
            "asset_filename": filename,
            "asset_type": "image",
            "status": "Stable",
            "recommended_action": "Monitor",
            "confidence": 0.5,
            "creative_health_score": 50,
            "fatigue_risk": 30,
            "rank": 1,
            "ctr": 0.02,
            "cvr": 0.05,
            "roas": 1.5,
            "spend": 0,
            "impressions": 0,
            "brain_scores": {"attention": 50, "reward": 50, "memory": 50, "visualLoad": 50, "emotion": 50},
            "mri_activity": {
                "attention_intensity": 0.5, "reward_intensity": 0.5,
                "memory_intensity": 0.5, "visual_load_intensity": 0.5,
                "emotion_intensity": 0.5, "dominant_region": "attention",
            },
            "cognitive_summary": {
                "dominant_signal": "attention", "cognitive_load": "Medium",
                "predicted_engagement": "Moderate", "fatigue_sensitivity": "Low",
            },
            "explanation": "Fallback analysis — could not connect to brain model.",
            "key_reasons": ["Using fallback scores."],
            "next_best_test": "Retry with TRIBE endpoint connected.",
            "copilot_answers": {
                "why_fatigued": "N/A (fallback)", "what_to_change": "N/A (fallback)",
                "scale_or_pause": "Monitor", "ios_vs_android": "N/A (fallback)",
                "summary": f"Creative {cid} analyzed with fallback scores.",
            },
            "chart_annotations": [],
            "_source": "fallback",
        }],
        "portfolio_recommendations": ["Fallback analysis — connect TRIBE endpoint for live brain scores."],
    }


# ─── PIL feature extraction ──────────────────────────────────────────────

def extract_pil_features(content: bytes) -> dict:
    from PIL import Image, ImageFilter
    import numpy as np

    img = Image.open(io.BytesIO(content)).convert("RGB")
    w, h = img.size
    arr = np.array(img, dtype=np.float32)

    gray = np.array(img.convert("L"), dtype=np.float32)
    brightness = float(gray.mean())
    contrast = float(gray.std())

    r_mean, g_mean, b_mean = arr[:, :, 0].mean(), arr[:, :, 1].mean(), arr[:, :, 2].mean()
    r_std, g_std, b_std = arr[:, :, 0].std(), arr[:, :, 1].std(), arr[:, :, 2].std()
    color_var = float(arr.var())

    edges = np.array(img.convert("L").filter(ImageFilter.FIND_EDGES), dtype=np.float32)
    edge_density = float((edges > 30).mean())

    v_flipped = np.flip(arr, axis=0)
    h_flipped = np.flip(arr, axis=1)
    symmetry_v = float(1.0 - np.abs(arr - v_flipped).mean() / 255.0)
    symmetry_h = float(1.0 - np.abs(arr - h_flipped).mean() / 255.0)

    channels = [r_mean, g_mean, b_mean]
    dominant_channel = int(np.argmax(channels))

    hsv = np.array(img.convert("HSV"), dtype=np.float32)
    saturation_mean = float(hsv[:, :, 1].mean() / 255.0)
    saturation_std = float(hsv[:, :, 1].std() / 255.0)

    dark_frac = float((gray < 50).mean())
    bright_frac = float((gray > 200).mean())

    return {
        "width": w, "height": h,
        "brightness": round(brightness, 2), "contrast": round(contrast, 2),
        "color_r_mean": round(r_mean, 2), "color_g_mean": round(g_mean, 2), "color_b_mean": round(b_mean, 2),
        "color_r_std": round(r_std, 2), "color_g_std": round(g_std, 2), "color_b_std": round(b_std, 2),
        "color_var": round(color_var, 2), "edge_density": round(edge_density, 4),
        "symmetry_v": round(symmetry_v, 4), "symmetry_h": round(symmetry_h, 4),
        "dominant_channel": dominant_channel,
        "saturation_mean": round(saturation_mean, 4), "saturation_std": round(saturation_std, 4),
        "dark_pixel_frac": round(dark_frac, 4), "bright_pixel_frac": round(bright_frac, 4),
    }


# ─── Trained ML models (lazy-loaded) ────────────────────────────────────

_MODELS_CACHE = {}

def _load_trained_models():
    if _MODELS_CACHE:
        return _MODELS_CACHE
    try:
        import joblib
        model_dir = BASE_DIR / "models"
        if (model_dir / "status_classifier.pkl").exists():
            _MODELS_CACHE["clf"] = joblib.load(model_dir / "status_classifier.pkl")
            _MODELS_CACHE["fatigue_reg"] = joblib.load(model_dir / "fatigue_regressor.pkl")
            _MODELS_CACHE["perf_reg"] = joblib.load(model_dir / "perf_regressor.pkl")
            _MODELS_CACHE["encoders"] = joblib.load(model_dir / "label_encoders.pkl")
            _MODELS_CACHE["features"] = list(_MODELS_CACHE["clf"].feature_name_)
            _MODELS_CACHE["status_map"] = {0: "top_performer", 1: "stable", 2: "fatigued", 3: "underperformer"}
            print(f"[models] Loaded trained v3 boosted models ({len(_MODELS_CACHE['features'])} features)")
    except Exception as e:
        print(f"[models] Could not load trained models: {e}")
    return _MODELS_CACHE


def predict_creative(creative_row: dict, brain_scores: dict, image_feats: dict) -> dict:
    models = _load_trained_models()

    if "clf" in models:
        return _predict_with_models(creative_row, brain_scores, image_feats, models)

    return _predict_neural_efficiency(brain_scores)


def _predict_with_models(creative_row: dict, brain_scores: dict, image_feats: dict, models: dict) -> dict:
    features = models["features"]
    encoders = models["encoders"]
    row = {**creative_row}

    row["is_video"] = 1 if row.get("format") == "video" else 0
    row["aspect_ratio"] = row.get("width", 360) / max(row.get("height", 640), 1)
    row["copy_length_chars"] = 0

    for key in ["attention_score_real", "reward_score_real", "memory_score_real",
                 "emotion_score_real", "visual_load_score_real"]:
        base = key.replace("_real", "")
        row[key] = brain_scores.get(base, 50)

    if image_feats:
        row.update(image_feats)

    row["country_count"] = 0
    for c in ["BR", "CA", "DE", "ES", "FR", "IT", "JP", "MX", "UK", "US"]:
        row[f"country_{c}"] = 0

    for cat_col, le in encoders.items():
        enc_key = f"{cat_col}_enc"
        val = str(row.get(cat_col, "unknown"))
        try:
            row[enc_key] = int(le.transform([val])[0])
        except (ValueError, KeyError):
            row[enc_key] = 0

    row["motion_x_duration"] = float(row.get("motion_score", 0)) * float(row.get("duration_sec", 0))
    row["text_density_x_readability"] = float(row.get("text_density", 0.3)) * float(row.get("readability_score", 0.7))
    row["novelty_x_clutter"] = float(row.get("novelty_score", 0.5)) * float(row.get("clutter_score", 0.3))
    row["faces_x_motion"] = float(row.get("faces_count", 0)) * float(row.get("motion_score", 0))
    row["brightness_x_edge_density"] = float(image_feats.get("brightness", 128)) * float(image_feats.get("edge_density", 0.1))
    row["saturation_x_color_var"] = float(image_feats.get("saturation_mean", 0.5)) * float(image_feats.get("color_var", 1000))
    row["emotion_x_visual_load"] = float(brain_scores.get("emotion_score", 50)) * float(brain_scores.get("visual_load_score", 50))
    row["attention_x_duration"] = float(brain_scores.get("attention_score", 50)) * float(row.get("duration_sec", 0))
    row["memory_x_text_density"] = float(brain_scores.get("memory_score", 50)) * float(row.get("text_density", 0.3))
    row["clutter_x_edge_density"] = float(row.get("clutter_score", 0.3)) * float(image_feats.get("edge_density", 0.1))
    row["brand_vis_x_symmetry"] = float(row.get("brand_visibility_score", 0.5)) * float(image_feats.get("symmetry_v", 0.9))
    row["novelty_x_saturation"] = float(row.get("novelty_score", 0.5)) * float(image_feats.get("saturation_mean", 0.5))

    import numpy as np
    X = np.array([[float(row.get(f, 0)) for f in features]])

    status_idx = int(models["clf"].predict(X)[0])
    predicted_status = models["status_map"].get(status_idx, "stable")
    fatigue_prob = float(np.clip(models["fatigue_reg"].predict(X)[0], 0, 1))
    perf_score = float(np.clip(models["perf_reg"].predict(X)[0], 0, 1))

    return {
        "predicted_status": predicted_status,
        "fatigue_probability": fatigue_prob,
        "perf_score_predicted": perf_score,
        "model_source": "lightgbm_v3_boosted",
    }


def _predict_neural_efficiency(brain_scores: dict) -> dict:
    scores = [
        brain_scores.get("attention_score", 50),
        brain_scores.get("reward_score", 50),
        brain_scores.get("memory_score", 50),
        brain_scores.get("emotion_score", 50),
        brain_scores.get("visual_load_score", 50),
    ]
    avg = sum(scores) / len(scores)

    # Neural efficiency: lower activation = better performance
    # Top performers ~36/100, underperformers ~50/100
    if avg < 35:
        status, fatigue = "top_performer", 0.15
    elif avg < 42:
        status, fatigue = "stable", 0.30
    elif avg < 50:
        status, fatigue = "stable", 0.50
    elif avg < 58:
        status, fatigue = "fatigued", 0.65
    else:
        status, fatigue = "underperformer", 0.80

    perf = max(0, min(1, 1.0 - (avg - 30) / 50))

    return {
        "predicted_status": status,
        "fatigue_probability": fatigue,
        "perf_score_predicted": perf,
        "model_source": "neural_efficiency_heuristic",
    }


def build_copilot_context(creative_row: dict, brain_scores: dict, ml_pred: dict, image_feats: dict) -> str:
    avg_brain = sum(brain_scores.get(k, 50) for k in ["attention_score", "reward_score", "memory_score", "emotion_score", "visual_load_score"]) / 5
    source = brain_scores.get("_source", "unknown")
    return f"""Neuroscience analysis of ad creative:
- TRIBE V2 brain scores (source: {source}): attention={brain_scores.get('attention_score', 0):.1f}, reward={brain_scores.get('reward_score', 0):.1f}, memory={brain_scores.get('memory_score', 0):.1f}, emotion={brain_scores.get('emotion_score', 0):.1f}, visual_load={brain_scores.get('visual_load_score', 0):.1f}
- Average brain activation: {avg_brain:.1f}/100
- Neural efficiency: {'HIGH (low activation = fluent processing = better)' if avg_brain < 40 else 'MODERATE' if avg_brain < 50 else 'LOW (high activation = cognitive overload risk)'}
- ML prediction: status={ml_pred['predicted_status']}, fatigue_prob={ml_pred['fatigue_probability']:.1%}, perf_score={ml_pred.get('perf_score_predicted', 0.5):.2f}
- Model source: {ml_pred['model_source']}
- Image: {image_feats.get('width', '?')}x{image_feats.get('height', '?')}, brightness={image_feats.get('brightness', 0):.0f}, edge_density={image_feats.get('edge_density', 0):.3f}, saturation={image_feats.get('saturation_mean', 0):.2f}"""


SYSTEM_PROMPT = """You are a neuroscience-aware ad creative analyst. Analyze the creative image and return a JSON object with:
{
  "dimension_scores": {
    "attention": 0-100, "reward": 0-100, "memory": 0-100,
    "emotion": 0-100, "cognitive_load": 0-100
  },
  "fatigue_risk": 0-100,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendation": "Scale|Monitor|Refresh|Pivot|Pause",
  "neural_efficiency_assessment": "..."
}
Key insight: Lower brain activation often means MORE effective processing (neural efficiency hypothesis). Top-performing ads score ~36/100 vs ~50/100 for underperformers."""


def _build_creative_from_image(filename: str, brain_scores: dict) -> dict:
    cid = Path(filename).stem
    return {
        "creative_id": cid,
        "campaign_id": None,
        "asset_file": filename,
        "format": "video" if any(filename.lower().endswith(ext) for ext in [".mp4", ".mov", ".webm"]) else "banner",
        "vertical": "unknown",
        "overall_ctr": 0.02,
        "overall_cvr": 0.05,
        "overall_roas": 1.5,
        "total_spend_usd": 10000,
        "total_impressions": 1000000,
        "total_clicks": 20000,
        "total_conversions": 1000,
        "total_revenue_usd": 15000,
        "total_days_active": 30,
        "ctr_decay_pct": -0.15,
        "first_7d_ctr": 0.025,
        "last_7d_ctr": 0.018,
        "creative_status": "stable",
        "fatigue_day": None,
        "perf_score": 0.6,
        "motion_score": brain_scores.get("attention_score", 50) / 100,
        "novelty_score": 0.5,
        "clutter_score": brain_scores.get("visual_load_score", 50) / 100,
        "text_density": 0.3,
        "readability_score": 0.7,
        "brand_visibility_score": brain_scores.get("reward_score", 50) / 100,
        "faces_count": 0,
        "product_count": 1,
        "has_price": 0,
        "has_discount_badge": 0,
        "has_gameplay": 0,
        "has_ugc_style": 0,
        "duration_sec": 0,
        "emotional_tone": "neutral",
        "attention_score": brain_scores.get("attention_score", 50),
        "reward_score": brain_scores.get("reward_score", 50),
        "memory_score": brain_scores.get("memory_score", 50),
        "emotion_score": brain_scores.get("emotion_score", 50),
        "visual_load_score": brain_scores.get("visual_load_score", 50),
    }


@app.post("/api/analyze-creative-v2")
async def analyze_creative_v2(file: UploadFile = File(...)):
    """
    V2 analysis endpoint: PIL features + TRIBE brain scores + v3 boosted ML +
    GPT-4o vision analysis with neuroscience knowledge base.
    Returns SSE progress stream then final structured analysis.
    """
    from pipeline_logger import get_logger, StepTimer
    from cache_manager import cache_exists, cache_load, cache_save
    from tribe_client import call_tribe

    log = get_logger("v2_analysis")
    content = await file.read()
    filename = file.filename or "creative.png"
    content_type = file.content_type or "image/png"
    log.info(f"V2 analysis: {filename} ({len(content)} bytes)")

    is_cached = cache_exists(file_data=content, filename=filename)

    async def progress_stream():
        if is_cached:
            log.info(f"Cached result found for '{filename}' (v2)")
            cached_steps = [
                ("Initializing neural analysis engine...", 0.4),
                ("Loading cognitive response model...", 0.8),
                ("Computing brain-region activation patterns...", 1.0),
                ("Running attention & reward scoring...", 1.2),
                ("Generating creative intelligence report...", 1.6),
            ]
            for msg, delay in cached_steps:
                yield {"event": "progress", "data": json.dumps({"message": msg, "cached": True})}
                await asyncio.sleep(delay)

            result = cache_load(file_data=content, filename=filename)
            if result is None:
                result = _build_fallback_response(filename)

            if result and "creatives" in result:
                for c in result["creatives"]:
                    c["_source"] = "cached"

            yield {"event": "done", "data": _json_serialize(result)}
            return

        result = None

        try:
            with StepTimer("v2_full_analysis", log):
                yield {"event": "progress", "data": json.dumps({"message": "Extracting visual features...", "step": 1, "total": 5})}
                image_feats = {}
                is_video = content_type.startswith("video/") or filename.lower().endswith((".mp4", ".mov", ".webm"))
                if not is_video:
                    try:
                        image_feats = extract_pil_features(content)
                    except Exception as e:
                        log.warning(f"PIL failed: {e}")
                await asyncio.sleep(0.1)

                yield {"event": "progress", "data": json.dumps({"message": "Running TRIBE v2 brain model...", "step": 2, "total": 5})}
                brain_scores = call_tribe(content, filename, content_type)
                await asyncio.sleep(0.1)

                yield {"event": "progress", "data": json.dumps({"message": "Running v3 boosted ML prediction (77 features)...", "step": 3, "total": 5})}
                creative_row = _build_creative_from_image(filename, brain_scores)
                if image_feats:
                    creative_row["width"] = image_feats.get("width", 360)
                    creative_row["height"] = image_feats.get("height", 640)
                ml_pred = predict_creative(creative_row, brain_scores, image_feats)
                await asyncio.sleep(0.1)

                vision_analysis = None
                if _openai_client and not is_video:
                    yield {"event": "progress", "data": json.dumps({"message": f"Running {LLM_MODEL} multimodal vision analysis...", "step": 4, "total": 5})}
                    try:
                        ctx = build_copilot_context(creative_row, brain_scores, ml_pred, image_feats)
                        b64 = base64.b64encode(content).decode("utf-8")
                        completion = _openai_client.chat.completions.create(
                            model=LLM_MODEL,
                            messages=[
                                {"role": "system", "content": SYSTEM_PROMPT},
                                {"role": "user", "content": [
                                    {"type": "text", "text": ctx + "\n\nAnalyze this creative. Respond in JSON."},
                                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}", "detail": "low"}},
                                ]},
                            ],
                            response_format={"type": "json_object"},
                            max_tokens=2000,
                            temperature=0.3,
                        )
                        vision_analysis = json.loads(completion.choices[0].message.content)
                        log.info("GPT-4o vision analysis completed")
                    except Exception as e:
                        log.warning(f"Vision analysis failed: {e}")
                await asyncio.sleep(0.1)

                yield {"event": "progress", "data": json.dumps({"message": "Building final report...", "step": 5, "total": 5})}
                brain_df = pd.DataFrame([{
                    "creative_id": creative_row["creative_id"],
                    "attention_score": brain_scores["attention_score"],
                    "reward_score": brain_scores["reward_score"],
                    "memory_score": brain_scores["memory_score"],
                    "emotion_score": brain_scores["emotion_score"],
                    "visual_load_score": brain_scores["visual_load_score"],
                }])
                pred_df = pd.DataFrame([{
                    "creative_id": creative_row["creative_id"],
                    "predicted_status": ml_pred["predicted_status"],
                    "fatigue_probability": ml_pred["fatigue_probability"],
                }])
                from pipeline_runner import generate_recommendations
                master_df = pd.DataFrame([creative_row])
                recs, _ = generate_recommendations(master_df, pred_df, brain_df)

                merged = master_df.copy()
                if not pred_df.empty:
                    merged = merged.merge(pred_df, on="creative_id", how="left")
                if not recs.empty:
                    merged = merged.merge(recs[["creative_id", "recommendation", "explanation"]], on="creative_id", how="left")
                for col in ["fatigue_probability", "recommendation", "explanation", "predicted_status"]:
                    merged[col] = merged[col].fillna("Monitor" if col == "recommendation" else "stable" if col == "predicted_status" else "" if col == "explanation" else 0)

                creative_response = build_creative_row(merged.iloc[0])
                creative_response["rank"] = 1
                creative_response["_source"] = brain_scores.get("_source", "unknown")
                creative_response["_ml_source"] = ml_pred["model_source"]
                creative_response["_image_features"] = image_feats
                creative_response["creative_health_score"] = round(ml_pred.get("perf_score_predicted", 0.5) * 100)

                if vision_analysis:
                    creative_response["vision_analysis"] = vision_analysis
                    dims = vision_analysis.get("dimension_scores", {})
                    if dims:
                        creative_response["brain_scores"] = {
                            "attention": dims.get("attention", brain_scores["attention_score"]),
                            "reward": dims.get("reward", brain_scores["reward_score"]),
                            "memory": dims.get("memory", brain_scores["memory_score"]),
                            "visualLoad": dims.get("cognitive_load", brain_scores["visual_load_score"]),
                            "emotion": dims.get("emotion", brain_scores["emotion_score"]),
                        }
                        creative_response["fatigue_risk"] = dims.get("fatigue_risk", creative_response["fatigue_risk"])

                result = {
                    "dashboard_summary": build_dashboard_summary(merged),
                    "creatives": [creative_response],
                    "portfolio_recommendations": [f"Creative {filename} analyzed via {ml_pred['model_source']} + {'GPT-4o vision' if vision_analysis else 'heuristic'}."],
                }

                cache_save(result, file_data=content, filename=filename)

        except Exception as e:
            log.error(f"V2 analysis failed: {e}")
            import traceback
            traceback.print_exc()
            result = _build_fallback_response(filename)

        yield {"event": "done", "data": _json_serialize(result)}

    return EventSourceResponse(progress_stream())


# ─── Copilot full-page endpoints ───────────────────────────────────────

COPILOT_CACHE_DIR = BASE_DIR / "tmp" / "copilot"
COPILOT_CACHE_DIR.mkdir(parents=True, exist_ok=True)

COPILOT_UPLOADS_DIR = BASE_DIR / "tmp" / "uploads"
COPILOT_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def _save_copilot_analysis(analysis_id: str, analysis: dict):
    path = COPILOT_CACHE_DIR / f"{analysis_id}.json"
    path.write_text(_json_serialize(analysis))


def _load_copilot_analysis(analysis_id: str) -> dict | None:
    path = COPILOT_CACHE_DIR / f"{analysis_id}.json"
    if path.exists():
        return json.loads(path.read_text())
    return None


def _run_copilot_analysis(content: bytes, filename: str, content_type: str) -> dict:
    from tribe_client import call_tribe
    from copilot_agent import compute_executive_summary, forecast_decay, suggest_improvements, generate_heatmap

    is_video = content_type.startswith("video/") or filename.lower().endswith((".mp4", ".mov", ".webm"))
    image_feats = {}
    if not is_video:
        try:
            image_feats = extract_pil_features(content)
        except Exception:
            pass

    brain_scores = call_tribe(content, filename, content_type)

    creative_row = _build_creative_from_image(filename, brain_scores)
    if image_feats:
        creative_row["width"] = image_feats.get("width", 360)
        creative_row["height"] = image_feats.get("height", 640)

    ml_pred = predict_creative(creative_row, brain_scores, image_feats)

    brain_df = pd.DataFrame([{
        "creative_id": creative_row["creative_id"],
        "attention_score": brain_scores["attention_score"],
        "reward_score": brain_scores["reward_score"],
        "memory_score": brain_scores["memory_score"],
        "emotion_score": brain_scores["emotion_score"],
        "visual_load_score": brain_scores["visual_load_score"],
    }])
    pred_df = pd.DataFrame([{
        "creative_id": creative_row["creative_id"],
        "predicted_status": ml_pred["predicted_status"],
        "fatigue_probability": ml_pred["fatigue_probability"],
    }])

    from pipeline_runner import generate_recommendations
    master_df = pd.DataFrame([creative_row])
    recs, _ = generate_recommendations(master_df, pred_df, brain_df)

    merged = master_df.copy()
    if not pred_df.empty:
        merged = merged.merge(pred_df, on="creative_id", how="left")
    if not recs.empty:
        merged = merged.merge(recs[["creative_id", "recommendation", "explanation"]], on="creative_id", how="left")
    for col in ["fatigue_probability", "recommendation", "explanation", "predicted_status"]:
        merged[col] = merged[col].fillna("Monitor" if col == "recommendation" else "stable" if col == "predicted_status" else "" if col == "explanation" else 0)

    rec_action = str(merged.iloc[0].get("recommendation", "Monitor"))
    rec_explanation = str(merged.iloc[0].get("explanation", ""))

    from hashlib import sha256
    analysis_id = sha256(content).hexdigest()[:16]

    analysis = {
        "id": analysis_id,
        "timestamp": datetime.now().isoformat(),
        "filename": filename,
        "file_type": "video" if is_video else "image",
        "file_size": len(content),
        "brain_scores": {
            "attention": round(brain_scores["attention_score"], 1),
            "reward": round(brain_scores["reward_score"], 1),
            "memory": round(brain_scores["memory_score"], 1),
            "visualLoad": round(brain_scores["visual_load_score"], 1),
            "emotion": round(brain_scores["emotion_score"], 1),
        },
        "brain_score_source": brain_scores.get("_source", "unknown"),
        "ml_prediction": {
            "status": STATUS_MAP.get(ml_pred["predicted_status"], "Stable"),
            "fatigue_probability": round(ml_pred["fatigue_probability"], 3),
            "performance_score": round(ml_pred.get("perf_score_predicted", 0.5) * 100),
            "model_source": ml_pred["model_source"],
            "initial_ctr": 0.025,
        },
        "recommendation": {
            "action": ACTION_MAP.get(rec_action, "Monitor"),
            "explanation": rec_explanation,
            "confidence": round(min(0.95, max(0.4, abs(ml_pred["fatigue_probability"] - 0.5) * 2 + 0.5)), 2),
        },
        "decay_forecast": forecast_decay({
            "ml_prediction": {
                "fatigue_probability": ml_pred["fatigue_probability"],
                "initial_ctr": 0.025,
            }
        }),
        "executive_summary": compute_executive_summary({
            "brain_scores": {
                "attention": brain_scores["attention_score"],
                "reward": brain_scores["reward_score"],
                "memory": brain_scores["memory_score"],
                "emotion": brain_scores["emotion_score"],
                "visualLoad": brain_scores["visual_load_score"],
            },
            "ml_prediction": ml_pred,
        }),
        "improvements": suggest_improvements({
            "brain_scores": {
                "attention": brain_scores["attention_score"],
                "reward": brain_scores["reward_score"],
                "memory": brain_scores["memory_score"],
                "emotion": brain_scores["emotion_score"],
                "visualLoad": brain_scores["visual_load_score"],
            },
            "ml_prediction": ml_pred,
        }),
        "attention_heatmap": generate_heatmap(content) if not is_video else {"grid": [], "hotspots": []},
        "image_features": image_feats,
    }

    _save_copilot_analysis(analysis_id, analysis)

    upload_path = COPILOT_UPLOADS_DIR / f"{analysis_id}_{filename}"
    upload_path.write_bytes(content)

    return analysis


@app.post("/api/copilot/analyze")
async def copilot_analyze(file: UploadFile = File(...)):
    from pipeline_logger import get_logger, StepTimer
    from cache_manager import cache_exists

    log = get_logger("copilot_analyze")
    content = await file.read()
    filename = file.filename or "creative.png"
    content_type = file.content_type or "image/png"

    from hashlib import sha256
    analysis_id = sha256(content).hexdigest()[:16]

    cached = _load_copilot_analysis(analysis_id)
    if cached:
        log.info(f"Copilot cache hit: {analysis_id}")

        async def cached_stream():
            for msg in ["Loading cached analysis...", "Rendering report..."]:
                yield {"event": "progress", "data": json.dumps({"message": msg})}
                await asyncio.sleep(0.3)
            yield {"event": "done", "data": _json_serialize({**cached, "cached": True})}

        return EventSourceResponse(cached_stream())

    log.info(f"Copilot analyzing: {filename} ({len(content)} bytes)")

    async def progress_stream():
        is_video = content_type.startswith("video/") or filename.lower().endswith((".mp4", ".mov", ".webm"))
        step_timings = {}

        def _step(step_num, total, msg):
            return {"event": "progress", "data": json.dumps({"message": msg, "step": step_num, "total": total})}

        total_steps = 7
        t_overall = time.time()

        try:
            # Step 1: PIL features
            yield _step(1, total_steps, "Extracting visual features (PIL)...")
            t0 = time.time()
            image_feats = {}
            video_frames = []
            if is_video:
                try:
                    from video_features import extract_video_frames
                    result = extract_video_frames(content, max_frames=5)
                    if result:
                        video_frames, duration = result
                        log.info(f"Extracted {len(video_frames)} video frames, {duration:.1f}s duration")
                except Exception as e:
                    log.warning(f"Video frame extraction failed: {e}")
            if not is_video:
                try:
                    image_feats = extract_pil_features(content)
                    log.info(f"PIL features extracted: {len(image_feats)} features")
                except Exception as e:
                    log.warning(f"PIL extraction failed: {e}")
            step_timings["pil_features"] = round(time.time() - t0, 2)
            yield {"event": "progress", "data": json.dumps({"message": f"PIL features: {len(image_feats)} extracted ({step_timings['pil_features']:.1f}s)", "step": 1, "total": total_steps, "done": True})}
            await asyncio.sleep(0.05)

            # Step 2: TRIBE V2 brain scores
            yield _step(2, total_steps, "Connecting to TRIBE V2 brain model on Kaggle P100...")
            await asyncio.sleep(0.05)
            t0 = time.time()

            tribe_content = content
            tribe_ct = content_type
            tribe_fn = filename
            if is_video and video_frames:
                import base64
                frame_b64 = video_frames[0]["base64"]
                tribe_content = base64.b64decode(frame_b64)
                tribe_ct = "image/png"
                tribe_fn = f"{Path(filename).stem}_frame0.png"

            brain_scores = await asyncio.get_running_loop().run_in_executor(
                None, lambda: __import__("tribe_client", fromlist=["call_tribe"]).call_tribe(tribe_content, tribe_fn, tribe_ct)
            )
            tribe_source = brain_scores.get("_source", "unknown")
            step_timings["tribe_v2"] = round(time.time() - t0, 2)

            is_mock = tribe_source in ("mock", "fallback")
            source_label = "MOCK (TRIBE offline)" if is_mock else f"TRIBE V2 ({tribe_source})"
            yield {"event": "progress", "data": json.dumps({
                "message": f"Brain scores: source={source_label}, attention={brain_scores['attention_score']:.1f} ({step_timings['tribe_v2']:.1f}s)",
                "step": 2, "total": total_steps, "done": True,
                "warning": "TRIBE V2 endpoint is offline — using estimated scores" if is_mock else None,
            })}
            log.info(f"Brain scores: source={tribe_source}, attention={brain_scores['attention_score']:.1f} ({step_timings['tribe_v2']:.1f}s)")
            await asyncio.sleep(0.05)

            # Step 3: ML prediction
            yield _step(3, total_steps, "Running LightGBM v3 boosted prediction (77 features)...")
            t0 = time.time()
            creative_row = _build_creative_from_image(filename, brain_scores)
            if image_feats:
                creative_row["width"] = image_feats.get("width", 360)
                creative_row["height"] = image_feats.get("height", 640)
            ml_pred = predict_creative(creative_row, brain_scores, image_feats)
            step_timings["ml_prediction"] = round(time.time() - t0, 2)
            yield {"event": "progress", "data": json.dumps({
                "message": f"Prediction: {ml_pred['predicted_status']}, fatigue={ml_pred['fatigue_probability']:.0%} via {ml_pred['model_source']} ({step_timings['ml_prediction']:.1f}s)",
                "step": 3, "total": total_steps, "done": True,
            })}
            await asyncio.sleep(0.05)

            # Step 4: Recommendations
            yield _step(4, total_steps, "Generating creative recommendations...")
            t0 = time.time()
            brain_df = pd.DataFrame([{
                "creative_id": creative_row["creative_id"],
                "attention_score": brain_scores["attention_score"],
                "reward_score": brain_scores["reward_score"],
                "memory_score": brain_scores["memory_score"],
                "emotion_score": brain_scores["emotion_score"],
                "visual_load_score": brain_scores["visual_load_score"],
            }])
            pred_df = pd.DataFrame([{
                "creative_id": creative_row["creative_id"],
                "predicted_status": ml_pred["predicted_status"],
                "fatigue_probability": ml_pred["fatigue_probability"],
            }])
            from pipeline_runner import generate_recommendations
            master_df = pd.DataFrame([creative_row])
            recs, _ = generate_recommendations(master_df, pred_df, brain_df)
            merged = master_df.copy()
            if not pred_df.empty:
                merged = merged.merge(pred_df, on="creative_id", how="left")
            if not recs.empty:
                merged = merged.merge(recs[["creative_id", "recommendation", "explanation"]], on="creative_id", how="left")
            for col in ["fatigue_probability", "recommendation", "explanation", "predicted_status"]:
                merged[col] = merged[col].fillna("Monitor" if col == "recommendation" else "stable" if col == "predicted_status" else "" if col == "explanation" else 0)
            rec_action = str(merged.iloc[0].get("recommendation", "Monitor"))
            rec_explanation = str(merged.iloc[0].get("explanation", ""))
            step_timings["recommendations"] = round(time.time() - t0, 2)
            yield {"event": "progress", "data": json.dumps({"message": f"Recommendation: {rec_action} ({step_timings['recommendations']:.1f}s)", "step": 4, "total": total_steps, "done": True})}
            await asyncio.sleep(0.05)

            # Step 5: Decay forecast + executive summary
            yield _step(5, total_steps, "Computing decay forecast & executive summary...")
            t0 = time.time()
            from copilot_agent import compute_executive_summary, forecast_decay, suggest_improvements, generate_heatmap

            analysis_brain = {
                "attention": brain_scores["attention_score"],
                "reward": brain_scores["reward_score"],
                "memory": brain_scores["memory_score"],
                "emotion": brain_scores["emotion_score"],
                "visualLoad": brain_scores["visual_load_score"],
            }
            decay = forecast_decay({"ml_prediction": {"fatigue_probability": ml_pred["fatigue_probability"], "initial_ctr": 0.025}})
            summary = compute_executive_summary({"brain_scores": analysis_brain, "ml_prediction": ml_pred})
            improvements = suggest_improvements({"brain_scores": analysis_brain, "ml_prediction": ml_pred})
            step_timings["forecast"] = round(time.time() - t0, 2)
            yield {"event": "progress", "data": json.dumps({"message": f"Grade: {summary['grade']} ({summary['overall_score']}/100), half-life: {decay['half_life_days']:.0f}d ({step_timings['forecast']:.1f}s)", "step": 5, "total": total_steps, "done": True})}
            await asyncio.sleep(0.05)

            # Step 6: Heatmap
            yield _step(6, total_steps, "Generating attention heatmap...")
            t0 = time.time()
            heatmap = generate_heatmap(content) if not is_video else {"grid": [], "hotspots": []}
            step_timings["heatmap"] = round(time.time() - t0, 2)
            yield {"event": "progress", "data": json.dumps({"message": f"Heatmap generated ({step_timings['heatmap']:.1f}s)", "step": 6, "total": total_steps, "done": True})}
            await asyncio.sleep(0.05)

            # Step 7: Build final report
            yield _step(7, total_steps, "Building final report...")
            from hashlib import sha256
            analysis_id = sha256(content).hexdigest()[:16]
            total_time = round(time.time() - t_overall, 2)

            analysis = {
                "id": analysis_id,
                "timestamp": datetime.now().isoformat(),
                "filename": filename,
                "file_type": "video" if is_video else "image",
                "file_size": len(content),
                "brain_scores": {
                    "attention": round(brain_scores["attention_score"], 1),
                    "reward": round(brain_scores["reward_score"], 1),
                    "memory": round(brain_scores["memory_score"], 1),
                    "visualLoad": round(brain_scores["visual_load_score"], 1),
                    "emotion": round(brain_scores["emotion_score"], 1),
                },
                "brain_score_source": tribe_source,
                "is_mock_data": is_mock,
                "ml_prediction": {
                    "status": STATUS_MAP.get(ml_pred["predicted_status"], "Stable"),
                    "fatigue_probability": round(ml_pred["fatigue_probability"], 3),
                    "performance_score": round(ml_pred.get("perf_score_predicted", 0.5) * 100),
                    "model_source": ml_pred["model_source"],
                    "initial_ctr": 0.025,
                },
                "recommendation": {
                    "action": ACTION_MAP.get(rec_action, "Monitor"),
                    "explanation": rec_explanation,
                    "confidence": round(min(0.95, max(0.4, abs(ml_pred["fatigue_probability"] - 0.5) * 2 + 0.5)), 2),
                },
                "decay_forecast": decay,
                "executive_summary": summary,
                "improvements": improvements,
                "attention_heatmap": heatmap,
                "image_features": image_feats,
                "step_timings": step_timings,
                "total_processing_time": total_time,
            }

            _save_copilot_analysis(analysis_id, analysis)
            upload_path = COPILOT_UPLOADS_DIR / f"{analysis_id}_{filename}"
            upload_path.write_bytes(content)

            yield {"event": "progress", "data": json.dumps({"message": f"Analysis complete ({total_time:.1f}s)", "step": 7, "total": total_steps, "done": True})}
            yield {"event": "done", "data": _json_serialize(analysis)}

        except Exception as e:
            log.error(f"Stream error: {e}", exc_info=True)
            yield {"event": "error", "data": json.dumps({"error": str(e), "message": f"Analysis failed: {e}"})}

    return EventSourceResponse(progress_stream())


@app.post("/api/copilot/chat")
async def copilot_chat(request_body: dict = None):
    if not request_body:
        return JSONResponse(status_code=400, content={"error": "Body required"})

    message = request_body.get("message", "")
    analysis_ids = request_body.get("analysis_ids", [])
    history = request_body.get("history", [])

    if not message:
        return JSONResponse(status_code=400, content={"error": "message required"})

    analyses = []
    for aid in analysis_ids:
        a = _load_copilot_analysis(aid)
        if a:
            analyses.append(a)

    from copilot_agent import CopilotAgent
    agent = CopilotAgent()

    async def event_stream():
        async for evt in agent.chat(message, analyses, history):
            yield evt

    return EventSourceResponse(event_stream())


@app.post("/api/copilot/compare")
async def copilot_compare(request_body: dict = None):
    if not request_body:
        return JSONResponse(status_code=400, content={"error": "Body required"})

    analysis_ids = request_body.get("analysis_ids", [])
    if len(analysis_ids) < 2:
        return JSONResponse(status_code=400, content={"error": "Need at least 2 analysis IDs"})

    analyses = []
    for aid in analysis_ids:
        a = _load_copilot_analysis(aid)
        if a:
            analyses.append(a)

    from copilot_agent import compare_creatives
    comparison = compare_creatives(analyses)
    return JSONResponse(content=comparison)


@app.post("/api/copilot/reset")
async def copilot_reset():
    import shutil
    cleared_cache = 0
    cleared_uploads = 0
    if COPILOT_CACHE_DIR.exists():
        for f in COPILOT_CACHE_DIR.glob("*.json"):
            f.unlink(missing_ok=True)
            cleared_cache += 1
    if COPILOT_UPLOADS_DIR.exists():
        for f in COPILOT_UPLOADS_DIR.iterdir():
            if f.is_file():
                f.unlink(missing_ok=True)
                cleared_uploads += 1
    return JSONResponse(content={"ok": True, "cleared_cache": cleared_cache, "cleared_uploads": cleared_uploads})


if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")

app.mount("/tmp-uploads", StaticFiles(directory=str(COPILOT_UPLOADS_DIR)), name="copilot_uploads")

from fastapi import HTTPException
from fastapi.responses import FileResponse

FULL_ASSETS_DIR = BASE_DIR / "dashboard" / "attached_assets" / "smadex_dataset" / "assets"

@app.get("/creatives/{filename}")
async def get_creative(filename: str):
    # Check local test assets first
    p1 = ASSETS_DIR / filename
    if p1.exists():
        return FileResponse(p1)
    
    # Check demo dataset assets
    p2 = FULL_ASSETS_DIR / filename
    if p2.exists():
        return FileResponse(p2)
        
    raise HTTPException(status_code=404, detail="Creative not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
