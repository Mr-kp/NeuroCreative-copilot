# NeuroCreative Copilot - Architecture & Integration Guide

## What This Project Is

NeuroCreative Copilot is a hackathon project for the **Smadex Creative Intelligence Challenge** at HackUPC 2026. It builds a marketer-facing dashboard that tells advertisers whether their mobile ad creatives should be **scaled, monitored, pivoted, or paused** — backed by brain-inspired cognitive scoring and ML fatigue prediction.

---

## Repository Branches

| Branch | Content |
|--------|---------|
| `main` | Base project: README + TRIBE v2 Colab notebook |
| `EDA` | Exploratory data analysis: 4 Jupyter notebooks, master_creatives.csv, daily_fatigue_table.csv, insights |
| `WEB` | React/Vite dashboard with shadcn/ui, Express server scaffold, embedded dataset |
| `integration` (current) | Full stack: React frontend + Python FastAPI backend + live pipeline + SSE streaming copilot |

---

## Project Structure

```
NeuroCreative-copilot/
  api_server.py              # FastAPI backend — upload, copilot SSE, asset serving
  pipeline_runner.py         # Live pipeline — detect, join, brain, decay, ML, recommend
  CHANGELOG.md               # Detailed change history
  INTEGRATION.md             # This file
  README.md                  # Project overview and quick start
  .gitignore
  data/                      # Pre-computed pipeline outputs (fallback data)
    master_creatives.csv     # 1080 creatives with full metadata + KPIs
    model_outputs.csv        # predicted_status, fatigue_probability, recommendation, explanation
    brain_features.csv       # attention, reward, memory, emotion, visual_load scores
    daily_fatigue_table.csv  # 52350 daily rows with CTR/CVR/ROAS time series
  pipeline/                  # All backend scripts (offline, re-runnable)
    creative_intelligence/   # Original 7-step pipeline scripts
      data_pipeline.py       # Step 1: join Smadex CSVs into master table
      brain_features.py      # Step 2: compute brain-inspired scores
      decay_analysis.py      # Step 3: fit CTR decay curves (scipy + Prophet)
      survival_analysis.py   # Step 4: Kaplan-Meier + Cox PH modeling
      ml_models.py           # Step 5: LightGBM + SHAP feature importance
      recommendation_engine.py # Step 6: final Scale/Monitor/Pivot/Pause
      integrate_tribe_v2.py  # Optional: enhance with TRIBE neural features
    time_decay/              # Alternative XGBoost AFT survival pipeline
      run_tribe_batch.py     # Batch TRIBE inference on creative assets
      build_survival_targets.py # Detect fatigue events from CTR
      fuse_features.py       # Build analytical base table
      train_aft_model.py     # XGBoost AFT survival model
      generate_copilot_feed.py # Final action tags for dashboard
      PIPELINE_DOCUMENTATION.md # Full docs for this pipeline
    backend_api.py           # Standalone TRIBE v2 live inference server (GPU/Colab)
  dashboard/
    artifacts/
      neurocreative/         # React/Vite frontend dashboard
        src/
          components/        # UI components (shadcn/ui based)
            UploadCampaignData.tsx  # Multi-file CSV upload with auto-detection
            CopilotSheet.tsx        # SSE streaming copilot chat
            BrainActivityMRI.tsx    # MRI-style heatmap visualization
          data/smadexData.ts # Demo data (fallback when no CSV uploaded)
          lib/apiClient.ts   # API client (multi-file upload + SSE streaming copilot)
          types/dashboard.ts # TypeScript interfaces
        server/              # Original Express server (replaced by api_server.py)
        vite.config.ts       # Proxy /api -> localhost:8000
    lib/
      api-spec/              # OpenAPI spec
      db/                    # Drizzle ORM schema (unused in current setup)
    scripts/
      smadex/build-data.mjs  # Generates smadexData.ts from CSVs
  tribe_demo_v8.ipynb        # TRIBE v2 Colab demo
```

---

## How The Stack Works

### Live Pipeline Mode (default)

When the user uploads raw Smadex CSV files, the backend runs the full pipeline live:

```
  User uploads CSVs              Python Backend                   React Frontend
  ┌──────────────────┐     ┌─────────────────────────┐     ┌──────────────────┐
  │ creative_summary  │     │                         │     │                  │
  │ creatives         │────>│ pipeline_runner.py      │     │ DashboardResponse │
  │ campaigns         │     │  1. detect_tables()     │     │ populates UI      │
  │ advertisers       │     │  2. build_master()      │────>│                  │
  │ daily_stats       │     │  3. build_daily()       │     │ KPI cards, brain  │
  └──────────────────┘     │  4. brain_features()    │     │ scores, gallery,  │
                           │  5. decay_features()    │     │ recommendations   │
                           │  6. predictions_ml()    │     │                  │
                           │  7. recommendations()   │     │                  │
                           │                         │     │                  │
                           │ api_server.py            │     │                  │
                           │  build_creative_row()   │     │                  │
                           │  build_dashboard_summary│     │                  │
                           └─────────────────────────┘     └──────────────────┘

  User asks copilot    ┌─────────────────────────┐
  ┌──────────────────┐ │ POST /api/ask-copilot   │     CopilotSheet
  │ "Why is this     │>│ Rule-based answers      │────> streams tokens
  │ ad fatigued?"    │ │ from pipeline data      │     live, word by word
  └──────────────────┘ └─────────────────────────┘
```

### Pre-computed Match Mode (fallback)

When the user uploads a single CSV with `creative_id` values that match the pre-loaded `data/*.csv` files:

```
  User uploads CSV       Backend                    Frontend
  with creative_ids
  ┌──────────────┐     ┌───────────────────┐     ┌──────────────┐
  │ creative_id  │────>│ Match against     │────>│ Pre-computed  │
  │ 500000       │     │ data/*.csv files  │     │ results shown │
  │ 500001       │     │ (loaded at start) │     │ instantly     │
  └──────────────┘     └───────────────────┘     └──────────────┘
```

### Demo Mode

When no CSV is uploaded, the frontend falls back to hardcoded demo data from `smadexData.ts`. The copilot uses a local rule-based answer generator (no API call needed).

---

## Live Pipeline (`pipeline_runner.py`)

The pipeline runs on every upload request when raw Smadex CSVs are detected. It is self-contained: only `pandas` and `numpy` are required; everything else has graceful fallbacks.

### Step-by-Step

| # | Function | Input | Output | Hard Dep | Fallback |
|---|----------|-------|--------|----------|----------|
| 1 | `detect_tables()` | Dict of {filename: DataFrame} | Dict of {table_name: DataFrame} | pandas | — |
| 2 | `build_master_table()` | Detected tables | master DataFrame (1 row/creative) | pandas | Uses whatever tables available |
| 3 | `build_daily_table()` | daily_stats table | Aggregated daily DataFrame | pandas | Empty DF if no daily stats |
| 4 | `compute_brain_features()` | master DataFrame | Brain scores per creative | pandas, numpy | Uses available columns only |
| 5 | `compute_decay_features()` | daily + master | Decay parameters per creative | **scipy** | Linear decay heuristic from master metrics |
| 6 | `compute_predictions_ml()` | master + decay | Status + fatigue probability | **lightgbm**, **sklearn** | Rule-based heuristic predictions |
| 7 | `generate_recommendations()` | master + predictions + brain | Scale/Monitor/Pivot/Pause + explanations | pandas | Always works |
| 8 | `run_pipeline()` | All uploaded files | Merged DataFrame + pipeline log | — | Orchestrates 1-7 |

### Table Detection

Tables are identified by filename first, then by column signature matching:

| Filename contains | Detected as |
|-------------------|-------------|
| `advertisers` | `advertisers` |
| `campaigns` | `campaigns` |
| `creatives` | `creatives` |
| `creative_summary` | `creative_summary` |
| `creative_daily_country_os_stats` | `daily_stats` |

If filename doesn't match, column sets are compared against known signatures (50%+ overlap required).

### Master Table Join Strategy

```
creative_summary (spine — one row per creative_id, has KPIs)
  <- creatives ON creative_id       (adds visual features + asset_file)
  <- campaigns ON campaign_id       (adds objective, theme, budget, dates)
  <- advertisers ON advertiser_id   (adds hq_region)
```

All joins are LEFT joins from the spine, so no creatives are lost.

### Brain Feature Formulas

When TRIBE v2 is not available (the default — it requires a GPU), brain scores are computed from visual metadata:

- **Attention** = 0.40 x motion_score + 0.30 x novelty_score + 0.20 x clutter_score + 0.10 x (duration_sec > 0)
- **Reward** = 0.30 x brand_visibility + 0.25 x has_discount + 0.25 x has_price + 0.20 x (product_count / max_product_count)
- **Memory** = 0.35 x readability + 0.25 x (1 - text_density) + 0.25 x brand_visibility + 0.15 x novelty
- **Emotion** = 0.40 x tone_numeric + 0.30 x (faces_count / max_faces) + 0.20 x has_ugc_style + 0.10 x motion_score
- **Visual Load** = 0.35 x clutter + 0.35 x text_density + 0.20 x (product_count / max) + 0.10 x motion_score

All scores are min-max normalized to 0-100 across all creatives. Missing columns default to zero contribution.

### Decay Analysis

For each creative with daily time-series data:

1. **scipy available**: Fits exponential decay `CTR(t) = a * exp(-lambda * t)` using `curve_fit`, extracts decay rate and half-life
2. **scipy unavailable**: Compares first-half vs second-half mean CTR as a simple linear decay rate
3. **No daily data**: Derives decay from master table's `ctr_decay_pct` column

### ML Predictions

When lightgbm + sklearn are available and `creative_status` labels exist:

1. **Status Classifier** (LightGBM, 4-class): top_performer, stable, fatigued, underperformer
2. **Fatigue Regressor** (LightGBM): Predicts continuous fatigue probability from CTR decay
3. Uses GroupShuffleSplit (by campaign_id) for campaign-aware train/test splitting

**Fallback (rule-based heuristic):**
```
fatigue_prob = 0.3 * min(1, ctr_decay * 2)
             + 0.3 * min(1, decay_lambda * 5)
             + 0.2 * max(0, 1 - roas/3)
             + 0.2 * max(0, 1 - ctr * 50)
```

### Recommendation Rules

Applied to each creative in order of priority:

| Condition | Recommendation |
|-----------|---------------|
| fatigue_prob > 0.7 AND ctr_decay < -70% | **Pivot Creative** |
| fatigue_prob > 0.5 AND ctr_decay < -50% | **Refresh Soon** |
| status = top_performer AND roas > 2.0 AND fatigue_prob < 0.3 | **Scale** |
| status = underperformer AND roas < 1.0 AND fatigue_prob > 0.4 | **Pause** |
| Otherwise | **Monitor** |

---

## API Endpoints

### `POST /api/analyze-creatives-upload`
- **Input**: Multipart form with `files[]` (one or more CSV files)
- **Output**: `DashboardResponse` JSON
- **Logic**:
  1. Parse all uploaded CSVs into DataFrames
  2. If single CSV with creative_ids matching pre-computed data -> fast match
  3. Otherwise -> run `pipeline_runner.run_pipeline()` on all uploaded tables
  4. Build `DashboardResponse` with `build_creative_row()` for each creative
- **Response includes**:
  - `dashboard_summary`: Aggregate KPIs (spend, impressions, CTR, CVR, ROAS, fatigued count)
  - `creatives[]`: Array of 1080 creative objects with all scores and recommendations
  - `portfolio_recommendations[]`: Top-level action items for the portfolio
  - `pipeline_log[]`: Step-by-step log of what the pipeline did (live mode only)

### `POST /api/ask-copilot`
- **Input**: JSON `{ question: string, selectedCreative: object, dashboardContext?: object }`
- **Output**: SSE stream
  - `event: token` events with `{ text: string }` chunks (3 words at a time)
  - `event: done` event with full `CopilotApiResponse` object including `llm_powered: bool`
- **AI Model Resolution** (in priority order):
  1. **OpenAI GPT-4o-mini**: Used when `OPENAI_API_KEY` is set in `.env`. Sends full creative context (status, metrics, brain scores, explanation) as system prompt.
  2. **Google Gemini 2.0 Flash**: Used when `GOOGLE_API_KEY` is set and no OpenAI key. Same prompt structure.
  3. **Rule-based**: Keyword matching (fatigue, scale, change, brain) against pre-computed copilot answers. Always available.
- **System prompt includes**: creative ID, status, recommended action, fatigue risk, CTR/CVR/ROAS, brain scores, explanation

### `GET /assets/{filename}`
- Serves PNG creative images from local `assets/` directory

### `GET /creatives/{filename}`
- Serves PNG creative images, checking local `assets/` first then embedded dataset `dashboard/attached_assets/smadex_dataset/assets/`

---

## Frontend Component Map

| Component | What it renders |
|-----------|----------------|
| `UploadCampaignData` | Multi-file CSV upload with drag-and-drop, auto-detection hints, file list |
| `KPICards` | Aggregate metrics: spend, impressions, CTR, CVR, ROAS, fatigued count |
| `FiltersBar` | Filter by vertical, format, status, advertiser, campaign, country, OS |
| `CreativeActionCenter` | Creative gallery grid with status badges |
| `SelectedCreativeDetail` | Full detail panel for selected creative |
| `PerformanceChart` | CTR/CVR trend chart with annotations (peak, fatigue onset) |
| `BrainIntelligencePanel` | Brain score gauges (attention, reward, memory, etc.) |
| `BrainActivityMRI` | MRI-style heatmap visualization |
| `CopilotSheet` | Slide-out chat panel with SSE streaming responses |

---

## Running The Project

### Prerequisites
- Python 3.11+ with pip
- Node.js 20+ with npm

### Full Setup (live pipeline + LLM copilot)

```bash
# Terminal 1: Backend
pip install fastapi uvicorn python-multipart sse-starlette pandas numpy scipy scikit-learn lightgbm python-dotenv openai
cp .env.example .env
# Edit .env and add OPENAI_API_KEY=sk-... (or GOOGLE_API_KEY=...)
python api_server.py            # http://localhost:8000

# Terminal 2: Frontend
cd dashboard/artifacts/neurocreative
npm install
npm run dev:frontend            # http://localhost:5173
```

Open `http://localhost:5173`. Upload Smadex CSV files to run the pipeline.

### Minimal Setup (pre-computed data only)

```bash
pip install fastapi uvicorn python-multipart sse-starlette pandas numpy
python api_server.py
```

Upload a single CSV with `creative_id` to match against pre-loaded data.

### Required CSV Files for Live Pipeline

| File | Rows | Required? | What it provides |
|------|------|-----------|-----------------|
| `creative_summary.csv` | 1080 | **Yes** (spine) | KPIs, performance metrics, creative_status |
| `creatives.csv` | 1080 | Recommended | Visual features, asset paths, metadata |
| `campaigns.csv` | 180 | Optional | Campaign objectives, budgets, targeting |
| `advertisers.csv` | 36 | Optional | Advertiser regions |
| `creative_daily_country_os_stats.csv` | 192315 | Optional | Time-series for decay curve fitting |

---

## Offline Pipeline Scripts (`pipeline/`)

These are the original standalone scripts used to pre-compute the `data/*.csv` files. They can be re-run independently if the team gets new data.

### Pipeline A: Creative Intelligence (`pipeline/creative_intelligence/`)

```bash
cd pipeline/creative_intelligence
mkdir -p data
cp ../../../Smadex_Creative_Intelligence_Dataset_FULL/*.csv data/

python data_pipeline.py          # master_creatives.csv
python brain_features.py         # brain_features.csv
python decay_analysis.py         # decay_features.csv (needs scipy, prophet)
python survival_analysis.py      # cox_hazard_ratios.csv (needs lifelines)
python ml_models.py              # ml_predictions.csv (needs lightgbm, shap)
python recommendation_engine.py  # model_outputs.csv

cp data/master_creatives.csv ../../data/
cp data/brain_features.csv ../../data/
cp data/model_outputs.csv ../../data/
```

### Pipeline B: Time Decay / AFT Survival (`pipeline/time_decay/`)

Alternative pipeline using XGBoost AFT models. See `pipeline/time_decay/PIPELINE_DOCUMENTATION.md` for full details. Requires TRIBE v2 on GPU (Colab).

### Pipeline Script Details

| Script | Input | Output | Key Libraries | What It Does |
|--------|-------|--------|---------------|--------------|
| `data_pipeline.py` | Smadex CSVs | `master_creatives.csv` | pandas, numpy | Joins advertisers, campaigns, creatives, creative_summary into one master table |
| `brain_features.py` | `master_creatives.csv` | `brain_features.csv` | pandas, numpy | Computes brain-inspired scores from visual metadata |
| `decay_analysis.py` | `daily_fatigue_table.csv`, `master_creatives.csv` | `decay_features.csv` | pandas, scipy, prophet | Fits CTR decay curves per creative |
| `survival_analysis.py` | `master_creatives.csv` | `cox_hazard_ratios.csv` | pandas, lifelines, sklearn | Kaplan-Meier + Cox PH fatigue modeling |
| `ml_models.py` | `master_creatives.csv`, `decay_features.csv` | `ml_predictions.csv` | lightgbm, shap, sklearn | LightGBM fatigue classifier with SHAP importance |
| `recommendation_engine.py` | master + decay + ml + cox | `model_outputs.csv` | pandas, numpy | Final Scale/Monitor/Pivot/Pause with explanations |
| `integrate_tribe_v2.py` | `neural_cache.csv`, master, decay | Enhanced predictions | lightgbm, sklearn | Optional: re-trains with TRIBE neural features |

### TRIBE v2 Live Backend (`pipeline/backend_api.py`)

Standalone FastAPI server that runs TRIBE v2 inference on uploaded images. Requires GPU.
- Accepts image/video uploads via `POST /api/analyze`
- Returns brain scores + recommendation
- Designed for Google Colab (see `colab_backend.ipynb`)

---

## External Files Referenced

These live in the parent `neuralad/` directory:

| Path | Purpose |
|------|---------|
| `Smadex_Creative_Intelligence_Dataset_FULL/` | Raw dataset: CSVs + 1080 creative PNGs. `api_server.py` serves images from `assets/` |
| `colab_backend.ipynb` | Colab notebook exposing `backend_api.py` via ngrok |
| `TRIBE_V2_Colab_Inference.ipynb` | Standalone TRIBE v2 batch inference |
| `tribe_demo_v8.ipynb` | TRIBE v2 official demo notebook (also in repo root) |

---

## Dependencies Summary

### Python (backend — hard)
```
fastapi
uvicorn
python-multipart
sse-starlette
pandas
numpy
```

### Python (copilot LLM — optional)
```
openai               # GPT-4o-mini copilot responses (needs OPENAI_API_KEY in .env)
google-generativeai  # Gemini 2.0 Flash copilot responses (needs GOOGLE_API_KEY in .env)
python-dotenv        # Load .env file (has manual fallback if not installed)
```

### Python (pipeline — optional with fallbacks)
```
scipy          # Decay curve fitting (fallback: linear heuristic)
scikit-learn   # ML preprocessing (fallback: rule-based)
lightgbm       # Status classifier + fatigue regressor (fallback: heuristic)
```

### Python (offline pipeline scripts only)
```
lifelines      # Kaplan-Meier + Cox PH (pipeline/creative_intelligence/)
shap           # Feature importance plots (pipeline/creative_intelligence/)
matplotlib     # Chart generation (both pipelines)
seaborn        # Visualization (pipeline/creative_intelligence/)
prophet        # Time-series forecasting (pipeline/creative_intelligence/decay_analysis.py)
```

### Node.js (frontend)
React 19, Vite 6, TypeScript 5.9, Tailwind CSS 4, shadcn/ui (Radix), Recharts, Lucide icons, Framer Motion

---

## AI/ML Models Summary

### Copilot LLM (optional, in `api_server.py`)

The copilot chat uses a cascading LLM resolution:

```
User asks question
        |
        v
OPENAI_API_KEY set?  --yes-->  GPT-4o-mini (max 300 tokens, temp 0.7)
        |
        no
        v
GOOGLE_API_KEY set?  --yes-->  Gemini 2.0 Flash
        |
        no
        v
Rule-based keyword matching (always works, no API key needed)
```

All paths stream via SSE. The system prompt includes full creative context: status, metrics, brain scores, explanation. Response includes `llm_powered: true/false`.

### ML Predictions (in `pipeline_runner.py`)

| Model | Type | Classes/Output | Training |
|-------|------|----------------|----------|
| LightGBM Classifier | Gradient boosting | 4-class: top_performer, stable, fatigued, underperformer | Trained per-upload on uploaded data with GroupShuffleSplit |
| LightGBM Regressor | Gradient boosting | Continuous fatigue probability (0-1) | Same train/test split as classifier |
| Heuristic fallback | Rule-based formula | Status + fatigue from CTR decay, ROAS, decay rate | No training needed |

### Brain Scores (in `pipeline_runner.py`)

Custom weighted formulas computing 5 neuro-inspired scores from visual metadata. Pure numpy, always works. See Brain Feature Formulas section below.

### Decay Curves (in `pipeline_runner.py`)

| Method | When | How |
|--------|------|-----|
| scipy `curve_fit` | scipy installed + daily data available | Fits `CTR(t) = a * exp(-lambda * t)` per creative |
| Linear heuristic | scipy unavailable + daily data available | Compares first-half vs second-half CTR mean |
| Master heuristic | No daily data | Uses `ctr_decay_pct` from uploaded CSV |

---

## What Was Changed For Integration

| What | Before | After |
|------|--------|-------|
| Backend | Express + OpenAI API | FastAPI + live pipeline + pre-computed fallback |
| Data source | OpenAI generates analysis | Pipeline runs live on uploaded CSVs |
| Copilot | OpenAI chat completions (required) | GPT-4o-mini / Gemini 2.0 Flash / rule-based (all optional) |
| Upload | Single CSV, match against pre-computed | Multi-file CSV, auto-detect + live pipeline |
| Frontend upload | Single file picker | Multi-file drag-and-drop with auto-detection |
| API client | Single JSON fetch | Multi-file upload + SSE streaming |
| Vite proxy | `localhost:3001` (Express) | `localhost:8000` (FastAPI) + `/creatives` + `/assets` |
| Asset serving | External Smadex dataset dir | Local `assets/` directory + embedded dataset fallback |
| Creative IDs | Numeric only (500000) | Numeric + string (APPLE-01, CR-1042) |
| Pipeline scripts | Outside repo, offline only | Integrated in `pipeline_runner.py` + `pipeline/` |
