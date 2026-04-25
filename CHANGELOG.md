# Changelog

All notable changes to NeuroCreative Copilot are documented in this file.

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
