import type { DashboardResponse, CopilotApiResponse, AnalyzedCreative, DashboardSummary } from "@/types/dashboard";

const API_BASE = "/api";

// ─── Upload + Analyze ──────────────────────────────────────────────────────

export async function analyzeCreatives(
  formData: FormData
): Promise<DashboardResponse> {
  const res = await fetch(`${API_BASE}/analyze-creatives-upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error || `Server returned ${res.status}`);
  }

  const data = await res.json();

  if (data.pipeline_log && Array.isArray(data.pipeline_log)) {
    console.log("[pipeline]", data.pipeline_log.join("\n"));
    delete data.pipeline_log;
  }

  return data as DashboardResponse;
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

export interface CopilotStreamCallbacks {
  onToken: (text: string) => void;
  onDone: (response: CopilotApiResponse) => void;
  onError: (error: string) => void;
}

export async function askCopilotStream(
  payload: AskCopilotPayload,
  callbacks: CopilotStreamCallbacks
): Promise<void> {
  const res = await fetch(`${API_BASE}/ask-copilot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    callbacks.onError(body.error || `Server returned ${res.status}`);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError("No response stream");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let finalResponse: CopilotApiResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("event: token")) {
        continue;
      }
      if (line.startsWith("data: ")) {
        const raw = line.slice(6);
        try {
          const parsed = JSON.parse(raw);
          if (parsed.text) {
            callbacks.onToken(parsed.text);
          }
        } catch {}
      }
      if (line.startsWith("event: done")) {
        continue;
      }
      if (line.startsWith("data: ") && line.includes("suggested_action")) {
        try {
          finalResponse = JSON.parse(line.slice(6));
        } catch {}
      }
    }
  }

  if (finalResponse) {
    callbacks.onDone(finalResponse);
  } else {
    callbacks.onError("No final response received");
  }
}
