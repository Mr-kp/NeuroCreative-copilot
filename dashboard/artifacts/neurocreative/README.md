# NeuroCreative Copilot Dashboard

NeuroCreative Copilot is an AI-powered creative intelligence dashboard built for mobile advertising platforms. It allows teams to upload campaign performance data and ad creatives to generate rich, brain-inspired cognitive scores and actionable recommendations.

## Features

- **Upload Pipeline:** Easily drop a campaign performance CSV alongside your ad creatives (images/videos).
- **AI Analysis:** Automatically parses and analyzes the uploaded assets with the OpenAI API.
- **Cognitive Visualization:** A 2D MRI-style heatmap showing the predicted cognitive responses (Attention, Reward, Memory, Visual Load, Emotion) for each ad.
- **Copilot Action Center:** Dynamically prioritizes which ad creatives require immediate attention (Scale, Monitor, Pivot, Pause).
- **Interactive Chat Assistant:** An "Ask Copilot" drawer provides specific insights and answers questions dynamically using OpenAI for the currently selected creative.
- **Professional Aesthetics:** Premium UI with a curated light/dark mode and responsive design system.

## Project Architecture

This repository uses a full-stack architecture running simultaneously via `concurrently`:
- **Frontend:** React + TypeScript + Vite + Tailwind CSS.
- **Backend:** Express + Node.js (proxied automatically via Vite in dev mode).

## Quick Start

### 1. Configure the Environment
Copy the `.env.example` file to create a `.env` file:
```bash
cp .env.example .env
```
Add your OpenAI API key to the newly created `.env` file:
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

### 2. Install Dependencies
Make sure you have Node installed, then run:
```bash
npm install
```

### 3. Run the App
Launch both the frontend and backend servers concurrently:
```bash
npm run dev
```

The frontend will be available at [http://localhost:5173](http://localhost:5173).
The backend will run on `http://localhost:3001`.

## Using the Dashboard

1. **Demo Data**: Out of the box, the dashboard loads a curated set of synthetic fallback data so you can explore the UI immediately.
2. **Analysis Mode**: Click "Analyze with OpenAI" inside the "Upload campaign data" section to drop your own CSV files and assets. 
3. **Ask Copilot**: Once data is analyzed (or in demo mode), select a creative from the Action Center and open the **Ask Copilot** drawer to explore performance details via conversational AI.
