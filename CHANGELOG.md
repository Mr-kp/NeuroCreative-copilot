# Changelog

All notable changes to NeuroCreative Copilot are documented in this file.

---

## [2026-04-26] - LLM Copilot + Real Brand Demo + Asset Serving

### Summary

A teammate integrated LLM-powered copilot responses (OpenAI GPT-4o-mini or Google Gemini 2.0 Flash), added real brand demo data (Apple, Nike, Coca-Cola, McDonalds) with creative images, fixed asset serving to use local `assets/` directory, and added a `/creatives/{filename}` endpoint. Updated documentation to reflect all AI/ML models used across the project.

### AI/ML Models Used

| Component | Model | Purpose | Required? |
|-----------|-------|---------|-----------|
| Copilot chat | **OpenAI GPT-4o-mini** | Natural language answers about creatives | Optional — rule-based fallback |
| Copilot chat | **Google Gemini 2.0 Flash** | Alternative LLM (if no OpenAI key) | Optional — rule-based fallback |
| Status classifier | **LightGBM LGBMClassifier** | 4-class creative status prediction | Optional — heuristic fallback |
| Fatigue regressor | **LightGBM LGBMRegressor** | Continuous fatigue probability | Optional — heuristic fallback |
| Decay curves | **scipy curve_fit** | Exponential CTR decay fitting | Optional — linear heuristic fallback |
| Brain scores | **Custom weighted formulas** | attention / reward / memory / emotion / visual_load | Always works (pure numpy) |

### Added

- **LLM integration in copilot** (`api_server.py`):
  - OpenAI GPT-4o-mini: primary LLM for copilot answers when `OPENAI_API_KEY` is set
  - Google Gemini 2.0 Flash: fallback LLM when `GOOGLE_API_KEY` is set (only if no OpenAI key)
  - Rule-based: final fallback when no LLM keys configured (original behavior)
  - System prompt includes full creative context (status, metrics, brain scores, explanation)
  - Response includes `llm_powered: true/false` field
- **`.env.example`**: Documents optional API keys (`OPENAI_API_KEY`, `GOOGLE_API_KEY`)
- **Real brand demo data**:
  - `real_brands_creatives.csv`: 4 creatives (Apple, Nike, Coca-Cola, McDonalds)
  - `real_brands_daily.csv`: 120 daily time-series rows for the 4 brands
  - `assets/apple_ad.png`, `assets/nike_ad.png`, `assets/coca_cola_ad.png`, `assets/mcdonalds_ad.png`
  - `assets/CR-*.png`: 6 Smadex creative images
  - `neurocreative_test_campaign.csv`, `test_creatives.csv`: test fixtures
- **`GET /creatives/{filename}`** endpoint: Serves creative images from local `assets/` or embedded dataset
- **String creative ID support**: `build_creative_row()` now handles both numeric (500000) and string (CR-1042, APPLE-01) IDs

### Changed

- **`api_server.py`**: ASSETS_DIR changed from `../Smadex_Creative_Intelligence_Dataset_FULL/assets` to local `assets/` directory
- **`vite.config.ts`**: Added proxy rules for `/creatives` and `/assets` to backend
- **`pipeline_runner.py`**: Error handling in `run_pipeline()` call, traceback logging on pipeline errors
- **`App.tsx`**: Updated to handle real brand demo data and new asset paths
- **Documentation**: Updated README.md, INTEGRATION.md, CHANGELOG.md with AI model details

### How Copilot Works Now

```
User asks a question
        |
        v
Has OPENAI_API_KEY?  ──yes──>  GPT-4o-mini generates answer
        |
        no
        v
Has GOOGLE_API_KEY?  ──yes──>  Gemini 2.0 Flash generates answer
        |
        no
        v
Rule-based pattern matching (fatigue/scale/change/brain keywords)
```

All paths stream via SSE. LLM answers include the creative's full context in the system prompt.

---

## [2026-04-25] - Live Pipeline Integration: Upload Smadex CSVs → Run Analysis

### Summary

The upload endpoint now runs the full creative intelligence pipeline live when you upload raw Smadex CSV files. Previously it only matched creative_ids against pre-computed data. Now it auto-detects which tables you uploaded, joins them, extracts brain features, fits decay curves, trains ML predictions, and generates recommendations — all in one request. Falls back gracefully: scipy for decay curves (or linear heuristic), lightgbm for predictions (or rule-based heuristic), and always matches against pre-computed data if available.

### Added

- **`pipeline_runner.py`** — Self-contained pipeline module with 8 functions:
  - `detect_tables()` — Auto-detects Smadex table types from uploaded CSVs (filename match or column signature match)
  - `build_master_table()` — Joins creative_summary + creatives + campaigns + advertisers into one master table
  - `build_daily_table()` — Aggregates daily stats into creative x date level with CTR/CVR/ROAS
  - `compute_brain_features()` — Brain-inspired scores from visual metadata (pure pandas/numpy, always works)
  - `compute_decay_features()` — Scipy curve_fit for exponential decay, falls back to linear heuristic
  - `compute_predictions_ml()` — LightGBM classifier + regressor, falls back to rule-based heuristics
  - `generate_recommendations()` — Scale/Monitor/Pivot/Pause with natural language explanations
  - `run_pipeline()` — Orchestrates everything, returns merged DataFrame + pipeline log

### Changed

- **`api_server.py`** — Upload endpoint now accepts multiple CSV files via `files` field:
  - Auto-detects table types and runs live pipeline if multiple Smadex CSVs uploaded
  - Falls back to pre-computed data matching if a single CSV with creative_ids is uploaded
  - Returns `pipeline_log` field in response showing which steps ran
  - Pre-computed data still loaded at startup as fallback
- **`dashboard/artifacts/neurocreative/src/components/UploadCampaignData.tsx`** — Multi-file CSV upload:
  - Accepts multiple CSV files (drag & drop or file picker)
  - Shows list of uploaded files with sizes
  - Expandable hint showing supported Smadex table names
  - "Add more" / "Clear all" buttons
- **`dashboard/artifacts/neurocreative/src/lib/apiClient.ts`** — Sends multiple files, logs pipeline output

### How It Works

```
User uploads CSVs
       |
       v
api_server.py receives files[]
       |
       +-- Single CSV with creative_ids?
       |       -> Match against pre-computed data (fast)
       |
       +-- Multiple Smadex CSVs?
               -> pipeline_runner.run_pipeline()
                    1. detect_tables()      -> identify each CSV
                    2. build_master_table()  -> join into 1 row/creative
                    3. build_daily_table()   -> aggregate time-series
                    4. compute_brain_features() -> attention/reward/memory/emotion/visual_load
                    5. compute_decay_features()  -> CTR decay curves (scipy or heuristic)
                    6. compute_predictions_ml()   -> LightGBM or heuristic
                    7. generate_recommendations() -> Scale/Monitor/Pivot/Pause + explanations
                    8. Return merged DataFrame -> build_creative_row() -> DashboardResponse
```

### Dependencies (Optional, with Fallbacks)

| Package | Used For | Fallback if Missing |
|---------|----------|-------------------|
| `pandas`, `numpy` | All data processing | **Required** (hard dependency) |
| `scipy` | Decay curve fitting (`curve_fit`) | Linear decay heuristic |
| `scikit-learn` | LabelEncoder, GroupShuffleSplit | Rule-based predictions |
| `lightgbm` | Status classifier + fatigue regressor | Rule-based heuristics |

---

## [2026-04-25] - Integration: Python API Backend + SSE Streaming Copilot

### Summary

Replaced the OpenAI-dependent Express/Node backend with a Python FastAPI backend that serves pre-computed pipeline data. The React frontend now connects to a local Python API that processes uploaded CSVs against offline pipeline outputs (fatigue predictions, brain-inspired scores, recommendations). The copilot streams answers token-by-token via Server-Sent Events.

### Added

- **`api_server.py`** — FastAPI backend (port 8000) with three endpoints:
  - `POST /api/analyze-creatives-upload` — Accepts a Smadex CSV, matches creative_ids against pre-computed pipeline data, returns a `DashboardResponse` with 1080 creatives including KPIs, brain scores, MRI activity, cognitive summaries, recommendations, and copilot answers.
  - `POST /api/ask-copilot` — SSE streaming endpoint. Accepts a question + selected creative context, generates rule-based answers from pipeline data (fatigue probability, brain scores, recommendation, explanation), streams tokens live.
  - `GET /assets/{filename}` — Serves creative PNG images from the Smadex dataset directory.
- **`data/`** directory — Pre-computed pipeline outputs copied into the repo:
  - `master_creatives.csv` — 1080 creatives with full metadata, KPIs, and visual features.
  - `model_outputs.csv` — Predicted status, fatigue probability, recommendation, and explanation per creative.
  - `brain_features.csv` — Brain-inspired scores (attention, reward, memory, emotion, visual_load) per creative.
  - `daily_fatigue_table.csv` — 52,350 daily time-series rows with CTR/CVR/ROAS for trend charts.
- **`pipeline/creative_intelligence/`** — All 7 backend pipeline scripts, re-runnable:
  - `data_pipeline.py` — Joins Smadex CSVs into master_creatives.csv
  - `brain_features.py` — Computes brain-inspired scores from visual metadata
  - `decay_analysis.py` — Fits CTR decay curves per creative using scipy
  - `survival_analysis.py` — Kaplan-Meier + Cox PH fatigue modeling
  - `ml_models.py` — LightGBM classifier with SHAP feature importance
  - `recommendation_engine.py` — Final Scale/Monitor/Pivot/Pause decision layer with explanations
  - `integrate_tribe_v2.py` — Optional TRIBE v2 neural feature enhancement
- **`pipeline/time_decay/`** — Alternative XGBoost AFT survival pipeline:
  - `run_tribe_batch.py` — Batch TRIBE v2 inference on creative assets
  - `build_survival_targets.py` — Fatigue event detection from CTR smoothing
  - `fuse_features.py` — Builds analytical base table with one-hot encoding
  - `train_aft_model.py` — XGBoost AFT survival model for lifespan prediction
  - `generate_copilot_feed.py` — Final copilot action feed with decision tags
  - `PIPELINE_DOCUMENTATION.md` — Full documentation for the time-decay pipeline
- **`pipeline/backend_api.py`** — Standalone TRIBE v2 live inference FastAPI server (for GPU/Colab use)
- **`INTEGRATION.md`** — Full architecture documentation covering branches, data pipeline, API contract, component map, dependencies, re-run instructions, and the integration diff.
- **`CHANGELOG.md`** — This file.

### Changed

- **`dashboard/artifacts/neurocreative/vite.config.ts`**
  - Changed API proxy target from `localhost:3001` (Express) to `localhost:8000` (FastAPI).
- **`dashboard/artifacts/neurocreative/src/lib/apiClient.ts`**
  - Replaced `askCopilot()` (single JSON fetch) with `askCopilotStream()` using SSE.
  - New `CopilotStreamCallbacks` interface with `onToken`, `onDone`, `onError` callbacks.
  - SSE parser reads `event: token` chunks for live text and `event: done` for the final structured response.
- **`dashboard/artifacts/neurocreative/src/components/CopilotSheet.tsx`**
  - Copilot now streams responses token-by-token when in live mode (uploaded analysis).
  - Uses `askCopilotStream()` with state updates on each token chunk.
  - Text appears incrementally in the chat, then gets replaced with the full structured response on completion.
  - Supporting points, action badges, and follow-up questions render after stream completes.
- **`dashboard/artifacts/neurocreative/src/components/UploadCampaignData.tsx`**
  - Button text changed from "Analyze with OpenAI" to "Analyze creatives".
  - Loading text changed from "Analyzing with OpenAI…" to "Analyzing creatives…".
- **`dashboard/artifacts/neurocreative/src/App.tsx`**
  - Error banner text changed from "OpenAI analysis failed" to "Analysis failed".
  - Mode indicator changed from "analyzed by OpenAI" to "analyzed by pipeline".
- **`dashboard/artifacts/neurocreative/package-lock.json`**
  - Updated after `npm install`.

### Removed

- **No files deleted.** The original Express server code (`server/`) remains in the repo for reference but is no longer used. The Vite dev command `dev:frontend` replaces the combined `dev` command that ran both Express and Vite concurrently.

### Dependencies Added

**Python (backend):**
- `fastapi` — Web framework
- `uvicorn` — ASGI server
- `python-multipart` — File upload handling
- `sse-starlette` — Server-Sent Events support
- `pandas` — CSV loading and data manipulation
- `numpy` — Numerical operations

**Node.js (frontend):**
- No new packages. All existing packages unchanged.

### How to Run (New Setup)

```bash
# Terminal 1: Start Python backend
pip install fastapi uvicorn python-multipart sse-starlette pandas numpy
python api_server.py

# Terminal 2: Start React frontend
cd dashboard/artifacts/neurocreative
npm install
npm run dev:frontend
```

Open `http://localhost:5173`. Upload a Smadex CSV to populate the dashboard with pipeline analysis.

---

## [2026-04-25] - WEB: Initial React Dashboard

### Added

- React/Vite dashboard with shadcn/ui components.
- Campaign overview with KPI cards.
- Creative gallery with status badges and action indicators.
- Performance trend charts with Recharts.
- Brain intelligence panel with score gauges.
- MRI-style brain activity heatmap visualization.
- Copilot slide-out chat panel.
- CSV upload with drag-and-drop.
- Express server scaffold with OpenAI integration for analysis and copilot.
- Full Smadex dataset embedded (1080 creative PNGs + CSVs).
- Demo data fallback (`smadexData.ts`) for when no CSV is uploaded.

---

## [2026-04-25] - EDA: Data Pipeline and Analysis

### Added

- 4 Jupyter notebooks: schema mapping, master table construction, daily fatigue table, insight mining.
- `master_creatives.csv` — Joined creative performance table (1080 rows).
- `daily_fatigue_table.csv` — Daily time-series with CTR/CVR/ROAS (52,350 rows).
- EDA insights documentation.
- Master schema documentation.

---

## [2026-04-25] - Initial Commit

### Added

- `README.md` — Project description.
- `tribe_demo_v8.ipynb` — TRIBE v2 multimodal brain encoding demo for marketing intelligence.
