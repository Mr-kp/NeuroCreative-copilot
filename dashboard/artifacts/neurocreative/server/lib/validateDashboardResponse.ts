import { z } from "zod";

// ─── Sub-schemas ───────────────────────────────────────────────────────────

const kpiCardSchema = z.object({
  value: z.union([z.string(), z.number()]),
  trend: z.string(),
  interpretation: z.string(),
});

const dashboardSummarySchema = z.object({
  total_spend: kpiCardSchema,
  impressions: kpiCardSchema,
  ctr: kpiCardSchema,
  cvr: kpiCardSchema,
  roas: kpiCardSchema,
  fatigued_creatives: kpiCardSchema,
});

const brainScoresSchema = z.object({
  attention: z.number().min(0).max(100),
  reward: z.number().min(0).max(100),
  memory: z.number().min(0).max(100),
  visualLoad: z.number().min(0).max(100),
  emotion: z.number().min(0).max(100),
});

const mriActivitySchema = z.object({
  attention_intensity: z.number().min(0).max(100),
  reward_intensity: z.number().min(0).max(100),
  memory_intensity: z.number().min(0).max(100),
  visual_load_intensity: z.number().min(0).max(100),
  emotion_intensity: z.number().min(0).max(100),
  dominant_region: z.string(),
});

const cognitiveSummarySchema = z.object({
  dominant_signal: z.string(),
  cognitive_load: z.enum(["Low", "Medium", "High"]),
  predicted_engagement: z.enum(["Weak", "Moderate", "Strong"]),
  fatigue_sensitivity: z.enum(["Low", "Medium", "High"]),
});

const copilotAnswersSchema = z.object({
  why_fatigued: z.string(),
  what_to_change: z.string(),
  scale_or_pause: z.string(),
  ios_vs_android: z.string(),
  summary: z.string(),
});

const chartAnnotationSchema = z.object({
  day: z.union([z.string(), z.number()]),
  label: z.string(),
  reason: z.string(),
});

const analyzedCreativeSchema = z.object({
  creative_id: z.string(),
  campaign_id: z.union([z.string(), z.number(), z.null()]).optional(),
  advertiser_id: z.union([z.string(), z.number(), z.null()]).optional(),
  asset_filename: z.string().optional().default(""),
  asset_type: z.enum(["image", "video", "gif", "unknown"]).optional().default("unknown"),
  status: z.enum(["Top Performer", "Stable", "Fatigued", "Underperformer"]),
  recommended_action: z.enum(["Scale", "Monitor", "Pivot", "Pause"]),
  confidence: z.number().min(0).max(100),
  creative_health_score: z.number().min(0).max(100),
  fatigue_risk: z.number().min(0).max(100),
  rank: z.number(),
  ctr: z.number().optional().default(0),
  cvr: z.number().optional().default(0),
  roas: z.number().optional().default(0),
  spend: z.number().optional().default(0),
  impressions: z.number().optional().default(0),
  brain_scores: brainScoresSchema,
  mri_activity: mriActivitySchema,
  cognitive_summary: cognitiveSummarySchema,
  explanation: z.string(),
  key_reasons: z.array(z.string()),
  next_best_test: z.string(),
  copilot_answers: copilotAnswersSchema,
  chart_annotations: z.array(chartAnnotationSchema).optional().default([]),
});

// ─── Top-level schema ──────────────────────────────────────────────────────

export const dashboardResponseSchema = z.object({
  dashboard_summary: dashboardSummarySchema,
  creatives: z.array(analyzedCreativeSchema).min(1),
  portfolio_recommendations: z.array(z.string()).optional().default([]),
});

export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;
export type AnalyzedCreative = z.infer<typeof analyzedCreativeSchema>;

// ─── Copilot response schema ──────────────────────────────────────────────

export const copilotResponseSchema = z.object({
  answer: z.string(),
  suggested_action: z.enum(["Scale", "Monitor", "Pivot", "Pause", "None"]),
  confidence: z.number().min(0).max(100),
  supporting_points: z.array(z.string()).optional().default([]),
  follow_up_questions: z.array(z.string()).optional().default([]),
});

export type CopilotResponse = z.infer<typeof copilotResponseSchema>;

// ─── Validation helpers ────────────────────────────────────────────────────

export function validateDashboardResponse(data: unknown): DashboardResponse {
  return dashboardResponseSchema.parse(data);
}

export function validateCopilotResponse(data: unknown): CopilotResponse {
  return copilotResponseSchema.parse(data);
}
