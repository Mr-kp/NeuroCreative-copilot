# NeuroCreative Copilot

**AI-powered creative intelligence for mobile advertisers.**

NeuroCreative Copilot analyzes ad creatives through a brain-inspired cognitive lens and tells marketers whether to **Scale, Monitor, Pivot, or Pause** each creative — backed by ML fatigue prediction, CTR decay modeling, and neuro-inspired attention/reward/memory scoring.

Built for the **Smadex Creative Intelligence Challenge** at HackUPC 2026.

---

## Quick Start

```bash
# 1. Install Python dependencies
pip install fastapi uvicorn python-multipart sse-starlette pandas numpy scipy scikit-learn lightgbm

# 2. Start backend (port 8000)
python api_server.py

# 3. Start frontend (port 5173)
cd dashboard/artifacts/neurocreative
npm install
npm run dev:frontend
```

Open **http://localhost:5173**. Upload your Smadex CSV files to run the full analysis pipeline live.

---

## What It Does

1. **Upload** raw Smadex CSV files (creative_summary, creatives, campaigns, advertisers, daily_stats)
2. **Pipeline runs live**: joins tables, extracts brain features, fits decay curves, trains ML model, generates recommendations
3. **Dashboard** shows 1080 creatives with KPIs, brain scores, MRI visualization, fatigue risk, and action recommendations
4. **Copilot** answers questions about any creative via streaming AI chat

### Upload Modes

| What you upload | What happens |
|-----------------|-------------|
| All 5 Smadex CSVs | Full live pipeline: decay curves + ML predictions + brain features + recommendations |
| Just creative_summary.csv | Pipeline with heuristic decay, ML predictions from available columns |
| Single CSV with creative_ids | Fast match against pre-computed pipeline data |

---

## Architecture

```
  Smadex CSVs (uploaded)          Python Backend                React Dashboard
  ┌──────────────────┐     ┌────────────────────────┐     ┌──────────────────┐
  │ creative_summary  │     │                        │     │                  │
  │ creatives         │────>│ pipeline_runner.py     │────>│  KPI cards       │
  │ campaigns         │     │  detect → join → brain │     │  Creative gallery │
  │ advertisers       │     │  → decay → ML → recs   │     │  Brain scores     │
  │ daily_stats       │     │                        │     │  MRI heatmap      │
  └──────────────────┘     │ api_server.py           │     │  Copilot chat     │
                           │  FastAPI + SSE streaming │     │                  │
  User asks question ─────>│ POST /api/ask-copilot   │────>│  Streaming answer │
                           └────────────────────────┘     └──────────────────┘
```

### Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Python, FastAPI, SSE-Starlette, pandas, numpy, scipy, scikit-learn, LightGBM |
| Frontend | React 19, Vite 6, TypeScript 5.9, Tailwind CSS 4, shadcn/ui, Recharts |
| ML | LightGBM (fatigue classifier + regressor), scipy (decay curve fitting) |
| Brain Scoring | Custom neuro-inspired model: attention, reward, memory, emotion, visual_load |
| Streaming | Server-Sent Events (SSE) for real-time copilot responses |

---

## Project Structure

```
NeuroCreative-copilot/
  api_server.py              FastAPI backend — upload endpoint, copilot SSE, asset serving
  pipeline_runner.py         Live pipeline — detect tables, run analysis, generate outputs
  data/                      Pre-computed pipeline outputs (fallback data)
  pipeline/
    creative_intelligence/   Original 7-step pipeline scripts (offline, re-runnable)
    time_decay/              Alternative XGBoost AFT survival pipeline
    backend_api.py           Standalone TRIBE v2 live inference server (GPU/Colab)
  dashboard/
    artifacts/neurocreative/ React/Vite frontend dashboard
  INTEGRATION.md             Full architecture documentation
  CHANGELOG.md               Detailed change history
```

---

## Pipeline Details

The live pipeline (`pipeline_runner.py`) runs these steps on every upload:

| Step | Function | Hard Dependency | Fallback |
|------|----------|----------------|----------|
| 1. Detect tables | `detect_tables()` | pandas + numpy | — |
| 2. Build master | `build_master_table()` | pandas | Uses whatever tables available |
| 3. Daily fatigue | `build_daily_table()` | pandas | Skips if no daily stats |
| 4. Brain features | `compute_brain_features()` | pandas + numpy | Uses available columns only |
| 5. Decay curves | `compute_decay_features()` | **scipy** | Linear decay heuristic |
| 6. ML predictions | `compute_predictions_ml()` | **lightgbm** | Rule-based heuristics |
| 7. Recommendations | `generate_recommendations()` | pandas | Always works |

### Brain Feature Formulas

Computed from visual metadata (no GPU needed):

- **Attention** = 0.40 x motion + 0.30 x novelty + 0.20 x clutter + 0.10 x has_duration
- **Reward** = 0.30 x brand_visibility + 0.25 x has_discount + 0.25 x has_price + 0.20 x product_count
- **Memory** = 0.35 x readability + 0.25 x (1 - text_density) + 0.25 x brand_visibility + 0.15 x novelty
- **Emotion** = 0.40 x tone_encoding + 0.30 x faces + 0.20 x ugc_style + 0.10 x motion
- **Visual Load** = 0.35 x clutter + 0.35 x text_density + 0.20 x product_count + 0.10 x motion

---

## API Endpoints

### `POST /api/analyze-creatives-upload`
- **Input**: Multipart form with `files` (one or more CSVs)
- **Output**: `DashboardResponse` JSON with creatives, KPIs, brain scores, recommendations
- **Logic**: Auto-detects table types, runs live pipeline, returns results

### `POST /api/ask-copilot`
- **Input**: JSON `{ question, selectedCreative, dashboardContext }`
- **Output**: SSE stream — token events + final structured response
- **Logic**: Context-aware answers from pipeline data

### `GET /assets/{filename}`
- Serves creative PNG images

---

## Branches

| Branch | Content |
|--------|---------|
| `main` | Base: README + TRIBE v2 notebook |
| `EDA` | 4 Jupyter notebooks, master table, daily fatigue, insights |
| `WEB` | React dashboard (standalone, pre-integration) |
| `integration` | **Current**: Full stack with live pipeline, API, streaming copilot |

---

## License

Hackathon project — Smadex Creative Intelligence Challenge, HackUPC 2026.
