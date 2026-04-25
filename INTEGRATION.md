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
  data/                      # Pre-computed pipeline outputs
    master_creatives.csv     # 1080 creatives with full metadata + KPIs
    model_outputs.csv        # predicted_status, fatigue_probability, recommendation, explanation
    brain_features.csv       # attention, reward, memory, emotion, visual_load scores
    daily_fatigue_table.csv  # 52350 daily rows with CTR/CVR/ROAS time series
  dashboard/
    artifacts/
      neurocreative/         # React/Vite frontend dashboard
        src/
          components/        # UI components (shadcn/ui based)
          data/smadexData.ts # Demo data (fallback when no CSV uploaded)
          lib/apiClient.ts   # API client (upload + SSE streaming copilot)
          types/dashboard.ts # TypeScript interfaces
        server/              # Original Express server (now replaced by api_server.py)
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

The pipeline lives at `../creative_intelligence_pipeline/` and was run offline before the demo. It produces the 4 CSVs that `api_server.py` loads at startup.

```
Smadex Raw CSVs
       │
       v
 1. data_pipeline.py          → master_creatives.csv (join all tables)
 2. brain_features.py         → brain_features.csv (attention, reward, memory, emotion, visual_load)
 3. decay_analysis.py         → decay_features.csv (CTR curve fitting via scipy)
 4. survival_analysis.py      → cox_hazard_ratios.csv (Kaplan-Meier + Cox PH)
 5. ml_models.py              → ml_predictions.csv (LightGBM + SHAP feature importance)
 6. recommendation_engine.py  → model_outputs.csv (Scale/Monitor/Pivot/Pause + explanations)
 7. integrate_tribe_v2.py     → Enhanced predictions with TRIBE neural features (optional)
```

### Pipeline Script Dependencies

| Script | Input | Output | Key Libraries |
|--------|-------|--------|---------------|
| `data_pipeline.py` | Smadex CSVs | `master_creatives.csv` | pandas, numpy |
| `brain_features.py` | `master_creatives.csv` | `brain_features.csv` | pandas, numpy |
| `decay_analysis.py` | `daily_fatigue_table.csv`, `master_creatives.csv` | `decay_features.csv` | pandas, scipy, sklearn |
| `survival_analysis.py` | `master_creatives.csv` | `cox_hazard_ratios.csv` | pandas, lifelines, sklearn |
| `ml_models.py` | `master_creatives.csv`, `decay_features.csv` | `ml_predictions.csv` | lightgbm, shap, sklearn |
| `recommendation_engine.py` | `master_creatives.csv`, `decay_features.csv`, `ml_predictions.csv`, `cox_hazard_ratios.csv` | `model_outputs.csv` | pandas, numpy |

### Brain Feature Formula (fallback, no TRIBE needed)

When TRIBE v2 is not available, brain scores are computed from visual metadata:

- **Attention** = 0.40*motion + 0.30*novelty + 0.20*clutter + 0.10*has_duration
- **Reward** = 0.30*brand_visibility + 0.25*has_discount + 0.25*has_price + 0.20*product_count
- **Memory** = 0.35*readability + 0.25*(1-text_density) + 0.25*brand_visibility + 0.15*novelty
- **Emotion** = weighted combination of emotional_tone encoding + visual features
- **Visual Load** = 0.35*clutter + 0.30*text_density + 0.20*product_count + 0.15*(1/readability)

---

## Related Files Outside This Repo

These live in the parent `neuralad/` directory:

| Path | Purpose |
|------|---------|
| `Smadex_Creative_Intelligence_Dataset_FULL/` | Raw dataset: CSVs + 1080 creative PNGs |
| `creative_intelligence_pipeline/` | Offline pipeline scripts + output CSVs + charts |
| `Time_Decay_Pipeline_Files/` | Alternative pipeline using XGBoost AFT survival models |
| `backend_api.py` | Lightweight FastAPI that runs TRIBE v2 live on uploaded images |
| `colab_backend.ipynb` | Colab notebook that exposes `backend_api.py` via ngrok |
| `TRIBE_V2_Colab_Inference.ipynb` | Standalone TRIBE v2 batch inference on creative assets |
| `tribe_demo_v8.ipynb` | TRIBE v2 official demo notebook |

The API server references `../Smadex_Creative_Intelligence_Dataset_FULL/assets/` to serve creative images.

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
