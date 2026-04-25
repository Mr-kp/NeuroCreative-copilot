import type { DashboardResponse, CopilotApiResponse, AnalyzedCreative, DashboardSummary } from "@/types/dashboard";

const API_BASE = "/api";

// ─── Upload + Analyze ──────────────────────────────────────────────────────

export async function analyzeCreatives(
  formData: FormData
): Promise<DashboardResponse> {
  const res = await fetch(`${API_BASE}/analyze-creatives-upload`, {
    method: "POST",
    body: formData,
    // No Content-Type header — browser sets multipart boundary automatically
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error || `Server returned ${res.status}`);
  }

  return res.json();
}

// ─── Ask Copilot ───────────────────────────────────────────────────────────

export interface AskCopilotPayload {
  question: string;
  selectedCreative: AnalyzedCreative;
  dashboardContext?: {
    filters?: Record<string, unknown>;
    portfolio_recommendations?: string[];
    dashboard_summary?: DashboardSummary;
  };
}

export async function askCopilot(
  payload: AskCopilotPayload
): Promise<CopilotApiResponse> {
  const res = await fetch(`${API_BASE}/ask-copilot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error || `Server returned ${res.status}`);
  }

  return res.json();
}
