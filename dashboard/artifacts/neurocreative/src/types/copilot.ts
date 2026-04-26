export interface BrainScores {
  attention: number;
  reward: number;
  memory: number;
  visualLoad: number;
  emotion: number;
}

export interface MLPrediction {
  status: string;
  fatigue_probability: number;
  performance_score: number;
  model_source: string;
  initial_ctr: number;
}

export interface DecayForecast {
  initial_ctr: number;
  decay_rate: number;
  half_life_days: number;
  fatigue_onset_day: number | null;
  critical_day: number | null;
  projected: { day: number; ctr: number }[];
  milestones: { day: number; label: string; ctr: number }[];
}

export interface ExecutiveSummary {
  grade: string;
  overall_score: number;
  top_actions: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface Improvement {
  area: string;
  priority: "high" | "medium" | "low";
  action: string;
  current_score: number;
  target_score: number;
}

export interface AttentionHeatmap {
  grid: number[][];
  hotspots: { x: number; y: number; intensity: number }[];
}

export interface CopilotAnalysis {
  id: string;
  timestamp: string;
  filename: string;
  file_type: "image" | "video";
  file_size: number;
  brain_scores: BrainScores;
  brain_score_source: string;
  ml_prediction: MLPrediction;
  recommendation: {
    action: string;
    explanation: string;
    confidence: number;
  };
  decay_forecast: DecayForecast;
  executive_summary: ExecutiveSummary;
  improvements: Improvement[];
  attention_heatmap: AttentionHeatmap;
  image_features: Record<string, number>;
  cached?: boolean;
  is_mock_data?: boolean;
  total_processing_time?: number;
  step_timings?: Record<string, number>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: number;
  toolCalls?: { name: string; label: string }[];
  isError?: boolean;
}

export interface ComparisonResult {
  creatives: {
    id: string;
    filename: string;
    grade: string;
    overall_score: number;
    brain_scores: BrainScores;
    status: string;
    fatigue_probability: number;
  }[];
  winner: string;
  insights: string[];
  dimensions: Record<string, { values: Record<string, number>; best: string; worst: string }>;
}
