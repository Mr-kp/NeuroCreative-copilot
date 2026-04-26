// ─── Dashboard Response (from OpenAI analysis) ────────────────────────────

export interface KpiCardData {
  value: string | number;
  trend: string;
  interpretation: string;
}

export interface DashboardSummary {
  total_spend: KpiCardData;
  impressions: KpiCardData;
  ctr: KpiCardData;
  cvr: KpiCardData;
  roas: KpiCardData;
  fatigued_creatives: KpiCardData;
}

export interface BrainScoresData {
  attention: number;
  reward: number;
  memory: number;
  visualLoad: number;
  emotion: number;
}

export interface MriActivity {
  attention_intensity: number;
  reward_intensity: number;
  memory_intensity: number;
  visual_load_intensity: number;
  emotion_intensity: number;
  dominant_region: string;
}

export interface CognitiveSummary {
  dominant_signal: string;
  cognitive_load: "Low" | "Medium" | "High";
  predicted_engagement: "Weak" | "Moderate" | "Strong";
  fatigue_sensitivity: "Low" | "Medium" | "High";
}

export interface CopilotAnswers {
  why_fatigued: string;
  what_to_change: string;
  scale_or_pause: string;
  ios_vs_android: string;
  summary: string;
}

export interface ChartAnnotation {
  day: string | number;
  label: string;
  reason: string;
}

export interface AnalyzedCreative {
  creative_id: string;
  campaign_id?: string | number | null;
  advertiser_id?: string | number | null;
  asset_filename?: string;
  asset_type?: "image" | "video" | "gif" | "unknown";
  status: "Top Performer" | "Stable" | "Fatigued" | "Underperformer";
  recommended_action: "Scale" | "Monitor" | "Pivot" | "Pause";
  confidence: number;
  creative_health_score: number;
  fatigue_risk: number;
  rank: number;
  ctr: number;
  cvr: number;
  roas: number;
  spend: number;
  impressions: number;
  brain_scores: BrainScoresData;
  mri_activity: MriActivity;
  cognitive_summary: CognitiveSummary;
  explanation: string;
  key_reasons: string[];
  next_best_test: string;
  copilot_answers: CopilotAnswers;
  chart_annotations: ChartAnnotation[];
}

export interface DashboardResponse {
  dashboard_summary: DashboardSummary;
  creatives: AnalyzedCreative[];
  portfolio_recommendations: string[];
}

// ─── Copilot Response (from Ask Copilot endpoint) ──────────────────────────

export interface CopilotApiResponse {
  answer: string;
  suggested_action: "Scale" | "Monitor" | "Pivot" | "Pause" | "None";
  confidence: number;
  supporting_points: string[];
  follow_up_questions: string[];
}
