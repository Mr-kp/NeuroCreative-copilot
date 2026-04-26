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
  api_server.py              # FastAPI backend — upload, copilot SSE, image analysis, asset serving
  pipeline_runner.py         # Live pipeline — detect, join, brain, decay, ML, recommend
  copilot_agent.py           # Copilot agent — 4 tools, executive summary, heatmap, multi-LLM
  copilot_prompts.py         # System prompt + neuroscience knowledge base + context builders
  tribe_client.py            # Remote TRIBE V2 client (Kaggle GPU via cloudflared)
  cache_manager.py           # Hash-based JSON cache with numpy serialization
  pipeline_logger.py         # Structured rotating log (logs/pipeline.log)
  CHANGELOG.md               # Detailed change history
  INTEGRATION.md             # This file
  README.md                  # Project overview and quick start
  .env.example               # API keys (OPENAI, GOOGLE, TRIBE_ENDPOINT)
  tribe_colab_backend.ipynb  # Kaggle-ready TRIBE V2 inference notebook
  data/                      # Pre-computed pipeline outputs (TRIBE V2 integrated)
    master_creatives.csv     # 1080 creatives with full metadata + KPIs
    model_outputs.csv        # v3 boosted: predicted_status, fatigue_probability, recommendation
    brain_features.csv       # TRIBE V2 integrated: 75 real + 1005 imputed brain scores
    ml_predictions.csv       # v3 boosted ML predictions with perf_score_predicted
    neural_cache_top_bottom.csv # 75 real TRIBE V2 scores (25 top + 25 avg + 25 bottom)
    daily_fatigue_table.csv  # 52350 daily rows with CTR/CVR/ROAS time series
  models/                    # Trained LightGBM v3 boosted models (77 features)
    status_classifier.pkl    # LGBMClassifier (4-class, 76.4% accuracy)
    fatigue_regressor.pkl    # LGBMRegressor for fatigue probability
    perf_regressor.pkl       # LGBMRegressor for performance score
    label_encoders.pkl       # 13 LabelEncoder objects for categoricals
    model_metadata.pkl       # Feature names + metadata
  assets/                    # Creative images (apple_ad.png, nike_ad.png, etc.)
  tmp/cache/                 # Hash-based analysis cache (auto-created)
  tmp/copilot/               # Copilot analysis cache (JSON, keyed by file hash)
  tmp/uploads/               # Copilot uploaded files (static mount /tmp-uploads/)
  logs/                      # Rotating pipeline logs (auto-created)
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
            UploadCampaignData.tsx  # Multi-file CSV + image upload with SSE progress
            CopilotSheet.tsx        # SSE streaming copilot chat (dashboard context)
            BrainActivityMRI.tsx    # MRI-style heatmap visualization
            copilot/                # Full copilot page components
              CopilotPage.tsx       # Full-page copilot: upload, progress, report, reset, PDF
              CopilotReport.tsx     # Grade card, brain gauges, decay chart, heatmap, improvements
              CopilotChat.tsx       # Agent chat with tool calling, suggestion chips
          lib/
            apiClient.ts           # API client (multi-file upload + SSE streaming)
            copilotApi.ts          # Copilot API: copilotAnalyze, copilotChat, copilotCompare, copilotReset
          types/
            dashboard.ts           # TypeScript interfaces (dashboard)
            copilot.ts             # TypeScript interfaces (CopilotAnalysis, ChatMessage, etc.)
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

### Image Analysis Mode (TRIBE V2 + LightGBM V3)

When the user uploads a creative image (PNG/JPG), the backend runs TRIBE V2 brain inference + trained ML models:

```
  User uploads image       Python Backend                         React Frontend
  ┌──────────────────┐     ┌──────────────────────────────┐     ┌──────────────────┐
  │ apple_ad.png      │     │ POST /api/analyze-creative-   │     │                  │
  │ (471 KB PNG)      │────>│          image (SSE stream)   │────>│ Progress banner   │
  └──────────────────┘     │                              │     │ with step icons,  │
                             │ 1. Hash → cache check        │     │ then result card  │
                             │ 2. extract_pil_features()    │     │                  │
                             │    → 19 PIL features         │     │ brain scores,     │
                             │ 3. TRIBE V2 (Kaggle P100)    │     │ fatigue %, rec    │
                             │    → 5 brain scores          │     │                  │
                             │ 4. predict_creative()        │     └──────────────────┘
                             │    → 77-feature vector       │
                             │    → LightGBM v3 boosted     │
                             │    → status + fatigue + perf │
                             │ 5. Cache result              │
                             └──────────────────────────────┘
```

### Creative Intelligence Copilot (Full Analysis + Agent Chat)

Dedicated `/copilot` page with full analysis pipeline, interactive agent chat, and comparison:

```
  User drops creative     Python Backend                              React Frontend
  ┌──────────────────┐    ┌────────────────────────────────┐    ┌──────────────────────┐
  │ any image/video   │    │ POST /api/copilot/analyze      │    │                      │
  │                   │───>│ SSE: 7 progress steps w/timing │───>│ CopilotPage           │
  └──────────────────┘    │                                │    │  ├─ drop zone          │
                          │ Step 1: PIL features (19)      │    │  ├─ progress steps     │
                          │ Step 2: TRIBE V2 brain (5)     │    │  └─ CopilotReport      │
                          │ Step 3: LightGBM v3 (77 feat)  │    │     ├─ grade card (A-F) │
                          │ Step 4: Recommendation         │    │     ├─ brain gauges     │
                          │ Step 5: Decay + summary + impr.│    │     ├─ decay chart      │
                          │ Step 6: Heatmap (8x8)          │    │     ├─ heatmap          │
                          │ Step 7: Final report → cache   │    │     ├─ improvements     │
                          │                                │    │     └─ ML recommendation │
  User asks question     │ POST /api/copilot/chat          │    │                      │
  ┌──────────────────┐    │                                │    │ CopilotChat           │
  │ "How can I       │───>│ CopilotAgent (4 tools):        │───>│  ├─ tool call badges   │
  │ improve this?"   │    │  forecast_decay                │    │  ├─ streaming text     │
  └──────────────────┘    │  explain_brain_scores          │    │  └─ suggestion chips   │
                          │  suggest_improvements          │    │                      │
                          │  compare_creatives             │    │                      │
                          │ LLM: GPT-4o → Gemini → rules   │    │                      │
                          └────────────────────────────────┘    └──────────────────────┘
```

### TRIBE V2 Remote Inference

TRIBE V2 runs on a Kaggle P100 GPU, exposed via cloudflared tunnel:

```
  api_server.py              cloudflared tunnel              Kaggle P100
  ┌──────────────┐           ┌──────────────┐              ┌──────────────┐
  │ tribe_client  │──HTTP───>│ trycloudflare │─────────────>│ TRIBE V2     │
  │ .call_tribe() │          │ .com/api/     │              │ model on GPU │
  │               │<─────────│ analyze       │<─────────────│              │
  │ Returns:      │           └──────────────┘              │ attention:   │
  │ attention,    │                                         │ reward,      │
  │ reward,       │           tribe_colab_backend.ipynb     │ memory,      │
  │ memory,       │           runs the TRIBE server +       │ emotion,     │
  │ emotion,      │           cloudflared tunnel            │ visualLoad   │
  │ visualLoad    │                                         └──────────────┘
  └──────────────┘
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

Brain scores come from two sources:

**TRIBE V2 (real neural model, 75 creatives):**
- Actual brain encoding model running on Kaggle P100 GPU
- Processes creative image/video → outputs attention, reward, memory, emotion, visualLoad
- Source: `tribe_v2` in `brain_score_source` field

**LightGBM-imputed (1005 creatives):**
- Trained on the 75 real TRIBE V2 scores to predict brain scores for remaining creatives
- Uses 77 features (visual metadata + campaign + PIL + interactions)
- Source: `imputed` in `brain_score_source` field

**Heuristic fallback (pipeline_runner.py, no GPU needed):**
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

#### Trained Models (v3 Boosted, 77 features)

When the trained models in `models/` are available (loaded via joblib):

1. **Status Classifier** (`status_classifier.pkl`, LGBMClassifier): 4-class prediction — top_performer, stable, fatigued, underperformer. **76.4% accuracy**.
2. **Fatigue Regressor** (`fatigue_regressor.pkl`, LGBMRegressor): Continuous fatigue probability (0-1).
3. **Performance Regressor** (`perf_regressor.pkl`, LGBMRegressor): Performance score (0-100).

**77 features**: creative design (text_density, clutter_score, motion_score...), campaign (daily_budget_usd, objective, is_video), 13 encoded categoricals (vertical, format, tone, theme, platform, etc.), binary attributes (has_discount, has_price, is_video...), TRIBE V2 brain scores (*_real), 17 PIL image features (brightness, contrast, saturation, edge density...), 10 country flags, 12 interaction features.

**Neural efficiency finding**: Lower brain activation correlates with better performance (r = -0.24 to -0.27). Top performers average ~36/100 neural activation, underperformers ~50/100.

#### Live Pipeline (per-upload)

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
  - Each creative has `brain_score_source` (`tribe_v2` | `imputed`) and `_ml_source`
  - `portfolio_recommendations[]`: Top-level action items for the portfolio
  - `pipeline_log[]`: Step-by-step log of what the pipeline did (live mode only)

### `POST /api/analyze-creative-image`
- **Input**: Multipart form with `file` (PNG/JPG image)
- **Output**: SSE stream
- **Progress events** (7 steps): PIL features, TRIBE brain scores, ML prediction, fatigue analysis, etc.
- **Done event**: Full creative analysis result
- **Caching**: Results cached in `tmp/cache/` by file hash. Cached results show 5-second progress animation then return instantly.
- **Pipeline**: `extract_pil_features()` → `tribe_client.call_tribe()` → `predict_creative()` → recommendation

### `POST /api/analyze-creative-v2`
- **Input**: Multipart form with `file` (image) + optional `context` (JSON string)
- **Output**: SSE stream
- **Full 77-feature ML analysis** + optional GPT-4o multimodal vision analysis
- **Steps**: PIL features → TRIBE brain → LightGBM v3 boosted → GPT-4o vision → recommendation

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

### `POST /api/copilot/analyze`
- **Input**: Multipart form with `file` (image or video)
- **Output**: SSE stream
- **Progress events** (7 steps with real timing):
  1. PIL feature extraction (19 features)
  2. TRIBE V2 brain scores (or mock fallback)
  3. LightGBM v3 boosted prediction (77 features)
  4. Recommendation generation
  5. Decay forecast + executive summary + improvement suggestions
  6. Attention heatmap (8x8 grid)
  7. Final report assembly
- **Done event**: Full `CopilotAnalysis` JSON
- **Caching**: Results cached in `tmp/copilot/{hash}.json` by file SHA-256. Cached results return as SSE stream.
- **Error handling**: Entire stream wrapped in try/except; errors sent as `event: error` with message
- **Response includes**: `is_mock_data` (bool), `total_processing_time` (seconds), `step_timings` (dict), `brain_score_source`

### `POST /api/copilot/chat`
- **Input**: JSON `{ message: string, analysis_ids: string[], history: ChatMessage[] }`
- **Output**: SSE stream
  - `thinking` events when agent is reasoning
  - `tool_call` events with `{ name, label }` when agent invokes a tool
  - `tool_result` events with `{ name, summary }` after tool execution
  - `token` events with `{ text }` chunks for the response
  - `done` event with `{ provider }` label
- **Agent tools**:
  1. `forecast_decay` — scipy exponential CTR decay with half-life, fatigue onset, critical day
  2. `explain_brain_scores` — Neuroscience benchmark explanations with population comparisons
  3. `suggest_improvements` — Priority-ranked improvement suggestions with current→target scores
  4. `compare_creatives` — Side-by-side comparison across all dimensions
- **LLM resolution**: OpenAI GPT-4o (function calling, 3 rounds) → Gemini 2.5 Flash → rule-based

### `POST /api/copilot/compare`
- **Input**: JSON `{ analysis_ids: string[] }` (minimum 2)
- **Output**: JSON `ComparisonResult` with winner, insights, dimension-by-dimension breakdown

### `POST /api/copilot/reset`
- **Input**: None
- **Output**: JSON `{ ok: bool, cleared_cache: int, cleared_uploads: int }`
- **Logic**: Deletes all `tmp/copilot/*.json` and `tmp/uploads/*` files

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
| **`CopilotPage`** | Full-page copilot: drag-drop zone, SSE progress with step checkmarks, multi-creative tabs, PDF export, reset |
| **`CopilotReport`** | Executive summary (A-F grade), brain score gauges, decay forecast chart, attention heatmap, improvements, ML recommendation |
| **`CopilotChat`** | Agent chat with SSE streaming, tool call indicators, suggestion chips, upload-another |

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
joblib         # Model loading (comes with scikit-learn)
Pillow         # PIL image feature extraction for image uploads
```

### Python (TRIBE V2 client — optional with fallback)
```
httpx          # Async HTTP client for TRIBE V2 endpoint (fallback: requests)
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

### ML Predictions (trained models, v3 boosted)

| Model | File | Type | Features | Accuracy |
|-------|------|------|----------|----------|
| Status Classifier | `models/status_classifier.pkl` | LGBMClassifier (4-class) | 77 | 76.4% |
| Fatigue Regressor | `models/fatigue_regressor.pkl` | LGBMRegressor | 77 | Continuous 0-1 |
| Perf Regressor | `models/perf_regressor.pkl` | LGBMRegressor | 77 | Continuous 0-100 |

### ML Predictions (live pipeline, per-upload)

| Model | Type | Classes/Output | Training |
|-------|------|----------------|----------|
| LightGBM Classifier | Gradient boosting | 4-class: top_performer, stable, fatigued, underperformer | Trained per-upload on uploaded data with GroupShuffleSplit |
| LightGBM Regressor | Gradient boosting | Continuous fatigue probability (0-1) | Same train/test split as classifier |
| Heuristic fallback | Rule-based formula | Status + fatigue from CTR decay, ROAS, decay rate | No training needed |

### Brain Scores (three sources)

| Source | When | How | Response field |
|--------|------|-----|----------------|
| **TRIBE V2** (real) | Image upload + 75 pre-computed creatives | Neural encoding model on Kaggle P100 GPU | `brain_score_source: "tribe_v2"` |
| **LightGBM-imputed** | 1005 pre-computed creatives | Trained on 75 real TRIBE scores, predicts for rest | `brain_score_source: "imputed"` |
| **Heuristic formulas** | Live pipeline, no GPU | Weighted metadata formulas (pure numpy) | Not tracked (always works) |

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
| Backend | Express + OpenAI API | FastAPI + live pipeline + pre-computed fallback + TRIBE V2 |
| Data source | OpenAI generates analysis | Pipeline runs live on uploaded CSVs; TRIBE V2 brain model for images |
| Copilot | OpenAI chat completions (required) | GPT-4o-mini / Gemini 2.0 Flash / rule-based (all optional) |
| Upload | Single CSV, match against pre-computed | Multi-file CSV + image upload with SSE progress streaming |
| Frontend upload | Single file picker | Multi-file drag-and-drop with auto-detection + image analysis |
| API client | Single JSON fetch | Multi-file upload + SSE streaming + image upload |
| Vite proxy | `localhost:3001` (Express) | `localhost:8000` (FastAPI) + `/creatives` + `/assets` |
| Asset serving | External Smadex dataset dir | Local `assets/` directory + embedded dataset fallback |
| Creative IDs | Numeric only (500000) | Numeric + string (APPLE-01, CR-1042) |
| Pipeline scripts | Outside repo, offline only | Integrated in `pipeline_runner.py` + `pipeline/` |
| Brain scores | Heuristic formulas only | TRIBE V2 real neural model (75) + LightGBM imputed (1005) + heuristic fallback |
| ML models | Per-upload LightGBM training | Pre-trained v3 boosted models (77 features, 76.4% accuracy) |
| Image analysis | Not supported | PIL features → TRIBE V2 → LightGBM v3 → recommendation (SSE streaming) |
| Caching | None | Hash-based JSON cache in `tmp/cache/` with numpy serialization |
| Logging | Print statements | Structured rotating log (`logs/pipeline.log`, 5MB rotation) |
