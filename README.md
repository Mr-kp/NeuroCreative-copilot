# NeuroCreative Copilot

**AI-powered creative intelligence for mobile advertisers.**

NeuroCreative Copilot analyzes ad creatives through a brain-inspired cognitive lens and tells marketers whether to **Scale, Monitor, Pivot, or Pause** each creative — backed by ML fatigue prediction, CTR decay modeling, and neuro-inspired attention/reward/memory scoring.

Built for the **Smadex Creative Intelligence Challenge** at HackUPC 2026.

---

## Quick Start

### Option A: One-Click Launch (Recommended)

```bat
:: From the repo root (one folder up from this README):
START.bat
```

Open **http://localhost:5173**. Done. The script handles everything.

### Option B: Manual Start

```bash
# 1. Install Python dependencies
pip install fastapi uvicorn python-multipart sse-starlette pandas numpy scipy scikit-learn lightgbm Pillow joblib

# 2. (Optional) Add LLM keys for smarter copilot answers + TRIBE endpoint
cp .env.example .env
# Edit .env: OPENAI_API_KEY, GOOGLE_API_KEY, TRIBE_ENDPOINT

# 3. Start backend (port 8000)
python api_server.py

# 4. Start frontend (port 5173)
cd dashboard/artifacts/neurocreative
npm install
npm run dev:frontend
```

See **`INSTRUCTIONS FOR DEMO.md`** (repo root) for full demo guide.

---

## What It Does

1. **Upload** raw Smadex CSV files (creative_summary, creatives, campaigns, advertisers, daily_stats)
2. **Pipeline runs live**: joins tables, extracts brain features, fits decay curves, trains ML model, generates recommendations
3. **Or upload a creative image/video** on the Copilot page: TRIBE V2 brain inference + LightGBM v3 prediction → executive summary (A-F grade) + brain scores + decay forecast + heatmap + improvements
4. **Dashboard** shows 1080 creatives with KPIs, brain scores, MRI visualization, fatigue risk, and action recommendations
5. **Copilot chat** answers follow-up questions about any creative via streaming AI agent with 4 analysis tools

### Upload Modes

| What you upload | What happens |
|-----------------|-------------|
| All 5 Smadex CSVs | Full live pipeline: decay curves + ML predictions + brain features + recommendations |
| Just creative_summary.csv | Pipeline with heuristic decay, ML predictions from available columns |
| Single CSV with creative_ids | Fast match against pre-computed data (75 real TRIBE V2 + 1005 imputed) |
| Creative image/video (Copilot page) | TRIBE V2 brain scores + PIL features → 77-feature LightGBM v3 → executive summary (A-F grade) + brain scores + decay forecast + heatmap + improvements + agent chat |

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

  Creative (image/video)       Copilot Pipeline                    Copilot Page
  ┌──────────────────┐     ┌────────────────────────────────┐     ┌──────────────────┐
  │ apple_ad.png      │     │ POST /api/copilot/analyze      │     │                  │
  │ nike_ad.png       │────>│  PIL → TRIBE → ML → heatmap   │────>│  Grade card (A-F) │
  │ any creative      │     │  → decay → summary → recs     │     │  Brain gauges     │
  └──────────────────┘     │                                │     │  Decay chart      │
                             │ POST /api/copilot/chat         │     │  Heatmap          │
  Follow-up questions ─────>│  CopilotAgent (4 tools)        │────>│  Improvements     │
                             │  GPT-4o → Gemini → rule-based  │     │  Agent chat       │
                             └────────────────────────────────┘     └──────────────────┘
```

### Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Python, FastAPI, SSE-Starlette, pandas, numpy, scipy, scikit-learn, LightGBM |
| Frontend | React 19, Vite 6, TypeScript 5.9, Tailwind CSS 4, shadcn/ui, Recharts |
| Copilot LLM | OpenAI GPT-4o (primary) / Google Gemini 2.5 Flash (fallback) / rule-based (no-key fallback) |
| ML | LightGBM v3 boosted (status classifier 76.4% + fatigue regressor + perf regressor, 77 features) |
| Brain Scoring | TRIBE V2 neural model (Kaggle P100 GPU) + LightGBM-imputed + heuristic formulas |
| Streaming | Server-Sent Events (SSE) for real-time copilot responses + image analysis progress |
| Caching | Hash-based JSON cache (`tmp/cache/`) with numpy serialization |

### AI/ML Models

| Model | What it does | Required? |
|-------|-------------|-----------|
| **TRIBE V2** | Real neural brain encoding model (attention, reward, memory, emotion, visualLoad) | Optional (Kaggle GPU + `TRIBE_ENDPOINT` in `.env`) |
| **LightGBM v3 Status** | Predicts creative status: top_performer / stable / fatigued / underperformer (76.4% acc) | Optional (heuristic fallback) |
| **LightGBM v3 Fatigue** | Predicts continuous fatigue probability (0-1) | Optional (heuristic fallback) |
| **LightGBM v3 Perf** | Predicts performance score (0-100) | Optional (neural efficiency fallback) |
| **OpenAI GPT-4o-mini** | Generates copilot chat answers about creatives | Optional (`.env` key) |
| **Google Gemini 2.0 Flash** | Alternative copilot LLM | Optional (`.env` key) |
| **scipy curve_fit** | Fits exponential CTR decay curves per creative | Optional (linear fallback) |
| **Custom brain formulas** | Computes attention, reward, memory, emotion, visual_load from visual metadata | Always works (numpy only) |

---

## Project Structure

```
NeuroCreative-copilot/
  api_server.py              FastAPI backend — upload, copilot SSE, image analysis, asset serving
  pipeline_runner.py         Live pipeline — detect tables, run analysis, generate outputs
  copilot_agent.py           Copilot agent — 4 tools, executive summary, heatmap, multi-LLM
  image_features.py          PIL feature extraction (19 features: brightness, contrast, edges, symmetry...)
  ml_predictor.py            Pre-trained LightGBM v3 boosted predictions (77 features)
  copilot_prompts.py         System prompt + neuroscience knowledge base + context builders
  video_features.py          OpenCV video frame extraction (for video analysis)
  tribe_client.py            Remote TRIBE V2 client (Kaggle GPU via cloudflared)
  cache_manager.py           Hash-based JSON cache with numpy serialization
  pipeline_logger.py         Structured rotating log (logs/pipeline.log)
  healthcheck.py             Backend health check script (used by START.bat)
  data/                      Pre-computed pipeline outputs (TRIBE V2 integrated)
  models/                    Trained LightGBM v3 boosted models (77 features)
  assets/                    Creative images (apple_ad.png, nike_ad.png, etc.)
  tmp/cache/                 Cached analysis results (JSON, keyed by file hash)
  tmp/copilot/               Copilot analysis cache (JSON, keyed by file hash)
  tmp/uploads/               Copilot uploaded files (static mount /tmp-uploads/)
  pipeline/
    creative_intelligence/   Original 7-step pipeline scripts (offline, re-runnable)
    time_decay/              Alternative XGBoost AFT survival pipeline
    backend_api.py           Standalone TRIBE v2 live inference server (GPU/Colab)
  dashboard/
    artifacts/neurocreative/ React/Vite frontend dashboard
  INTEGRATION.md             Full architecture documentation
  CHANGELOG.md               Detailed change history

../
  START.bat                  One-click launcher (auto-installs, starts everything, auto-restarts)
  INSTRUCTIONS FOR DEMO.md   Complete demo guide
  creative_intelligence_pipeline/  ML pipeline scripts + data + charts + docs
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

### `POST /api/analyze-creative-image`
- **Input**: Multipart form with `file` (PNG/JPG image)
- **Output**: SSE stream with 7 progress events + final analysis result
- **Pipeline**: PIL features → TRIBE V2 brain → LightGBM v3 boosted → recommendation

### `POST /api/ask-copilot`
- **Input**: JSON `{ question, selectedCreative, dashboardContext }`
- **Output**: SSE stream — token events + final structured response
- **Logic**: Context-aware answers from pipeline data

### `POST /api/copilot/analyze`
- **Input**: Multipart form with `file` (image or video)
- **Output**: SSE stream — 7 progress steps with real timing + final `CopilotAnalysis`
- **Report includes**: Executive summary (A-F grade), brain scores, decay forecast chart, attention heatmap, improvements, ML recommendation
- **Features**: Caching in `tmp/copilot/`, `is_mock_data` flag, `total_processing_time`, `step_timings`

### `POST /api/copilot/chat`
- **Input**: JSON `{ message, analysis_ids, history }`
- **Output**: SSE stream — thinking/tool_call/tool_result/token/done events
- **Agent tools**: forecast_decay, explain_brain_scores, suggest_improvements, compare_creatives

### `POST /api/copilot/compare`
- **Input**: JSON `{ analysis_ids }` (min 2)
- **Output**: JSON comparison with winner, insights, dimension breakdown

### `POST /api/copilot/reset`
- **Output**: JSON `{ ok, cleared_cache, cleared_uploads }`
- **Logic**: Deletes all `tmp/copilot/*.json` and `tmp/uploads/*` files

### `GET /assets/{filename}`
- Serves creative PNG images

---

## Branches

| Branch | Content |
|--------|---------|
| `main` | Base: README + TRIBE v2 notebook |
| `EDA` | 4 Jupyter notebooks, master table, daily fatigue, insights |
| `WEB` | React dashboard (standalone, pre-integration) |
| `integration` | **Current**: Full stack with TRIBE V2, live pipeline, trained ML, SSE streaming copilot |

---

## License

Hackathon project — Smadex Creative Intelligence Challenge, HackUPC 2026.
