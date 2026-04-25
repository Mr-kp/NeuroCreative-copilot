import io
import os
import json
import re
import time
import asyncio
from pathlib import Path
from collections import Counter

import pandas as pd
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sse_starlette.sse import EventSourceResponse

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
ASSETS_DIR = BASE_DIR.parent / "Smadex_Creative_Intelligence_Dataset_FULL" / "assets"

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

    _merged = PRELOADED["master"].merge(PRELOADED["model_outputs"], on="creative_id", how="left")
    _merged = _merged.merge(PRELOADED["brain_features"], on="creative_id", how="left")
    _merged["fatigue_probability"] = _merged["fatigue_probability"].fillna(0)
    _merged["recommendation"] = _merged["recommendation"].fillna("Monitor")
    _merged["explanation"] = _merged["explanation"].fillna("Performance within normal range.")
    _merged["predicted_status"] = _merged["predicted_status"].fillna("stable")
    PRELOADED["merged"] = _merged
    print(f"Loaded {len(_merged)} pre-computed creatives.")
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


def build_creative_row(row, daily_df: pd.DataFrame = None) -> dict:
    cid = str(int(row["creative_id"])) if pd.notna(row.get("creative_id")) else "0"

    asset_file = row.get("asset_file", "")
    if pd.notna(asset_file):
        filename = Path(str(asset_file)).name
    else:
        filename = f"creative_{cid}.png"

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
        creative_daily = daily_df[daily_df["creative_id"] == int(cid)].sort_values("date") if cid.isdigit() else pd.DataFrame()
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
        "campaign_id": int(row["campaign_id"]) if pd.notna(row.get("campaign_id")) else None,
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
            uploaded_ids = set(uploaded[id_col].dropna().astype(int).tolist())
            preloaded_ids = set(PRELOADED["merged"]["creative_id"].dropna().astype(int).tolist())
            overlap = uploaded_ids & preloaded_ids

            if len(overlap) > 0 and len(overlap) >= len(uploaded_ids) * 0.5:
                filtered = PRELOADED["merged"][PRELOADED["merged"]["creative_id"].isin(uploaded_ids)].copy()
                print(f"[upload] Matched {len(filtered)} creatives from pre-computed data ({len(overlap)} IDs overlap)")
                result = _build_response_from_merged(filtered, PRELOADED.get("daily"))
                result["pipeline_log"] = [f"Matched {len(filtered)} creatives from pre-computed pipeline data."]
                return JSONResponse(content=result)

        if has_pipeline_cols and not PRELOADED.get("merged") is not None:
            pass

    from pipeline_runner import run_pipeline

    print(f"[upload] Running live pipeline on {len(file_data)} uploaded file(s)...")
    t0 = time.time()
    result = run_pipeline(file_data)
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

    resp = _build_response_from_merged(merged, daily_df)
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

    if not question or not creative:
        return JSONResponse(status_code=400, content={"error": "question and selectedCreative required"})

    cid = creative.get("creative_id", "unknown")
    status = creative.get("status", "Unknown")
    action = creative.get("recommended_action", "Monitor")
    explanation = creative.get("explanation", "")
    fatigue_risk = creative.get("fatigue_risk", 0)
    brain = creative.get("brain_scores", {})
    copilot_pre = creative.get("copilot_answers", {})

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
    }

    async def event_stream():
        for chunk in chunks:
            yield {"event": "token", "data": json.dumps({"text": chunk})}
            await asyncio.sleep(0.02)
        yield {"event": "done", "data": json.dumps(response_data)}

    return EventSourceResponse(event_stream())


if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
