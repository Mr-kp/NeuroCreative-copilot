import type { CsvRow } from "./parseCsv.js";
import type { MatchedAsset } from "./matchAssets.js";
import { getOpenAIClient, getModel } from "./openaiClient.js";
import {
  validateDashboardResponse,
  type DashboardResponse,
} from "./validateDashboardResponse.js";
import type OpenAI from "openai";

// ─── Image helpers ─────────────────────────────────────────────────────────

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "webp", "gif"]);

function isImageAsset(asset: MatchedAsset): boolean {
  return IMAGE_EXTS.has(asset.ext);
}

function toBase64DataUrl(asset: MatchedAsset): string {
  const base64 = asset.buffer.toString("base64");
  return `data:${asset.mimetype};base64,${base64}`;
}

// ─── Prompt construction ───────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an AI creative intelligence analyst for a mobile advertising platform.

You analyze uploaded ad creatives and CSV performance data.

Your job is to generate a complete dashboard-ready JSON response for NeuroCreative Copilot.

Inputs may include:
- CSV performance rows
- creative metadata
- image/video/gif filenames
- image files when available
- asset paths
- campaign info
- advertiser info
- country
- OS
- date/time-series data

You must generate:
1. KPI dashboard summary
2. Creative status for each creative
3. Creative ranking
4. Fatigue risk
5. Recommended action: Scale, Monitor, Pivot, Pause
6. Creative health score
7. Brain-inspired cognitive scores
8. 2D MRI-style heatmap intensity values
9. Plain-English explanation
10. Key reasons
11. Next best creative test
12. AI Copilot default answers
13. Chart annotations
14. Portfolio recommendations

Rules:
- Return only valid JSON.
- No markdown.
- No text outside JSON.
- Do not claim real brain scanning.
- Do not say "we read the brain."
- Do not say "real MRI."
- Use "brain-inspired," "predicted cognitive response," and "estimated neural activation."
- Treat the MRI visualization as an explainability layer, not a medical or neuroscience measurement.
- If raw metrics exist, use them.
- If CTR/CVR/ROAS are missing but clicks/impressions/conversions/spend/revenue exist, infer them.
- If data is missing, use null or "Unknown."
- Recommendations must be advertiser-facing and actionable.

Decision logic:
- Scale if CTR, CVR, and ROAS are strong and fatigue risk is low.
- Monitor if performance is stable and risk is moderate or low.
- Pivot if performance started strong but declined or fatigue risk is high.
- Pause if spend is high and CTR/CVR/ROAS are weak.

Brain-inspired logic:
- Attention is influenced by CTR, CTA clarity, novelty, and visual salience.
- Reward is influenced by CVR, ROAS, offer strength, gameplay, discounts, or price signals.
- Memory is influenced by brand visibility, readability, repetition, and clarity.
- Visual Load is influenced by text density, clutter, and creative complexity.
- Emotion is influenced by tone, faces, urgency, strong colors, and emotional cues.

MRI activity:
Convert cognitive scores into 0–100 intensity values:
- attention_intensity
- reward_intensity
- memory_intensity
- visual_load_intensity
- emotion_intensity

The frontend will render these as pink-coded MRI heatmap regions.

Return the JSON in exactly this shape:
{
  "dashboard_summary": {
    "total_spend": { "value": "", "trend": "", "interpretation": "" },
    "impressions": { "value": "", "trend": "", "interpretation": "" },
    "ctr": { "value": "", "trend": "", "interpretation": "" },
    "cvr": { "value": "", "trend": "", "interpretation": "" },
    "roas": { "value": "", "trend": "", "interpretation": "" },
    "fatigued_creatives": { "value": "", "trend": "", "interpretation": "" }
  },
  "creatives": [
    {
      "creative_id": "",
      "campaign_id": "",
      "advertiser_id": "",
      "asset_filename": "",
      "asset_type": "image | video | gif | unknown",
      "status": "Top Performer | Stable | Fatigued | Underperformer",
      "recommended_action": "Scale | Monitor | Pivot | Pause",
      "confidence": 0,
      "creative_health_score": 0,
      "fatigue_risk": 0,
      "rank": 0,
      "ctr": 0, "cvr": 0, "roas": 0, "spend": 0, "impressions": 0,
      "brain_scores": { "attention": 0, "reward": 0, "memory": 0, "visualLoad": 0, "emotion": 0 },
      "mri_activity": {
        "attention_intensity": 0, "reward_intensity": 0, "memory_intensity": 0,
        "visual_load_intensity": 0, "emotion_intensity": 0, "dominant_region": ""
      },
      "cognitive_summary": {
        "dominant_signal": "", "cognitive_load": "Low | Medium | High",
        "predicted_engagement": "Weak | Moderate | Strong", "fatigue_sensitivity": "Low | Medium | High"
      },
      "explanation": "",
      "key_reasons": ["", "", ""],
      "next_best_test": "",
      "copilot_answers": {
        "why_fatigued": "", "what_to_change": "", "scale_or_pause": "",
        "ios_vs_android": "", "summary": ""
      },
      "chart_annotations": [{ "day": "", "label": "", "reason": "" }]
    }
  ],
  "portfolio_recommendations": ["", "", ""]
}`;

// ─── Main analysis function ────────────────────────────────────────────────

export async function analyzeWithOpenAI(
  csvRows: CsvRow[],
  matchedAssets: MatchedAsset[]
): Promise<DashboardResponse> {
  const client = getOpenAIClient();
  const model = getModel();

  // Group assets by creative_id
  const assetsByCreative = new Map<string, MatchedAsset[]>();
  for (const asset of matchedAssets) {
    const list = assetsByCreative.get(asset.creative_id) || [];
    list.push(asset);
    assetsByCreative.set(asset.creative_id, list);
  }

  // Build compact creative summaries for the prompt
  const creativeSummaries = csvRows.map((row) => {
    const assets = assetsByCreative.get(row.creative_id) || [];
    return {
      ...row,
      matched_assets: assets.map((a) => ({
        filename: a.filename,
        type: a.mimetype,
        match_type: a.matchType,
      })),
    };
  });

  // Build the user message content parts
  const contentParts: OpenAI.ChatCompletionContentPart[] = [];

  // Text part: CSV data summary
  contentParts.push({
    type: "text" as const,
    text: `Analyze these ${csvRows.length} creatives from the uploaded CSV data:\n\n${JSON.stringify(creativeSummaries, null, 2)}`,
  });

  // Image parts: send actual images to OpenAI vision
  for (const asset of matchedAssets) {
    if (isImageAsset(asset) && asset.buffer.length < 20 * 1024 * 1024) {
      // Under 20MB limit
      contentParts.push({
        type: "image_url" as const,
        image_url: {
          url: toBase64DataUrl(asset),
          detail: "low", // Use low detail to save tokens
        },
      });
      contentParts.push({
        type: "text" as const,
        text: `[Image above is asset "${asset.filename}" matched to creative "${asset.creative_id}"]`,
      });
    }
  }

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: contentParts },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
    max_tokens: 16000,
  });

  const rawContent = response.choices[0]?.message?.content;
  if (!rawContent) {
    throw new Error("OpenAI returned an empty response.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error(
      `OpenAI returned invalid JSON. First 500 chars: ${rawContent.slice(0, 500)}`
    );
  }

  // Validate with Zod
  return validateDashboardResponse(parsed);
}
