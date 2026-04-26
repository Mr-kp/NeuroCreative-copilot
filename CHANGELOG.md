# Changelog

All notable changes to NeuroCreative Copilot are documented in this file.

---

## [2026-04-26] - Creative Intelligence Copilot: Full-Page Analysis + Agent Chat + Reset

### Summary

Built a full Creative Intelligence Copilot experience: a dedicated `/copilot` page where users upload any image or video creative and get a complete neuroscience + ML analysis with executive summary (A-F grade), brain score breakdown, CTR decay forecast chart, attention heatmap, improvement suggestions, and ML recommendation. Includes an interactive agent chat with 4 tools (forecast_decay, explain_brain_scores, suggest_improvements, compare_creatives), PDF export, reset with server-side temp data cleanup, and real-time SSE progress streaming that reports actual step timings.

### Added

- **`copilot_agent.py`** (~450 lines) — Agent system with 4 tools and multi-provider LLM:
  - `forecast_decay`: scipy exponential CTR decay with half-life, fatigue onset, critical day milestones
  - `explain_brain_scores`: Neuroscience benchmark explanations (attention vs reward vs memory vs emotion vs visualLoad) with population comparisons
  - `suggest_improvements`: Prioritized improvement suggestions (high/medium/low) with current → target scores
  - `compare_creatives`: Side-by-side comparison of multiple analyses across all dimensions
  - `compute_executive_summary`: A-F grading system (A+ to F) with overall score, strengths, weaknesses, top actions
  - `generate_heatmap`: 8x8 synthetic attention heatmap grid with hotspot markers from PIL edge/contrast/center-bias features
  - `CopilotAgent` class: OpenAI function calling (3 rounds max) → Gemini fallback → rule-based final fallback
- **Backend copilot endpoints** in `api_server.py`:
  - `POST /api/copilot/analyze` — SSE streaming analysis with 7 real-time progress steps, each reporting actual timing
  - `POST /api/copilot/chat` — SSE agent chat with tool calling, thinking indicators, and provider labels
  - `POST /api/copilot/compare` — Compare multiple analyses side by side
  - `POST /api/copilot/reset` — Clears all `tmp/copilot/*.json` cache files and `tmp/uploads/*` uploaded files
- **Copilot cache** — `tmp/copilot/{analysis_id}.json` (keyed by SHA-256 of file content). Cached results return as SSE stream with "Loading cached analysis..." progress.
- **Upload storage** — `tmp/uploads/{analysis_id}_{filename}`. Static mount `/tmp-uploads/` serves uploaded images.
- **SSE error handling** — Entire `progress_stream()` wrapped in try/except; errors sent as `event: error` instead of crashing the stream
- **Frontend copilot components** (`src/components/copilot/`):
  - `CopilotPage.tsx` — Full-page layout: drag-drop upload zone, multi-creative tabs, SSE progress with step-by-step checkmarks, data source warning banner, timing badge, PDF export, reset button
  - `CopilotChat.tsx` — Agent chat with SSE streaming, tool call indicators, suggestion chips, upload-another button
  - `CopilotReport.tsx` — Executive summary card (grade + score), brain score gauges, decay forecast chart (Recharts ComposedChart with fatigue/critical reference lines), 8x8 animated attention heatmap, improvement suggestions, ML recommendation card
- **Frontend types** (`src/types/copilot.ts`):
  - `CopilotAnalysis`, `ChatMessage`, `ComparisonResult`, `BrainScores`, `DecayForecast`, `ExecutiveSummary`, `Improvement`, `AttentionHeatmap`
  - Fields: `is_mock_data`, `total_processing_time`, `step_timings`
- **Frontend API client** (`src/lib/copilotApi.ts`):
  - `copilotAnalyze()` — SSE + JSON fallback for cache hits, error event parsing
  - `copilotChat()` — SSE streaming with onToken/onToolCall/onToolResult/onThinking/onDone/onError callbacks
  - `copilotCompare()` — Multi-analysis comparison
  - `copilotReset()` — POST to `/api/copilot/reset`, returns cleared counts
- **Routing** — NavBar "Copilot" tab, App.tsx renders CopilotPage for `section="copilot"`
- **Print stylesheet** — `@media print` in `index.css` forces white bg, hides chat panel (`print:hidden`), preserves colors
- **Analysis response fields**: `step_timings` (per-step durations), `total_processing_time` (seconds), `is_mock_data` (boolean), `brain_score_source` (tribe_v2|mock|fallback)

### Changed

- **`api_server.py`** — Added `COPILOT_CACHE_DIR`, `COPILOT_UPLOADS_DIR`, `_save_copilot_analysis()`, `_load_copilot_analysis()`, `_run_copilot_analysis()`. Static mount `/tmp-uploads/`.
- **`CopilotPage.tsx`** — Reset button calls `copilotReset()` to clear server temp data, then clears local state
- **`copilotApi.ts`** — SSE error events now throw (not silently swallowed) so frontend shows error cards
- **`index.css`** — Added `@media print` block for PDF export
- **`NavBar.tsx`** — Added "Copilot" navigation tab

### How the Copilot Analysis Flow Works

```
User drops image/video on /copilot
        |
        v
POST /api/copilot/analyze (multipart)
        |
        +-- Cache hit? → SSE: "Loading cached analysis..." → return cached JSON
        |
        +-- Fresh file? → SSE progress stream (7 steps, real timing):
                1. PIL features (19 features: brightness, contrast, edges, symmetry...)
                2. TRIBE V2 brain scores (or mock fallback with is_mock_data=true)
                3. LightGBM v3 boosted prediction (77 features → status + fatigue + perf)
                4. Recommendation (Scale/Monitor/Pivot/Pause + explanation)
                5. Decay forecast (scipy exponential CTR curve + half-life + milestones)
                   + Executive summary (A-F grade + strengths/weaknesses)
                   + Improvement suggestions (priority-ranked, current→target scores)
                6. Attention heatmap (8x8 grid from PIL edge/contrast features)
                7. Build final report → cache → yield done event
        |
        v
Frontend renders: grade card, brain gauges, decay chart, heatmap, improvements, recommendation
```

### How the Agent Chat Works

```
User asks follow-up question
        |
        v
CopilotAgent.chat(message, analyses, history)
        |
        +-- Tool needed? → call_tool(forecast_decay|explain_brain_scores|suggest_improvements|compare_creatives)
        |                    → yield tool_call + tool_result events
        |
        +-- LLM response? → OpenAI GPT-4o (function calling, 3 rounds max)
        |                    → Gemini 2.5 Flash fallback
        |                    → Rule-based fallback
        |
        v
SSE stream: thinking → [tool_call → tool_result]* → text tokens → done
```

### Copilot API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/copilot/analyze` | POST | Upload creative → SSE streaming analysis (7 steps) |
| `/api/copilot/chat` | POST | Agent chat with tool calling (SSE stream) |
| `/api/copilot/compare` | POST | Compare multiple analyses side by side |
| `/api/copilot/reset` | POST | Clear all cached analyses + uploaded files |

---

## [2026-04-26] - One-Click Launch + Auto-Recovery + Cache Indicators

### Summary

Added a `START.bat` one-click launcher and `INSTRUCTIONS FOR DEMO.md` so anyone can demo the project without knowing the architecture. The launcher auto-installs dependencies, trains ML models if missing, starts both backend and frontend, and includes a health monitor that auto-restarts the backend if it crashes. Cached image re-uploads now show `_source: "cached"` in the response.

### Added

- **`START.bat`** (repo root) — One-click launcher:
  - Kills leftover processes, checks Python venv, installs missing pip/npm packages
  - Trains LightGBM v3 boosted models if `models/` is empty
  - Creates `.env` from `.env.example` if missing
  - Starts backend (port 8000) + frontend (port 5173) in separate windows
  - Waits for backend health check (up to 30s) before starting frontend
  - Health monitor loop: every 30s checks if backend is alive, auto-restarts if down
- **`INSTRUCTIONS FOR DEMO.md`** (repo root) — Complete demo guide:
  - Quick start, demo flows (image upload, CSV upload, copilot chat)
  - Architecture diagram, troubleshooting table, manual start fallback
- **`NeuroCreative-copilot/healthcheck.py`** — Backend health check script used by START.bat (avoids inline Python which fails in some shells)
- **Cache `_source: "cached"` indicator** — Both `/api/analyze-creative-image` and `/api/analyze-creative-v2` now set `_source: "cached"` on the creative response when returning a cached result, so the frontend can distinguish fresh vs cached
- **V2 endpoint caching** — `/api/analyze-creative-v2` now checks cache before running the full pipeline, same 5-second fake progress as v1

### Changed

- **`api_server.py`** — Cached image analysis path now sets `creative._source = "cached"` instead of returning the original source. V2 endpoint wraps in cache_exists/cache_load/cache_save flow.
- **`image_features.py`** — Standalone PIL feature extraction module (extracted from inline code in api_server.py)
- **`ml_predictor.py`** — Standalone ML prediction module (extracted from inline code in api_server.py)
- **`copilot_prompts.py`** — System prompt + knowledge base + context builders (extracted from inline code)
- **`video_features.py`** — OpenCV video frame extraction module (for future video analysis)
- **`save_models_for_api.py`** — Trains v3 boosted models and saves .pkl files to `models/`
- **`START.bat`** — Uses `healthcheck.py` instead of inline `-c` Python (fixes "Input redirection not supported" error in some environments)

---

## [2026-04-26] - TRIBE V2 Integration: Real Brain Model + LightGBM V3 Boosted Pipeline

### Summary

Merged the TRIBE V2 neural model and the LightGBM v3 boosted ML pipeline into the live backend. The system now uses **real brain inference scores** from TRIBE V2 (running on Kaggle P100 GPU via cloudflared tunnel) for image analysis, and serves **75 real TRIBE V2 + 1005 LightGBM-imputed** brain scores for the pre-computed CSV dataset. The image analysis pipeline runs: PIL feature extraction (19 features) → TRIBE V2 brain scores → 77-feature LightGBM v3 boosted prediction → recommendation.

### Added

- **`tribe_client.py`** — Remote TRIBE V2 client:
  - Calls TRIBE endpoint via HTTP (httpx or requests, with fallback)
  - Returns brain scores (attention, reward, memory, visualLoad, emotion) + neural_efficiency
  - Falls back to mock scores with `source: mock` if endpoint unavailable
- **`tribe_colab_backend.ipynb`** — Kaggle-ready TRIBE V2 inference notebook:
  - Uses cloudflared tunnel (ngrok blocked on Kaggle)
  - numpy 2.0.2 pin with auto-restart to avoid dependency conflicts
  - ffmpeg install for video support
  - Keep-alive cell for long demo sessions
- **`pipeline_logger.py`** — Structured rotating log system:
  - Rotating file handler (`logs/pipeline.log`, 5MB rotation, 3 backups)
  - Console + file output, `StepTimer` context manager for timing
- **`cache_manager.py`** — Hash-based JSON cache with `_NumpyEncoder`:
  - Caches analysis results in `tmp/cache/` keyed by file hash
  - `_NumpyEncoder` handles numpy float32/int64/ndarray JSON serialization
- **Trained ML models** (`models/`):
  - `status_classifier.pkl` — LGBMClassifier (4-class: top_performer, stable, fatigued, underperformer, 932 KB)
  - `fatigue_regressor.pkl` — LGBMRegressor for fatigue_probability (95 KB)
  - `perf_regressor.pkl` — LGBMRegressor for perf_score (238 KB)
  - `label_encoders.pkl` — 13 LabelEncoder objects for categorical features (4 KB)
  - `model_metadata.pkl` — Feature names + metadata (2 KB)
- **`POST /api/analyze-creative-image`** — SSE streaming image analysis:
  - Accepts image upload, runs full analysis pipeline
  - Streams 7 progress events (PIL features, TRIBE brain, ML prediction, etc.) + final result
  - Caches results in `tmp/cache/` for instant reload
  - Cached results show 5-second progress animation then load instantly
- **`POST /api/analyze-creative-v2`** — Full 77-feature ML analysis + optional GPT-4o vision
- **`extract_pil_features()`** in `api_server.py`:
  - 19 PIL image features: brightness, contrast, saturation, color stats, edge density, symmetry, aspect ratio, etc.
  - Pure PIL/numpy, always works
- **`predict_creative()`** in `api_server.py`:
  - Constructs full 77-feature vector (creative design + campaign + categoricals + TRIBE brain + PIL + country flags + interactions)
  - Runs trained LightGBM v3 boosted models when available
  - Falls back to neural efficiency heuristic (lower brain activation = better performance)
- **`_predict_with_models()`** — Loads trained models via joblib (lazy cached), runs 3-model prediction
- **`_predict_neural_efficiency()`** — Heuristic: neural efficiency ~50 - 0.3 × avg_brain_score (top performers ~36/100)
- **`build_copilot_context()`** + `SYSTEM_PROMPT`** — GPT-4o multimodal vision analysis context
- **`_json_serialize()`** — JSON serialization with numpy type handling for SSE responses
- **`_build_fallback_response()`** — Clean fallback when entire analysis pipeline fails

### Changed

- **`data/brain_features.csv`** — Replaced with TRIBE V2 integrated version:
  - 1080 rows: 75 `tribe_v2` source (real TRIBE inference) + 1005 `imputed` source (LightGBM)
  - Columns: `attention_score_real`, `reward_score_real`, `memory_score_real`, `emotion_score_real`, `visual_load_score_real`, `brain_score_source`
- **`data/model_outputs.csv`** — Replaced with v3 boosted predictions (TRIBE-informed explanations)
- **`data/ml_predictions.csv`** — Replaced with v3 boosted ML predictions with `perf_score_predicted`
- **`data/neural_cache_top_bottom.csv`** — Added: 75 real TRIBE V2 scores (25 top + 25 avg + 25 bottom performers)
- **`api_server.py`** — Major changes:
  - PRELOADED now tracks `brain_score_source` per creative (`tribe_v2` | `imputed`)
  - `build_creative_row()` includes `brain_score_source` and `_ml_source` in response
  - `_run_fresh_analysis()` converted to async generator yielding SSE progress events
  - All `json.dumps()` calls for data output use `_json_serialize()` with numpy support
  - Model loading via `_MODELS_CACHE` (lazy joblib load, cached across requests)
- **`cache_manager.py`** — Added `_NumpyEncoder` for numpy float32/int64/ndarray serialization
- **Frontend `UploadCampaignData.tsx`**:
  - SSE progress banner with animated step icons for image analysis
  - Cached vs fresh state handling
  - Multi-file CSV + image upload flow

### How Image Analysis Works Now

```
User uploads image (PNG/JPG)
        |
        v
Hash file → check cache
        |
        +-- Cached? → 5s progress animation → return cached result
        |
        +-- Fresh? → Run pipeline:
                1. extract_pil_features()     → 19 features (brightness, edges, saturation...)
                2. TRIBE V2 (Kaggle P100)      → 5 brain scores + neural_efficiency
                3. predict_creative()           → Build 77-feature vector
                   ├── _predict_with_models()   → LightGBM v3 boosted (status + fatigue + perf)
                   └── _predict_neural_efficiency() → Heuristic fallback
                4. Generate recommendation + explanation
                5. Cache result in tmp/cache/
                → Stream 7 progress events + done event via SSE
```

### How CSV Upload Works Now

```
User uploads master_creatives.csv (1080 rows)
        |
        v
Match creative_ids against pre-computed data
        |
        v
Serve results with brain_score_source:
  - 75 creatives: "tribe_v2" (real TRIBE V2 brain inference)
  - 1005 creatives: "imputed" (LightGBM v3 boosted prediction)
```

### ML Model Details

| Model | Type | Features | Accuracy/Metric |
|-------|------|----------|-----------------|
| `status_classifier.pkl` | LGBMClassifier (4-class) | 77 | 76.4% accuracy |
| `fatigue_regressor.pkl` | LGBMRegressor | 77 | Fatigue probability (0-1) |
| `perf_regressor.pkl` | LGBMRegressor | 77 | Performance score (0-100) |

**77 features**: creative design (text_density, clutter_score, motion_score...), campaign (budget, objective, is_video), 13 encoded categoricals, binary attributes, TRIBE V2 brain scores (`*_real`), 17 PIL image features, 10 country flags, 12 interaction features.

### Key Finding: Neural Efficiency

Lower brain activation correlates with better creative performance (correlation -0.24 to -0.27). Top performers average ~36/100 neural activation, underperformers ~50/100. This drives the heuristic fallback.

### Dependencies Added

| Package | Purpose |
|---------|---------|
| `scipy` | Required for decay curve fitting (was optional) |
| `scikit-learn` | Required for trained model preprocessing (was optional) |
| `lightgbm` | Required for v3 boosted models (was optional) |
| `joblib` | Model loading (comes with scikit-learn) |
| `Pillow` | PIL image feature extraction (new) |
| `httpx` | TRIBE V2 client HTTP calls (optional, falls back to requests) |

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
