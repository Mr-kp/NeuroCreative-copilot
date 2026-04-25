# NeuroCreative Copilot - Architecture & Integration Guide

## What This Project Is

NeuroCreative Copilot is a hackathon project for the **Smadex Creative Intelligence Challenge** at HackUPC. It builds a marketer-facing dashboard that tells advertisers whether their mobile ad creatives should be **scaled, monitored, pivoted, or paused** — backed by brain-inspired cognitive scoring and ML fatigue prediction.

---

## Repository Branches

| Branch | Content |
|--------|---------|
| `main` | Base project: README + TRIBE v2 Colab notebook |
| `EDA` | Exploratory data analysis: 4 Jupyter notebooks, master_creatives.csv, daily_fatigue_table.csv, insights |
| `WEB` | React/Vite dashboard with shadcn/ui, API server scaffold, embedded dataset |
| `integration` (current) | WEB branch + Python FastAPI backend replacing OpenAI dependency with pre-computed pipeline data |

---

## Project Structure

```
NeuroCreative-copilot/
  api_server.py              # FastAPI backend (the integration glue)
  CHANGELOG.md               # Change history
  INTEGRATION.md             # This file
  data/                      # Pre-computed pipeline outputs
    master_creatives.csv     # 1080 creatives with full metadata + KPIs
    model_outputs.csv        # predicted_status, fatigue_probability, recommendation, explanation
    brain_features.csv       # attention, reward, memory, emotion, visual_load scores
    daily_fatigue_table.csv  # 52350 daily rows with CTR/CVR/ROAS time series
  pipeline/                  # All backend scripts (re-runnable)
    creative_intelligence/   # Primary pipeline (7 scripts)
      data_pipeline.py       # Step 1: join Smadex CSVs into master table
      brain_features.py      # Step 2: compute brain-inspired scores
      decay_analysis.py      # Step 3: fit CTR decay curves
      survival_analysis.py   # Step 4: Kaplan-Meier + Cox PH modeling
      ml_models.py           # Step 5: LightGBM + SHAP
      recommendation_engine.py # Step 6: final Scale/Monitor/Pivot/Pause
      integrate_tribe_v2.py  # Optional: enhance with TRIBE neural features
    time_decay/              # Alternative XGBoost AFT survival pipeline
      run_tribe_batch.py     # Batch TRIBE inference on creative assets
      build_survival_targets.py # Detect fatigue events from CTR
      fuse_features.py       # Build analytical base table
      train_aft_model.py     # XGBoost AFT survival model
      generate_copilot_feed.py # Final action tags for dashboard
      PIPELINE_DOCUMENTATION.md # Full docs for this pipeline
    backend_api.py           # Standalone TRIBE v2 live inference server
  dashboard/
    artifacts/
      neurocreative/         # React/Vite frontend dashboard
        src/
          components/        # UI components (shadcn/ui based)
          data/smadexData.ts # Demo data (fallback when no CSV uploaded)
          lib/apiClient.ts   # API client (upload + SSE streaming copilot)
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

```
 User uploads CSV           FastAPI Backend              React Frontend
 ┌──────────────┐     ┌─────────────────────┐     ┌──────────────────┐
 │ creative_    │────>│ POST /api/analyze-  │────>│ DashboardResponse │
 │ summary.csv  │     │ creatives-upload    │     │ populates UI      │
 └──────────────┘     │                     │     │                   │
                      │ Matches creative_ids│     │ KPI cards, brain  │
                      │ against pipeline    │     │ scores, gallery,  │
                      │ data (CSVs)         │     │ recommendations   │
                      │                     │     │                   │
 User asks copilot    │ POST /api/ask-      │     │ CopilotSheet      │
 ┌──────────────┐     │ copilot (SSE)       │────>│ streams tokens    │
 │ "Why is this │────>│ Rule-based answers  │     │ live, word by word│
 │ ad fatigued?"│     │ from pipeline data  │     │                   │
 └──────────────┘     └─────────────────────┘     └──────────────────┘
                              │
                              │ reads
                              v
                       data/*.csv (pipeline outputs)
```

### Key Flows

1. **Upload**: User uploads a Smadex CSV. The backend matches `creative_id`s against the pre-computed pipeline data and returns a `DashboardResponse` JSON with 1080 creatives, each containing KPIs, brain scores, MRI activity, recommendations, and copilot answers.

2. **Copilot**: User asks a question about a selected creative. The backend uses the pipeline's pre-computed explanation, fatigue probability, brain scores, and recommendation to generate a contextual answer. The response streams token-by-token via **Server-Sent Events (SSE)** so text appears live in the UI.

3. **Demo mode**: When no CSV is uploaded, the frontend falls back to hardcoded demo data from `smadexData.ts`. The copilot uses a local rule-based answer generator (no API call needed).

---

## Data Pipeline (offline, pre-computed)

The pipeline scripts live inside this repo at `pipeline/`. They were run offline to produce the 4 CSVs in `data/` that `api_server.py` loads at startup. If the team needs to regenerate or modify the data, run these scripts in order.

### Pipeline A: Creative Intelligence (`pipeline/creative_intelligence/`)

This is the primary pipeline that produces the dashboard data.

```
Smadex Raw CSVs (from ../Smadex_Creative_Intelligence_Dataset_FULL/)
       │
       v
 1. data_pipeline.py          → master_creatives.csv (join all tables)
 2. brain_features.py         → brain_features.csv (attention, reward, memory, emotion, visual_load)
 3. decay_analysis.py         → decay_features.csv (CTR curve fitting via scipy)
 4. survival_analysis.py      → cox_hazard_ratios.csv (Kaplan-Meier + Cox PH)
 5. ml_models.py              → ml_predictions.csv (LightGBM + SHAP feature importance)
 6. recommendation_engine.py  → model_outputs.csv (Scale/Monitor/Pivot/Pause + explanations)
 7. integrate_tribe_v2.py     → Enhanced predictions with TRIBE neural features (optional, needs Colab)
```

**How to re-run:**

```bash
cd pipeline/creative_intelligence

# Scripts expect data files relative to their own directory.
# Create a "data" symlink or copy Smadex CSVs there:
mkdir -p data
cp ../../../Smadex_Creative_Intelligence_Dataset_FULL/*.csv data/

# Run in order:
python data_pipeline.py      # Step 1: builds master_creatives.csv
python brain_features.py     # Step 2: builds brain_features.csv
python decay_analysis.py     # Step 3: builds decay_features.csv
python survival_analysis.py  # Step 4: builds cox_hazard_ratios.csv
python ml_models.py          # Step 5: builds ml_predictions.csv
python recommendation_engine.py  # Step 6: builds model_outputs.csv

# Copy outputs to repo data/ dir:
cp data/master_creatives.csv ../../data/
cp data/brain_features.csv ../../data/
cp data/model_outputs.csv ../../data/
```

### Pipeline B: Time Decay / AFT Survival (`pipeline/time_decay/`)

Alternative pipeline using XGBoost Accelerated Failure Time models. See `pipeline/time_decay/PIPELINE_DOCUMENTATION.md` for full details.

```
TRIBE v2 batch inference (Colab)
       │
       v
 1. run_tribe_batch.py        → neural_cache.csv (brain scores from TRIBE model)
 2. build_survival_targets.py → survival_targets.csv (fatigue event detection)
 3. fuse_features.py          → fused_abt.csv (master training matrix)
 4. train_aft_model.py        → model_predictions.csv (XGBoost AFT lifespan predictions)
 5. generate_copilot_feed.py  → copilot_action_feed.csv (final action tags)
```

**Note:** `run_tribe_batch.py` requires TRIBE v2 running on a GPU (Colab). See `tribe_demo_v8.ipynb` for setup.

### Pipeline Script Details

| Script | Input | Output | Key Libraries | What It Does |
|--------|-------|--------|---------------|--------------|
| `data_pipeline.py` | Smadex CSVs | `master_creatives.csv` | pandas, numpy | Joins advertisers, campaigns, creatives, creative_summary into one master table with 1080 rows |
| `brain_features.py` | `master_creatives.csv` | `brain_features.csv` | pandas, numpy | Computes brain-inspired scores from visual metadata (see formulas below) |
| `decay_analysis.py` | `daily_fatigue_table.csv`, `master_creatives.csv` | `decay_features.csv` | pandas, scipy, sklearn | Fits CTR decay curves per creative, classifies decay pattern (exponential/linear/stable) |
| `survival_analysis.py` | `master_creatives.csv` | `cox_hazard_ratios.csv` | pandas, lifelines, sklearn | Kaplan-Meier survival curves + Cox PH hazard modeling for creative fatigue |
| `ml_models.py` | `master_creatives.csv`, `decay_features.csv` | `ml_predictions.csv` | lightgbm, shap, sklearn | LightGBM fatigue classifier with SHAP feature importance. Uses GroupShuffleSplit for campaign-aware splitting |
| `recommendation_engine.py` | `master_creatives.csv`, `decay_features.csv`, `ml_predictions.csv`, `cox_hazard_ratios.csv` | `model_outputs.csv` | pandas, numpy | Final decision layer: merges all signals, generates Scale/Monitor/Pivot/Pause + natural language explanations |
| `integrate_tribe_v2.py` | `neural_cache.csv`, `master_creatives.csv`, `decay_features.csv` | Enhanced model predictions | lightgbm, sklearn, seaborn | Optional: re-trains models with TRIBE neural features for improved accuracy |

### Brain Feature Formulas (fallback, no TRIBE needed)

When TRIBE v2 is not available (which is the default — it requires a GPU), brain scores are computed from visual metadata already in the dataset:

- **Attention** = 0.40 × motion + 0.30 × novelty + 0.20 × clutter + 0.10 × has_duration
- **Reward** = 0.30 × brand_visibility + 0.25 × has_discount + 0.25 × has_price + 0.20 × product_count
- **Memory** = 0.35 × readability + 0.25 × (1 − text_density) + 0.25 × brand_visibility + 0.15 × novelty
- **Emotion** = Weighted combination of emotional_tone encoding + visual features
- **Visual Load** = 0.35 × clutter + 0.30 × text_density + 0.20 × product_count + 0.15 × (1 / readability)

### TRIBE v2 Live Backend (`pipeline/backend_api.py`)

A standalone FastAPI server that runs TRIBE v2 inference on uploaded creative images in real time. This is what powers the "live brain scan" feature if you have a GPU.

- Accepts image/video uploads via `POST /api/analyze`
- Converts images to 1-second MP4 via ffmpeg, runs TRIBE model
- Returns brain scores + recommendation (falls back to mock scores if model unavailable)
- Designed to run on Google Colab with GPU (see `colab_backend.ipynb`)

**Dependencies:** `tribev2` (from `git+https://github.com/facebookresearch/tribev2.git`), `ffmpeg`

---

## External Files Referenced

These live in the parent `neuralad/` directory and are referenced by the API server:

| Path | Purpose |
|------|---------|
| `Smadex_Creative_Intelligence_Dataset_FULL/` | Raw dataset: CSVs + 1080 creative PNGs. `api_server.py` serves images from `assets/` subfolder |
| `colab_backend.ipynb` | Colab notebook that exposes `backend_api.py` via ngrok for remote access |
| `TRIBE_V2_Colab_Inference.ipynb` | Standalone TRIBE v2 batch inference on creative assets |
| `tribe_demo_v8.ipynb` | TRIBE v2 official demo notebook (also in repo root) |

---

## Frontend Component Map

| Component | What it renders |
|-----------|----------------|
| `UploadCampaignData` | CSV + asset upload with drag-and-drop |
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

### Backend
```bash
pip install fastapi uvicorn python-multipart sse-starlette pandas numpy
python api_server.py   # starts on http://localhost:8000
```

### Frontend
```bash
cd dashboard/artifacts/neurocreative
npm install
npm run dev:frontend   # starts on http://localhost:5173
```

Vite proxies `/api` requests to `localhost:8000` automatically.

### To run both together
```bash
# Terminal 1
python api_server.py

# Terminal 2
cd dashboard/artifacts/neurocreative && npm run dev:frontend
```

Open `http://localhost:5173`, upload `creative_summary.csv` from the Smadex dataset, and the dashboard populates with pipeline analysis.

---

## API Endpoints

### `POST /api/analyze-creatives-upload`
- **Input**: multipart form with `csvFile` (required) + `creativeAssets` (optional images)
- **Output**: `DashboardResponse` JSON matching the frontend's TypeScript types
- **Logic**: Matches uploaded creative_ids against pre-computed pipeline data

### `POST /api/ask-copilot`
- **Input**: JSON `{ question, selectedCreative, dashboardContext }`
- **Output**: SSE stream — `token` events with text chunks, then a `done` event with the full `CopilotApiResponse`
- **Logic**: Rule-based answer generation using the creative's pipeline data (fatigue probability, brain scores, recommendation, explanation)

### `GET /assets/{filename}`
- **Output**: Static creative PNG from `../Smadex_Creative_Intelligence_Dataset_FULL/assets/`

---

## Dependencies Summary

### Python (backend)
```
fastapi
uvicorn
python-multipart
sse-starlette
pandas
numpy
```

### Python (full pipeline, if re-running)
```
scipy
scikit-learn
lightgbm
lifelines
shap
matplotlib
seaborn
```

### Node.js (frontend)
React 19, Vite 6, TypeScript 5.9, Tailwind CSS 4, shadcn/ui (Radix), Recharts, Lucide icons, Framer Motion

---

## What Was Changed For Integration

| What | Before | After |
|------|--------|-------|
| Backend | Express + OpenAI API | FastAPI + pre-computed pipeline CSVs |
| Data source | OpenAI generates analysis from CSV upload | Pipeline data matched by creative_id |
| Copilot | OpenAI chat completions (JSON response) | Rule-based answers streamed via SSE |
| Frontend API client | Single JSON fetch | SSE streaming with token-by-token display |
| Upload button | "Analyze with OpenAI" | "Analyze creatives" |
| Vite proxy | `localhost:3001` (Express) | `localhost:8000` (FastAPI) |

No React components, UI, or styling were modified. The backend serves the exact same JSON shapes the frontend already expected.
